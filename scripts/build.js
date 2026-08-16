#!/usr/bin/env node
// Scans /data, builds a masonry page per folder, and writes everything to /dist.
// Run automatically by .github/workflows/deploy.yml on every push.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderFolderPage,
  renderHomePage,
  render404Page,
} from "./templates.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT, "data");
const DIST_DIR = path.join(ROOT, "dist");
const ASSETS_SRC = path.join(ROOT, "src", "assets");

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"]);
const VIDEO_EXT = new Set([".mp4", ".webm"]);

function loadConfig() {
  const configPath = path.join(ROOT, "site.config.json");
  const defaults = {
    title: "graphics site",
    description: "",
    accent: "#ff8fb3",
    order: [],
    footer: "",
  };
  if (!fs.existsSync(configPath)) return defaults;
  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { ...defaults, ...parsed };
}

function titleize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "folder";
}

// Natural sort so "img2" sorts before "img10".
function naturalCompare(a, b) {
  const chunk = (s) => s.split(/(\d+)/).map((c) => (/^\d+$/.test(c) ? parseInt(c, 10) : c));
  const ca = chunk(a);
  const cb = chunk(b);
  const len = Math.max(ca.length, cb.length);
  for (let i = 0; i < len; i++) {
    const x = ca[i];
    const y = cb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    if (typeof x === typeof y) return x < y ? -1 : 1;
    return typeof x === "number" ? -1 : 1;
  }
  return 0;
}

function readFolderMeta(folderPath) {
  const metaPath = path.join(folderPath, "_meta.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    console.warn(`Could not parse ${metaPath}: ${err.message}`);
    return {};
  }
}

function mediaKind(ext) {
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return null;
}

function scanFolders() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."));

  const usedSlugs = new Set();

  return entries.map((entry) => {
    const folderPath = path.join(DATA_DIR, entry.name);
    const meta = readFolderMeta(folderPath);

    let files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter((f) => f.isFile() && !f.name.startsWith(".") && f.name !== "_meta.json")
      .map((f) => f.name)
      .filter((name) => mediaKind(path.extname(name).toLowerCase()) !== null);

    if (Array.isArray(meta.order) && meta.order.length) {
      const ordered = meta.order.filter((name) => files.includes(name));
      const rest = files.filter((name) => !ordered.includes(name)).sort(naturalCompare);
      files = [...ordered, ...rest];
    } else {
      files = files.sort(naturalCompare);
    }

    let slug = slugify(entry.name);
    while (usedSlugs.has(slug)) slug = `${slug}-2`;
    usedSlugs.add(slug);

    const items = files.map((file) => ({
      file,
      folderSlug: slug,
      kind: mediaKind(path.extname(file).toLowerCase()),
      label: path.parse(file).name.replace(/[-_]+/g, " "),
    }));

    return {
      name: entry.name,
      slug,
      title: meta.title || titleize(entry.name),
      description: meta.description || "",
      items,
    };
  });
}

function orderFolders(folders, order) {
  const bySlug = new Map(folders.map((f) => [f.slug, f]));
  const bySlugFromName = new Map(folders.map((f) => [slugify(f.name), f]));
  const ordered = [];
  for (const key of order) {
    const slug = slugify(key);
    const folder = bySlug.get(slug) || bySlugFromName.get(slug);
    if (folder && !ordered.includes(folder)) ordered.push(folder);
  }
  const rest = folders
    .filter((f) => !ordered.includes(f))
    .sort((a, b) => a.title.localeCompare(b.title));
  return [...ordered, ...rest];
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest, { skip } = {}) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip && skip(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d, { skip });
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(DIST_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

export function build() {
  const start = Date.now();
  const config = loadConfig();
  const rawFolders = scanFolders();
  const folders = orderFolders(rawFolders, config.order || []);

  rmrf(DIST_DIR);
  fs.mkdirSync(DIST_DIR, { recursive: true });

  copyRecursive(ASSETS_SRC, path.join(DIST_DIR, "assets"));
  copyRecursive(DATA_DIR, path.join(DIST_DIR, "data"), {
    skip: (name) => name.startsWith(".") || name === "_meta.json",
  });

  writeFile("index.html", renderHomePage({ config, folders }));
  writeFile("404.html", render404Page({ config, folders }));

  for (const folder of folders) {
    writeFile(`${folder.slug}/index.html`, renderFolderPage({ folder, folders, config }));
  }

  const itemCount = folders.reduce((sum, f) => sum + f.items.length, 0);
  console.log(
    `Built ${folders.length} folder page(s), ${itemCount} item(s) in ${Date.now() - start}ms -> ${path.relative(ROOT, DIST_DIR)}/`
  );
}

function watch() {
  build();
  const targets = [DATA_DIR, path.join(ROOT, "src"), path.join(ROOT, "site.config.json")];
  let pending = null;
  const trigger = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error(err);
      }
    }, 150);
  };
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    try {
      fs.watch(target, { recursive: true }, trigger);
    } catch {
      fs.watch(target, trigger);
    }
  }
  console.log("Watching for changes... (Ctrl+C to stop)");
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes("--watch")) {
    watch();
  } else {
    build();
  }
}

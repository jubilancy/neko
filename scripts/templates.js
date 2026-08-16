// HTML string builders used by build.js. Kept dependency-free on purpose.

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function navLink(href, label, activeSlug, slug) {
  const active = activeSlug === slug ? ' class="active"' : "";
  return `<a href="${href}"${active}>${escapeHtml(label)}</a>`;
}

export function renderNav(folders, activeSlug) {
  const links = [navLink("/", "Home", activeSlug, "")];
  for (const folder of folders) {
    links.push(navLink(`/${folder.slug}/`, folder.title, activeSlug, folder.slug));
  }
  return `<nav class="site-nav">${links.join("\n      ")}</nav>`;
}

export function renderLayout({ title, description, activeSlug, bodyContent, config, folders }) {
  const pageTitle = title ? `${title} — ${config.title}` : config.title;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description || config.description || "")}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%90%B1%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body style="--accent: ${escapeHtml(config.accent || "#ff8fb3")}">
  <header class="site-header">
    <a class="site-title" href="/">${escapeHtml(config.title)}</a>
    ${renderNav(folders, activeSlug)}
  </header>
  <main>
${bodyContent}
  </main>
  <footer class="site-footer">
    <p>${escapeHtml(config.footer || "")}</p>
  </footer>
  <div id="lightbox" class="lightbox" hidden>
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-prev" aria-label="Previous">&#8249;</button>
    <div class="lightbox-stage"></div>
    <button type="button" class="lightbox-next" aria-label="Next">&#8250;</button>
    <p class="lightbox-caption"></p>
  </div>
  <script src="/assets/js/lightbox.js"></script>
</body>
</html>
`;
}

function mediaTag(item) {
  const src = `/data/${item.folderSlug}/${encodeURIComponent(item.file)}`;
  const alt = escapeHtml(item.label);
  if (item.kind === "video") {
    return `<video src="${src}" muted loop playsinline preload="metadata"></video>`;
  }
  return `<img src="${src}" alt="${alt}" loading="lazy">`;
}

export function renderGridItem(item, index) {
  const src = `/data/${item.folderSlug}/${encodeURIComponent(item.file)}`;
  return `      <a class="grid-item" href="${src}" data-lightbox data-index="${index}" data-kind="${item.kind}" data-caption="${escapeHtml(item.label)}">
        ${mediaTag(item)}
      </a>`;
}

export function renderFolderPage({ folder, folders, config }) {
  const items = folder.items;
  const grid = items.length
    ? `    <div class="grid">
${items.map((item, i) => renderGridItem(item, i)).join("\n")}
    </div>`
    : `    <p class="empty-state">This folder is empty. Drop images or videos into <code>data/${escapeHtml(folder.name)}/</code> and push to add graphics here.</p>`;

  const body = `    <section class="folder-header">
      <h1>${escapeHtml(folder.title)}</h1>
      ${folder.description ? `<p class="folder-description">${escapeHtml(folder.description)}</p>` : ""}
      <p class="item-count">${items.length} item${items.length === 1 ? "" : "s"}</p>
    </section>
${grid}`;

  return renderLayout({
    title: folder.title,
    description: folder.description,
    activeSlug: folder.slug,
    bodyContent: body,
    config,
    folders,
  });
}

function folderCard(folder) {
  const cover = folder.items[0];
  const thumb = cover
    ? `<img src="/data/${folder.slug}/${encodeURIComponent(cover.file)}" alt="" loading="lazy">`
    : `<span class="folder-card-placeholder">?</span>`;
  return `      <a class="folder-card" href="/${folder.slug}/">
        <div class="folder-card-thumb">${thumb}</div>
        <h2>${escapeHtml(folder.title)}</h2>
        <p>${folder.items.length} item${folder.items.length === 1 ? "" : "s"}</p>
      </a>`;
}

export function renderHomePage({ config, folders }) {
  const cards = folders.length
    ? `    <div class="folder-grid">
${folders.map(folderCard).join("\n")}
    </div>`
    : `    <p class="empty-state">No folders yet. Create a folder under <code>data/</code> (e.g. <code>data/pixels/</code>) and push to generate its page.</p>`;

  const body = `    <section class="hero">
      <h1>${escapeHtml(config.title)}</h1>
      ${config.description ? `<p>${escapeHtml(config.description)}</p>` : ""}
    </section>
${cards}`;

  return renderLayout({
    title: "",
    description: config.description,
    activeSlug: "",
    bodyContent: body,
    config,
    folders,
  });
}

export function render404Page({ config, folders }) {
  const body = `    <section class="hero">
      <h1>404</h1>
      <p>That page doesn't exist. <a href="/">Go home</a>.</p>
    </section>`;
  return renderLayout({
    title: "Not Found",
    description: "Page not found",
    activeSlug: "",
    bodyContent: body,
    config,
    folders,
  });
}

(function () {
  var lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  var stage = lightbox.querySelector(".lightbox-stage");
  var caption = lightbox.querySelector(".lightbox-caption");
  var closeBtn = lightbox.querySelector(".lightbox-close");
  var prevBtn = lightbox.querySelector(".lightbox-prev");
  var nextBtn = lightbox.querySelector(".lightbox-next");

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var current = -1;

  function render(index) {
    var el = items[index];
    if (!el) return;
    current = index;
    var src = el.getAttribute("href");
    var kind = el.getAttribute("data-kind");
    var label = el.getAttribute("data-caption") || "";

    stage.innerHTML = "";
    var media;
    if (kind === "video") {
      media = document.createElement("video");
      media.src = src;
      media.controls = true;
      media.autoplay = true;
      media.loop = true;
    } else {
      media = document.createElement("img");
      media.src = src;
      media.alt = label;
    }
    stage.appendChild(media);
    caption.textContent = label;
  }

  function open(index) {
    render(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.hidden = true;
    stage.innerHTML = "";
    document.body.style.overflow = "";
  }

  function step(delta) {
    if (!items.length) return;
    var next = (current + delta + items.length) % items.length;
    render(next);
  }

  items.forEach(function (el, index) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      open(index);
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () {
    step(-1);
  });
  nextBtn.addEventListener("click", function () {
    step(1);
  });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();

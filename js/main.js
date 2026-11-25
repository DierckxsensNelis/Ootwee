window.addEventListener("load", function() {
  const images = document.querySelectorAll(".fade-in");
  images.forEach(img => img.classList.add("loaded"));
});

function fitProfilePhotos() {
  document.querySelectorAll(".profile-img").forEach((img) => {
    img.style.height = img.style.marginBottom = "";
    if (getComputedStyle(img).float === "none") return; // phone layout: photo sits above the text
    const natural = img.offsetWidth * 5 / 4;
    img.style.height = "100000px"; // temporarily put every paragraph beside the photo to measure where each ends
    const top = img.getBoundingClientRect().top;
    const ends = [...img.parentElement.querySelectorAll(":scope > p")].map((p) => p.getBoundingClientRect().bottom - top);
    const options = ends.filter((end) => end >= natural * 0.6); // never shrink the photo to a sliver
    const pool = options.length ? options : ends.slice(-1);
    img.style.height = pool.reduce((a, b) => (Math.abs(b - natural) < Math.abs(a - natural) ? b : a)) + "px";
    img.style.marginBottom = "0"; // the next paragraph's own top margin is the gap below the photo
  });
}
document.fonts.ready.then(fitProfilePhotos);
window.addEventListener("resize", fitProfilePhotos);


const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("main-nav");

if (toggle && nav) {
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu");
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
  }

  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));

  nav.querySelectorAll(".has-submenu").forEach((group) => {
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-expanded", "false");
    const fold = () => {
      if (!toggle.offsetParent) return;
      group.setAttribute("aria-expanded", group.classList.toggle("expanded"));
    };
    group.addEventListener("click", (event) => {
      if (!event.target.closest(".submenu")) fold();
    });
    group.addEventListener("keydown", (event) => {
      if (event.target === group && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        fold();
      }
    });
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.lenis = new Lenis({
    anchors: true
  });

  function raf(time) {
    window.lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

const roomButtons = Array.from(document.querySelectorAll(".room-btn"));
const lightbox = document.querySelector(".lightbox");

if (lightbox && roomButtons.length) {
  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");
  let current = 0;

  const locations = roomButtons.map((button) => {
    let el = button.previousElementSibling;
    while (el && !el.classList.contains("gallery-title")) el = el.previousElementSibling;
    return el ? el.textContent.trim() : "";
  });

  function showPhoto(index, opening = false) {
    const previousLocation = locations[current];
    current = (index + roomButtons.length) % roomButtons.length;
    const img = roomButtons[current].querySelector("img");
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;

    lightboxCaption.textContent = locations[current];
    if (!opening && locations[current] !== previousLocation) {
      lightboxCaption.classList.remove("is-new");
      void lightboxCaption.offsetWidth;
      lightboxCaption.classList.add("is-new");
    }
  }

  roomButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showPhoto(index, true);
      lightbox.showModal();
      if (window.lenis) window.lenis.stop();
    });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let sliding = false;

  async function slide(step, fromX = 0) {
    if (sliding) return;
    if (reduceMotion) return showPhoto(current + step);
    sliding = true;
    const out = -step * window.innerWidth * 0.6;
    const leave = lightboxImg.animate(
      [{ transform: `translateX(${fromX}px)` }, { transform: `translateX(${out}px)`, opacity: 0 }],
      { duration: 180, easing: "ease-in", fill: "forwards" }
    );
    await leave.finished;
    showPhoto(current + step);
    await lightboxImg.decode().catch(() => {});
    lightboxImg.style.transform = "";
    leave.cancel();
    await lightboxImg.animate(
      [{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
      { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
    ).finished;
    sliding = false;
  }

  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => slide(-1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => slide(1));

  let swipeStartX = null;
  let swipeX = 0;
  lightboxImg.addEventListener("touchstart", (event) => {
    if (sliding || event.touches.length > 1) return;
    swipeStartX = event.touches[0].clientX;
    swipeX = 0;
  }, { passive: true });
  lightboxImg.addEventListener("touchmove", (event) => {
    if (swipeStartX === null) return;
    swipeX = event.touches[0].clientX - swipeStartX;
    lightboxImg.style.transform = `translateX(${swipeX}px)`;
  }, { passive: true });
  lightboxImg.addEventListener("touchend", () => {
    if (swipeStartX === null) return;
    swipeStartX = null;
    if (Math.abs(swipeX) > 60) return slide(swipeX < 0 ? 1 : -1, swipeX);
    lightboxImg.animate(
      [{ transform: `translateX(${swipeX}px)` }, { transform: "translateX(0)" }],
      { duration: 200, easing: "ease-out" }
    );
    lightboxImg.style.transform = "";
  });
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") slide(-1);
    if (event.key === "ArrowRight") slide(1);
  });

  lightbox.addEventListener("close", () => {
    if (window.lenis) window.lenis.start();
    roomButtons[current].focus();
  });
}

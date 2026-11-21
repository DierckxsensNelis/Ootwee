window.addEventListener("load", function() {
  const images = document.querySelectorAll(".fade-in");
  images.forEach(img => img.classList.add("loaded"));
});


const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("main-nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

// Close the menu after tapping a link
nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

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
  let current = 0;

  function showPhoto(index) {
    current = (index + roomButtons.length) % roomButtons.length;
    const img = roomButtons[current].querySelector("img");
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
  }

  roomButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showPhoto(index);
      lightbox.showModal();
      if (window.lenis) window.lenis.stop();
    });
  });

  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showPhoto(current - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showPhoto(current + 1));
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(current - 1);
    if (event.key === "ArrowRight") showPhoto(current + 1);
  });

  lightbox.addEventListener("close", () => {
    if (window.lenis) window.lenis.start();
    roomButtons[current].focus();
  });
}

const images = document.querySelectorAll("[data-src]");

function preloadImage(img) {
  const src = img.getAttribute("data-src");
  if (!src) {
    return;
  }
  img.src = src;
}
const options = {
  threshold: 1,
  rootMargin: "0px 0px 200px 0px"
};
const imageObserver = new IntersectionObserver((entries, imageObserver) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    } else {
      preloadImage(entry.target);
      imageObserver.unobserve(entry.target);
    }
  });
}, options);
images.forEach(img => imageObserver.observe(img));
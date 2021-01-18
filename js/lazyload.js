
if ("IntersectionObserver" in window) {
  const options = {
    threshold: 1,
    rootMargin: "0px 0px 200px 0px"
  };
  const images = document.querySelectorAll("[data-src]");
  const imageObserver = new IntersectionObserver((entries, imageObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        imageObserver.unobserve(lazyImage);
      }
    });
  }, options);
  images.forEach(img => imageObserver.observe(img));  
} else{
  console.log('IntersectionObserver is not supported.');
}

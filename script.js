window.addEventListener("load", () => {
  if (sessionStorage.getItem("loginAnimationDone")) {
    document.body.classList.add("animation-done");
  } else {
    setTimeout(() => {
      document.body.classList.add("animation-done");
      sessionStorage.setItem("loginAnimationDone", "true");
    }, 3700);
  }
});
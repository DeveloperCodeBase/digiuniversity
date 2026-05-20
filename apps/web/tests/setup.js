import "@testing-library/jest-dom";

// Polyfill window.toast/confirmAction for tests
if (typeof window !== "undefined") {
  window.toast = window.toast || (() => {});
  window.confirmAction = window.confirmAction || (() => Promise.resolve(true));
  window.openCommandPalette = window.openCommandPalette || (() => {});
}

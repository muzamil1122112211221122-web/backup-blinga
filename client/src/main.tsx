import { imagesReady } from "./preload-images";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Wait for the static icon/avatar set to finish loading (capped at 1.5s)
// before revealing transitions/animations, so icons don't visibly pop in.
imagesReady.then(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('preload');
    });
  });
});

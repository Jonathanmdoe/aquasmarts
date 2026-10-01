import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Offline support: only on the published app (never inside the editor preview).
const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const isPreviewHost = /id-preview--|lovableproject\.com|localhost/.test(window.location.hostname);
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD && !inIframe && !isPreviewHost) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  } else {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
}

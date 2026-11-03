import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const application = (
  <StrictMode>
    <App page={window.location.pathname === `${import.meta.env.BASE_URL}experience.html` ? "experience" : "home"} />
  </StrictMode>
);

const root = document.getElementById("root");
if (root.hasChildNodes()) {
  hydrateRoot(root, application);
} else {
  createRoot(root).render(application);
}

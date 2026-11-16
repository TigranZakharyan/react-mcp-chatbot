import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { installMockApi } from "@demo/mockApi";
import { App } from "./App";
import "./styles.css";

// The live demos use an in-browser fake backend + fake "demo mode" model. See demo/src/mockApi.ts.
installMockApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

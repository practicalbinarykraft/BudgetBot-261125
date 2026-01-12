import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundaryWrapper } from "./components/ErrorBoundary";

// Validate environment variables on startup
import "./lib/env";

// Initialize Sentry (after env validation)
import { initSentry } from "./lib/sentry";
initSentry();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundaryWrapper>
    <App />
  </ErrorBoundaryWrapper>
);

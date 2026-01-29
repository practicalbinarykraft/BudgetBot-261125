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

console.log('[main] Starting app...');
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[main] Root element not found!');
} else {
  console.log('[main] Root element found, rendering App...');
  createRoot(rootElement).render(
    <ErrorBoundaryWrapper>
      <App />
    </ErrorBoundaryWrapper>
  );
}

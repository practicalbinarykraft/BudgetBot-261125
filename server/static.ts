/**
 * Static file serving for production
 * Serves pre-built client files from dist/public
 */
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logInfo } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  logInfo(message, { source });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Favicon — long cache, rarely changes
  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
    res.setHeader('Content-Type', 'image/x-icon');
    res.sendFile(path.resolve(distPath, 'favicon.ico'));
  });

  // SW and manifest must not be cached by browser (so updates propagate immediately)
  app.get('/sw.js', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.resolve(distPath, 'sw.js'));
  });

  app.get('/manifest.json', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.resolve(distPath, 'manifest.json'));
  });

  app.use(express.static(distPath, {
    // Don't serve index.html for static file requests
    index: false,
  }));

  // fall through to index.html only for non-API and non-asset requests
  app.use("*", (req, res, next) => {
    const url = req.originalUrl;

    // Skip fallback for API routes, static assets, and module requests
    if (
      url.startsWith("/api/") ||
      url.startsWith("/socket.io/") ||
      url.startsWith("/@") ||
      url.startsWith("/src/") ||
      url.startsWith("/assets/") ||
      (url.includes(".") && !url.endsWith(".html")) // Has extension but not HTML
    ) {
      return next();
    }

    // For all other routes (SPA routes), serve index.html
    // This allows client-side routing to work
    const indexPath = path.resolve(distPath, "index.html");
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({
        error: "Not Found",
        message: "index.html not found. Make sure to build the client first.",
      });
    }

    res.sendFile(indexPath);
  });
}

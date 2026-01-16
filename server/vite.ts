import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // SPA fallback middleware - handles SPA routes BEFORE Vite
  // This ensures /admin/analytics etc. get index.html immediately
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip for:
    // - API routes
    // - WebSocket
    // - Vite internal paths (@vite, @fs, @id, etc.)
    // - Source files (/src/)
    // - Assets (/assets/)
    // - Any file with extension (JS, CSS, images, etc.)
    if (
      url.startsWith("/api/") ||
      url.startsWith("/socket.io/") ||
      url.startsWith("/@") ||
      url.startsWith("/src/") ||
      url.startsWith("/assets/") ||
      url.includes(".")
    ) {
      return next();
    }

    // Check if URL has a file extension (but not .html)
    const pathWithoutQuery = url.split('?')[0];
    const hasFileExtension = /\.\w+$/.test(pathWithoutQuery);
    
    // If it's a file request (has extension and not .html), let Vite handle it
    if (hasFileExtension && !pathWithoutQuery.endsWith('.html')) {
      return next();
    }

    // For SPA routes (no extension or .html), serve index.html immediately
    // This allows client-side routing to work
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      // Preserve security headers set by securityHeaders middleware
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
      return; // Don't continue to next middleware
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  // Vite middleware handles all file requests (JS, CSS, images, etc.)
  // It runs after SPA fallback, so file requests are handled correctly
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

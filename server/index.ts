import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { registerRoutes } from "./mongodb-routes";
import { setupAuth } from "./auth";
import { mongoStorage } from "./mongodb-storage";
import { setupVite, serveStatic, log } from "./vite";
import { connectToMongoDB } from "./mongodb";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint for Render
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJson: Record<string, any> | undefined;
  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJson = body;
    return originalJson.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      let msg = `${req.method} ${reqPath} ${res.statusCode} in ${Date.now() - start}ms`;
      if (capturedJson) msg += ` :: ${JSON.stringify(capturedJson)}`;
      log(msg);
    }
  });
  next();
});

(async () => {
  await connectToMongoDB();

  // Trust proxy for secure cookies (Render)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      store: mongoStorage.sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Passport auth setup
  setupAuth(app);

  // Register API routes
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  // Dev vs Prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();

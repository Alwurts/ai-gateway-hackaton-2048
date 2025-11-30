import { Hono } from "hono";
import { cors } from "hono/cors";
import { BASE_URL } from "@/lib/config";
import publicRoutes from "./routes/public";
import matchesRoutes from "./routes/public/matches";

export const app = new Hono().basePath("/api").use(
	"*",
	cors({
		origin: BASE_URL,
		allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

// Add both public and protected routes
const routes = app.route("/", publicRoutes).route("/matches", matchesRoutes);

export type AppType = typeof routes;

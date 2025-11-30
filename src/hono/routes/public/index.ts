import { Hono } from "hono";
import type { HonoContext } from "@/types/hono";
import aiMoveRoutes from "./ai-move";
import contactRoutes from "./contact";
import statusRoutes from "./status";

const publicRoutes = new Hono<HonoContext>()
	.route("/status", statusRoutes)
	.route("/contact", contactRoutes)
	.route("/ai-move", aiMoveRoutes);

export default publicRoutes;

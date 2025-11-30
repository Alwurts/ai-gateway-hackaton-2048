import { Hono } from "hono";
import aiMoveRoutes from "./ai-move";


const publicRoutes = new Hono()
	.route("/ai-move", aiMoveRoutes);

export default publicRoutes;

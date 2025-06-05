import express from "express";
import path from "path";
import { conversionRouter } from "./infrastructure/http/routes/conversion.routes";
import { errorHandler } from "./infrastructure/http/middlewares/errorHandler";
import { ErrorRequestHandler } from "express";

const app = express();
const PORT = process.env.PORT || 2200;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve converted files statically
const publicDir = path.join(__dirname, "./infrastructure/public");
app.use(express.static(publicDir));

// API Routes
app.use("/api/convert", conversionRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

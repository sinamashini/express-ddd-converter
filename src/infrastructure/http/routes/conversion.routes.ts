import { Router } from "express";
import { ConversionController } from "../controllers/ConversionController.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";
import { ConvertFileUseCase } from "../../../application/use-cases/ConvertFileUseCase.js";
import { FileConversionService } from "../../services/FileConversionService.js";

// Simple middleware to ensure the request has a multipart/form-data Content-Type
function ensureMultipart(req: any, res: any, next: any) {
  const ct = req.headers && req.headers['content-type'];
  if (!ct || typeof ct !== 'string' || ct.indexOf('multipart/form-data') === -1) {
    return res.status(400).json({ message: 'Bad Request: Content-Type must be multipart/form-data with a boundary. Use form-data multipart uploads.' });
  }
  next();
}

const router = Router();

// --- Dependency Injection ---
const fileConversionService = new FileConversionService();
const convertFileUseCase = new ConvertFileUseCase(fileConversionService);
const conversionController = new ConversionController(convertFileUseCase);

// --- Routes ---
router.post(
  "/md-to-pdf",
  ensureMultipart,
  uploadMiddleware(".md"),
  async (req, res, next) => {
    try {
      await conversionController.mdToPdf(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/pdf-to-md",
  ensureMultipart,
  uploadMiddleware(".pdf"),
  async (req, res, next) => {
    try {
      await conversionController.pdfToMd(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/pdf-to-txt",
  ensureMultipart,
  uploadMiddleware(".pdf"),
  async (req, res, next) => {
    try {
      await conversionController.pdfToTxt(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/pdf-to-word",
  ensureMultipart,
  uploadMiddleware(".pdf"),
  async (req, res, next) => {
    try {
      await conversionController.pdfToWord(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export { router as conversionRouter };

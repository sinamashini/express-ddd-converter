import { Router } from "express";
import { ConversionController } from "../controllers/ConversionController";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { ConvertFileUseCase } from "../../../application/use-cases/ConvertFileUseCase";
import { FileConversionService } from "../../services/FileConversionService";

const router = Router();

// --- Dependency Injection ---
const fileConversionService = new FileConversionService();
const convertFileUseCase = new ConvertFileUseCase(fileConversionService);
const conversionController = new ConversionController(convertFileUseCase);

// --- Routes ---
router.post("/md-to-pdf", uploadMiddleware(".md"), async (req, res, next) => {
  try {
    await conversionController.mdToPdf(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post("/pdf-to-md", uploadMiddleware(".pdf"), async (req, res, next) => {
  try {
    await conversionController.pdfToMd(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post("/pdf-to-txt", uploadMiddleware(".pdf"), async (req, res, next) => {
  try {
    await conversionController.pdfToTxt(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/pdf-to-word",
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversionRouter = void 0;
const express_1 = require("express");
const ConversionController_1 = require("../controllers/ConversionController");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const ConvertFileUseCase_1 = require("../../../application/use-cases/ConvertFileUseCase");
const FileConversionService_1 = require("../../services/FileConversionService");
// Simple middleware to ensure the request has a multipart/form-data Content-Type
function ensureMultipart(req, res, next) {
    const ct = req.headers && req.headers['content-type'];
    if (!ct || typeof ct !== 'string' || ct.indexOf('multipart/form-data') === -1) {
        return res.status(400).json({ message: 'Bad Request: Content-Type must be multipart/form-data with a boundary. Use form-data multipart uploads.' });
    }
    next();
}
const router = (0, express_1.Router)();
exports.conversionRouter = router;
// --- Dependency Injection ---
const fileConversionService = new FileConversionService_1.FileConversionService();
const convertFileUseCase = new ConvertFileUseCase_1.ConvertFileUseCase(fileConversionService);
const conversionController = new ConversionController_1.ConversionController(convertFileUseCase);
// --- Routes ---
router.post("/md-to-pdf", ensureMultipart, (0, upload_middleware_1.uploadMiddleware)(".md"), async (req, res, next) => {
    try {
        await conversionController.mdToPdf(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post("/pdf-to-md", ensureMultipart, (0, upload_middleware_1.uploadMiddleware)(".pdf"), async (req, res, next) => {
    try {
        await conversionController.pdfToMd(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post("/pdf-to-txt", ensureMultipart, (0, upload_middleware_1.uploadMiddleware)(".pdf"), async (req, res, next) => {
    try {
        await conversionController.pdfToTxt(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post("/pdf-to-word", ensureMultipart, (0, upload_middleware_1.uploadMiddleware)(".pdf"), async (req, res, next) => {
    try {
        await conversionController.pdfToWord(req, res, next);
    }
    catch (err) {
        next(err);
    }
});

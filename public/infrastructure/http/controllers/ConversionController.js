"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionController = void 0;
class ConversionController {
    convertFileUseCase;
    constructor(convertFileUseCase) {
        this.convertFileUseCase = convertFileUseCase;
    }
    handleConversion = async (req, res, next, type) => {
        try {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ message: "No file uploaded." });
            }
            // pass buffer and original name to use case
            const downloadUrl = await this.convertFileUseCase.execute(req.file.buffer, req.file.originalname, type);
            const ttlMinutes = 30;
            const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
            const finalUrl = downloadUrl.startsWith("http")
                ? downloadUrl
                : `${req.protocol}://${req.get("host")}${downloadUrl}`;
            res.status(200).json({
                message: `File converted successfully. This link is available for ${ttlMinutes} minutes.`,
                downloadUrl: finalUrl,
                expiresAt,
            });
        }
        catch (error) {
            next(error);
        }
    };
    mdToPdf = (req, res, next) => this.handleConversion(req, res, next, "md-to-pdf");
    pdfToMd = (req, res, next) => this.handleConversion(req, res, next, "pdf-to-md");
    pdfToTxt = (req, res, next) => this.handleConversion(req, res, next, "pdf-to-txt");
    pdfToWord = (req, res, next) => this.handleConversion(req, res, next, "pdf-to-word");
}
exports.ConversionController = ConversionController;

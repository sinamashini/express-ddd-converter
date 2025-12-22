"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileConversionService = void 0;
const md_to_pdf_1 = require("md-to-pdf");
const pdf2md_1 = __importDefault(require("@opendocsg/pdf2md"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
class FileConversionService {
    async mdToPdf(data, options) {
        const direction = options?.direction === "rtl" ? "rtl" : "ltr";
        let content = data.toString();
        if (direction === "rtl") {
            content = `<div dir="rtl" style="direction: rtl; unicode-bidi: bidi-override; text-align: right;">\n\n${content}\n\n</div>`;
        }
        const pdf = await (0, md_to_pdf_1.mdToPdf)({ content });
        return pdf.content;
    }
    async pdfToMd(data) {
        const markdown = await (0, pdf2md_1.default)(data);
        return markdown;
    }
    async pdfToTxt(data) {
        const result = await (0, pdf_parse_1.default)(data);
        return result.text;
    }
    async pdfToWord(data) {
        // NOTE: PDF-to-Word conversion is complex.
        // This is a placeholder for a real implementation using a library
        // like LibreOffice headless or a third-party API.
        console.log("Simulating PDF to DOCX conversion for:", data.toString("base64").substring(0, 30) + "...");
        const placeholderContent = "This is a simulated DOCX file.";
        return Buffer.from(placeholderContent);
    }
}
exports.FileConversionService = FileConversionService;

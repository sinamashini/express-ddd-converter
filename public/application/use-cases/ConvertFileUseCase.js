"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertFileUseCase = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const storageService_1 = require("../../infrastructure/storage/storageService");
const outputExtensions = {
    "md-to-pdf": ".pdf",
    "pdf-to-md": ".md",
    "pdf-to-txt": ".txt",
    "pdf-to-word": ".docx",
};
class ConvertFileUseCase {
    conversionService;
    constructor(conversionService) {
        this.conversionService = conversionService;
    }
    // new signature: accept uploaded buffer and original filename
    async execute(fileBuffer, originalName, type) {
        let outputBuffer;
        switch (type) {
            case "md-to-pdf":
                outputBuffer = await this.conversionService.mdToPdf(fileBuffer);
                break;
            case "pdf-to-md":
                outputBuffer = await this.conversionService.pdfToMd(fileBuffer);
                break;
            case "pdf-to-txt":
                outputBuffer = await this.conversionService.pdfToTxt(fileBuffer);
                break;
            case "pdf-to-word":
                outputBuffer = await this.conversionService.pdfToWord(fileBuffer);
                break;
            default:
                throw new Error("Unsupported conversion type");
        }
        // create unique filename to avoid collisions (originalName + random suffix)
        const baseName = path_1.default.basename(originalName, path_1.default.extname(originalName));
        const uniqueSuffix = (0, crypto_1.randomBytes)(4).toString("hex");
        const outputFileName = `${baseName}-${uniqueSuffix}${outputExtensions[type]}`;
        // Ensure the output directory exists (used as fallback)
        const convertedDir = path_1.default.join(__dirname, "../../infrastructure/public/converted");
        await promises_1.default.mkdir(convertedDir, { recursive: true });
        // Try S3 first using the storage service helpers
        const tmpKey = `tmp/${baseName}-${uniqueSuffix}${path_1.default.extname(originalName)}`;
        const outKey = `generated/${outputFileName}`;
        const inputBody = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(String(fileBuffer));
        try {
            await (0, storageService_1.uploadTmp)(tmpKey, inputBody, getContentType(originalName));
            const outBody = Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(String(outputBuffer));
            const uploaded = await (0, storageService_1.uploadGenerated)(outKey, outBody, getContentType(outputFileName));
            if (uploaded) {
                const publicUrl = (0, storageService_1.getPublicUrlForKey)(outKey);
                if (publicUrl)
                    return publicUrl;
            }
        }
        catch (e) {
            console.warn('Storage upload failed, falling back to local write:', e.message);
        }
        // Local fallback: write converted file to `infrastructure/public/converted`
        await (0, storageService_1.ensureConvertedDir)();
        return await (0, storageService_1.writeLocalConverted)(outputFileName, Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(String(outputBuffer)));
    }
}
exports.ConvertFileUseCase = ConvertFileUseCase;
function getContentType(filename) {
    if (filename.endsWith('.pdf'))
        return 'application/pdf';
    if (filename.endsWith('.md'))
        return 'text/markdown';
    if (filename.endsWith('.txt'))
        return 'text/plain';
    if (filename.endsWith('.docx'))
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return 'application/octet-stream';
}

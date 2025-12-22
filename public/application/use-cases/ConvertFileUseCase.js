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
const storageService_2 = require("../../infrastructure/storage/storageService");
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
    async execute(fileBuffer, originalName, type, options) {
        let outputBuffer;
        switch (type) {
            case "md-to-pdf":
                outputBuffer = await this.conversionService.mdToPdf(fileBuffer, {
                    direction: options?.direction,
                });
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
        // Normalize different possible output types (Buffer, string, Uint8Array)
        const toBuffer = (data) => {
            if (Buffer.isBuffer(data))
                return data;
            if (typeof data === "string")
                return Buffer.from(data);
            if (data instanceof Uint8Array)
                return Buffer.from(data);
            return Buffer.from(String(data));
        };
        // create unique filename to avoid collisions (originalName + random suffix)
        const baseName = path_1.default.basename(originalName, path_1.default.extname(originalName));
        const uniqueSuffix = (0, crypto_1.randomBytes)(4).toString("hex");
        const outputFileName = `${baseName}-${uniqueSuffix}${outputExtensions[type]}`;
        // Ensure the output directory exists (used as fallback)
        const convertedDir = path_1.default.join(__dirname, "../../infrastructure/public/converted");
        await promises_1.default.mkdir(convertedDir, { recursive: true });
        // Try S3 first using the storage service helpers
        const tmpKey = `tmp/${baseName}-${uniqueSuffix}${path_1.default.extname(originalName)}`;
        // upload generated outputs under the `converted/` prefix so URLs match expectations
        const outKey = `converted/${outputFileName}`;
        const inputBody = toBuffer(fileBuffer);
        try {
            await (0, storageService_1.uploadTmp)(tmpKey, inputBody, (0, storageService_2.getContentType)(originalName));
            const outBody = toBuffer(outputBuffer);
            const uploaded = await (0, storageService_1.uploadGenerated)(outKey, outBody, (0, storageService_2.getContentType)(outputFileName));
            if (uploaded) {
                const publicUrl = (0, storageService_1.getPublicUrlForKey)(outKey);
                if (publicUrl)
                    return publicUrl;
            }
        }
        catch (e) {
            console.warn("Storage upload failed, falling back to local write:", e.message);
        }
        // Local fallback: write converted file to `infrastructure/public/converted`
        await (0, storageService_1.ensureConvertedDir)();
        return await (0, storageService_1.writeLocalConverted)(outputFileName, toBuffer(outputBuffer));
    }
}
exports.ConvertFileUseCase = ConvertFileUseCase;
// getContentType is provided by storageService

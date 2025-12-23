import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { uploadTmp, uploadGenerated, writeLocalConverted, ensureConvertedDir, getPublicUrlForKey, } from "../../infrastructure/storage/storageService.js";
import { getContentType } from "../../infrastructure/storage/storageService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputExtensions = {
    "md-to-pdf": ".pdf",
    "pdf-to-md": ".md",
    "pdf-to-txt": ".txt",
    "pdf-to-word": ".docx",
};
export class ConvertFileUseCase {
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
        const baseName = path.basename(originalName, path.extname(originalName));
        const uniqueSuffix = randomBytes(4).toString("hex");
        const outputFileName = `${baseName}-${uniqueSuffix}${outputExtensions[type]}`;
        // Ensure the output directory exists (used as fallback)
        const convertedDir = path.join(__dirname, "../../infrastructure/public/converted");
        await fs.mkdir(convertedDir, { recursive: true });
        // Try S3 first using the storage service helpers
        const tmpKey = `tmp/${baseName}-${uniqueSuffix}${path.extname(originalName)}`;
        // upload generated outputs under the `converted/` prefix so URLs match expectations
        const outKey = `converted/${outputFileName}`;
        const inputBody = toBuffer(fileBuffer);
        try {
            await uploadTmp(tmpKey, inputBody, getContentType(originalName));
            const outBody = toBuffer(outputBuffer);
            const uploaded = await uploadGenerated(outKey, outBody, getContentType(outputFileName));
            if (uploaded) {
                const publicUrl = getPublicUrlForKey(outKey);
                if (publicUrl)
                    return publicUrl;
            }
        }
        catch (e) {
            console.warn("Storage upload failed, falling back to local write:", e.message);
        }
        // Local fallback: write converted file to `infrastructure/public/converted`
        await ensureConvertedDir();
        return await writeLocalConverted(outputFileName, toBuffer(outputBuffer));
    }
}
// getContentType is provided by storageService

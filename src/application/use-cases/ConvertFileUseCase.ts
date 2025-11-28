import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { IConversionService } from "../../domain/services/IConversionService";
import {
  uploadTmp,
  uploadGenerated,
  writeLocalConverted,
  ensureConvertedDir,
  getPublicUrlForKey,
} from "../../infrastructure/storage/storageService";

type ConversionType = "md-to-pdf" | "pdf-to-md" | "pdf-to-txt" | "pdf-to-word";
type OutputExtension = ".pdf" | ".md" | ".txt" | ".docx";

const outputExtensions: Record<ConversionType, OutputExtension> = {
  "md-to-pdf": ".pdf",
  "pdf-to-md": ".md",
  "pdf-to-txt": ".txt",
  "pdf-to-word": ".docx",
};

export class ConvertFileUseCase {
  constructor(private readonly conversionService: IConversionService) {}

  // new signature: accept uploaded buffer and original filename
  public async execute(
    fileBuffer: Buffer,
    originalName: string,
    type: ConversionType
  ): Promise<string> {
    let outputBuffer: Buffer | string;

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
    const baseName = path.basename(originalName, path.extname(originalName));
    const uniqueSuffix = randomBytes(4).toString("hex");
    const outputFileName = `${baseName}-${uniqueSuffix}${outputExtensions[type]}`;
    // Ensure the output directory exists (used as fallback)
    const convertedDir = path.join(
      __dirname,
      "../../infrastructure/public/converted"
    );
    await fs.mkdir(convertedDir, { recursive: true });

    // Try S3 first using the storage service helpers
    const tmpKey = `tmp/${baseName}-${uniqueSuffix}${path.extname(originalName)}`;
    const outKey = `generated/${outputFileName}`;
    const inputBody = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(String(fileBuffer));
    try {
      await uploadTmp(tmpKey, inputBody, getContentType(originalName));
      const outBody = Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(String(outputBuffer));
      const uploaded = await uploadGenerated(outKey, outBody, getContentType(outputFileName));
      if (uploaded) {
        const publicUrl = getPublicUrlForKey(outKey);
        if (publicUrl) return publicUrl;
      }
    } catch (e) {
      console.warn('Storage upload failed, falling back to local write:', (e as Error).message);
    }

    // Local fallback: write converted file to `infrastructure/public/converted`
    await ensureConvertedDir();
    return await writeLocalConverted(outputFileName, Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(String(outputBuffer)));
  }
}

function getContentType(filename: string) {
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.md')) return 'text/markdown';
  if (filename.endsWith('.txt')) return 'text/plain';
  if (filename.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

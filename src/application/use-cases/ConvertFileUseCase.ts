import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { IConversionService } from "../../domain/services/IConversionService";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load configs from configs/index.cjs (supports .env.local and .env.prod)
const configsPath = path.join(process.cwd(), 'configs');
let config: any = {};
try {
  config = require(configsPath);
} catch (e) {
  // no-op, fall back to process.env
  config = {};
}

const S3_BUCKET = config.S3_BUCKET || process.env.S3_BUCKET;
const S3_ENDPOINT = config.S3_ENDPOINT || process.env.S3_ENDPOINT;
const S3_PUBLIC_BASE_URL = config.S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL; // e.g. https://<bucket>.<region>.digitaloceanspaces.com

let s3Client: S3Client | null = null;
if (
  S3_BUCKET &&
  (config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
  (config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
) {
  const region = config.AWS_REGION || process.env.AWS_REGION || "us-east-1";
  const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey:
        config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

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

  public async execute(
    filePath: string,
    type: ConversionType
  ): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);

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
    const baseName = path.basename(filePath, path.extname(filePath));
    const uniqueSuffix = randomBytes(4).toString("hex");
    const outputFileName = `${baseName}-${uniqueSuffix}${outputExtensions[type]}`;
    const convertedDir = path.join(
      __dirname,
      "../../infrastructure/public/converted"
    );

    // Ensure the output directory exists (used as fallback)
    await fs.mkdir(convertedDir, { recursive: true });

    // If S3 is configured, upload original to `temp/` and converted to `converted/`, return public URL
    if (s3Client && S3_BUCKET) {
      const originalBody = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(String(fileBuffer));
      const originalKey = `temp/${path.basename(filePath)}`;
      const convertedBody = Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(String(outputBuffer));
      const convertedKey = `converted/${outputFileName}`;
      try {
        // upload original (temp) as public-read
        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: originalKey,
            Body: originalBody,
            ACL: "public-read",
            ContentType: getContentType(path.basename(filePath)),
          })
        );

        // upload converted (public)
        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: convertedKey,
            Body: convertedBody,
            ACL: "public-read",
            ContentType: getContentType(outputFileName),
          })
        );

        // remove local files
        try { await fs.unlink(filePath); } catch(e) {}
        try { await fs.unlink(path.join(convertedDir, outputFileName)); } catch(e) {}

        const publicBase = S3_PUBLIC_BASE_URL ? S3_PUBLIC_BASE_URL.replace(/\/$/, "") : undefined;
        const publicUrl = publicBase ? `${publicBase}/${convertedKey}` : `https://${S3_BUCKET}.${S3_ENDPOINT || "s3.amazonaws.com"}/${convertedKey}`;
        return publicUrl;
      } catch (e) {
        // fallback to local write if upload fails
        const outputPath = path.join(convertedDir, outputFileName);
        await fs.writeFile(outputPath, outputBuffer);
        await fs.unlink(filePath);
        return `/converted/${outputFileName}`;
      }
    }

    // default: write to local converted directory
    const outputPath = path.join(convertedDir, outputFileName);
    await fs.writeFile(outputPath, outputBuffer);
    // Clean up the original uploaded file
    await fs.unlink(filePath);
    const downloadUrl = `/converted/${outputFileName}`;
    return downloadUrl;
  }
}

function getContentType(filename: string) {
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.md')) return 'text/markdown';
  if (filename.endsWith('.txt')) return 'text/plain';
  if (filename.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

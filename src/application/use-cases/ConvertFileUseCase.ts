import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { IConversionService } from "../../domain/services/IConversionService";

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

    // Ensure the output directory exists
    await fs.mkdir(convertedDir, { recursive: true });

    const outputPath = path.join(convertedDir, outputFileName);
    await fs.writeFile(outputPath, outputBuffer);

    // schedule deletion after TTL (30 minutes)
    const TTL_MS = 30 * 60 * 1000; // 30 minutes
    setTimeout(async () => {
      try {
        await fs.unlink(outputPath);
      } catch (err) {
        // ignore errors (file may already be removed)
      }
    }, TTL_MS);

    // Clean up the original uploaded file
    await fs.unlink(filePath);

    const downloadUrl = `/converted/${outputFileName}`;
    return downloadUrl;
  }
}

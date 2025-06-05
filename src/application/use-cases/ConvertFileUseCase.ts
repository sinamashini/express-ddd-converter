import fs from "fs/promises";
import path from "path";
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

    const outputFileName = `${path.basename(filePath, path.extname(filePath))}${
      outputExtensions[type]
    }`;
    const convertedDir = path.join(
      __dirname,
      "../../infrastructure/public/converted"
    );

    // Ensure the output directory exists
    await fs.mkdir(convertedDir, { recursive: true });

    const outputPath = path.join(convertedDir, outputFileName);
    await fs.writeFile(outputPath, outputBuffer);

    // Clean up the original uploaded file
    await fs.unlink(filePath);

    const downloadUrl = `/converted/${outputFileName}`;
    return downloadUrl;
  }
}

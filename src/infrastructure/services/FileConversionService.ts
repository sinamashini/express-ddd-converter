import { mdToPdf } from "md-to-pdf";
import pdf from "@opendocsg/pdf2md";
import pdfParse from "pdf-parse";
import { IConversionService } from "../../domain/services/IConversionService";

export class FileConversionService implements IConversionService {
  public async mdToPdf(data: Buffer): Promise<Buffer> {
    const pdf = await mdToPdf({ content: data.toString() });
    return pdf.content;
  }

  public async pdfToMd(data: Buffer): Promise<string> {
    const markdown = await pdf(data);
    return markdown;
  }

  public async pdfToTxt(data: Buffer): Promise<string> {
    const result = await pdfParse(data);
    return result.text;
  }

  public async pdfToWord(data: Buffer): Promise<Buffer> {
    // NOTE: PDF-to-Word conversion is complex.
    // This is a placeholder for a real implementation using a library
    // like LibreOffice headless or a third-party API.
    console.log(
      "Simulating PDF to DOCX conversion for:",
      data.toString("base64").substring(0, 30) + "..."
    );
    const placeholderContent = "This is a simulated DOCX file.";
    return Buffer.from(placeholderContent);
  }
}

import PDFDocument from "pdfkit";
import { marked } from "marked";
// @ts-ignore - pdf2md has incorrect type definitions
import pdf2md from "@opendocsg/pdf2md";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { IConversionService } from "../../domain/services/IConversionService.js";

// Helper to strip HTML tags for plain text rendering in PDF
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

export class FileConversionService implements IConversionService {
  public async mdToPdf(
    data: Buffer,
    options?: { direction?: "ltr" | "rtl" }
  ): Promise<Buffer> {
    const direction = options?.direction === "rtl" ? "rtl" : "ltr";
    const content = data.toString();

    // Parse markdown to HTML tokens
    const tokens = marked.lexer(content);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Set default font
      doc.font("Helvetica");

      // Process markdown tokens
      for (const token of tokens) {
        switch (token.type) {
          case "heading":
            const fontSize = 24 - (token.depth - 1) * 3; // h1=24, h2=21, h3=18...
            doc.fontSize(fontSize).font("Helvetica-Bold");
            doc.text(stripHtml(token.text), {
              align: direction === "rtl" ? "right" : "left",
            });
            doc.moveDown(0.5);
            doc.font("Helvetica").fontSize(12);
            break;

          case "paragraph":
            doc.fontSize(12).font("Helvetica");
            doc.text(stripHtml(token.text), {
              align: direction === "rtl" ? "right" : "left",
            });
            doc.moveDown();
            break;

          case "code":
            doc.fontSize(10).font("Courier");
            doc.text(token.text, { align: "left" });
            doc.moveDown();
            doc.font("Helvetica").fontSize(12);
            break;

          case "list":
            doc.fontSize(12);
            for (const item of token.items) {
              const bullet = token.ordered ? `${token.start || 1}. ` : "• ";
              doc.text(bullet + stripHtml(item.text), {
                align: direction === "rtl" ? "right" : "left",
                indent: 20,
              });
            }
            doc.moveDown();
            break;

          case "blockquote":
            doc.fontSize(11).font("Helvetica-Oblique");
            doc.text(stripHtml(token.text || ""), {
              align: direction === "rtl" ? "right" : "left",
              indent: 20,
            });
            doc.moveDown();
            doc.font("Helvetica").fontSize(12);
            break;

          case "hr":
            doc.moveDown();
            doc
              .moveTo(50, doc.y)
              .lineTo(doc.page.width - 50, doc.y)
              .stroke();
            doc.moveDown();
            break;

          case "space":
            doc.moveDown();
            break;

          default:
            // For any other token types, try to render raw text
            if ("text" in token && token.text) {
              doc.text(stripHtml(token.text as string));
              doc.moveDown();
            }
            break;
        }
      }

      doc.end();
    });
  }

  public async pdfToMd(data: Buffer): Promise<string> {
    // Cast to any to work around incorrect type definitions
    const markdown = await (pdf2md as any)(data);
    return markdown;
  }

  public async pdfToTxt(data: Buffer): Promise<string> {
    // Use pdfjs-dist to extract text (works in serverless environments)
    const uint8Array = new Uint8Array(data);
    const pdf = await getDocument({ data: uint8Array }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
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

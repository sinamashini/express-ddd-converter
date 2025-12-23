import { Request, Response, NextFunction } from "express";
import { ConvertFileUseCase } from "../../../application/use-cases/ConvertFileUseCase.js";

export class ConversionController {
  constructor(private readonly convertFileUseCase: ConvertFileUseCase) {}

  private handleConversion = async (
    req: Request,
    res: Response,
    next: NextFunction,
    type: "md-to-pdf" | "pdf-to-md" | "pdf-to-txt" | "pdf-to-word"
  ) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      // Optional direction parameter: dir=rtl (default is ltr)
      const dirParam = String((req.query.dir as string) || "").toLowerCase();
      const direction: "ltr" | "rtl" = dirParam === "rtl" ? "rtl" : "ltr";

      // pass buffer and original name to use case
      const downloadUrl = await this.convertFileUseCase.execute(
        req.file.buffer,
        req.file.originalname,
        type,
        { direction }
      );

      const ttlMinutes = 30;
      const expiresAt = new Date(
        Date.now() + ttlMinutes * 60 * 1000
      ).toISOString();

      const finalUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${req.protocol}://${req.get("host")}${downloadUrl}`;

      res.status(200).json({
        message: `File converted successfully. This link is available for ${ttlMinutes} minutes.`,
        downloadUrl: finalUrl,
        expiresAt,
      });
    } catch (error) {
      next(error);
    }
  };

  public mdToPdf = (req: Request, res: Response, next: NextFunction) =>
    this.handleConversion(req, res, next, "md-to-pdf");
  public pdfToMd = (req: Request, res: Response, next: NextFunction) =>
    this.handleConversion(req, res, next, "pdf-to-md");
  public pdfToTxt = (req: Request, res: Response, next: NextFunction) =>
    this.handleConversion(req, res, next, "pdf-to-txt");
  public pdfToWord = (req: Request, res: Response, next: NextFunction) =>
    this.handleConversion(req, res, next, "pdf-to-word");
}

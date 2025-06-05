import { Request, Response, NextFunction } from "express";
import { ConvertFileUseCase } from "../../../application/use-cases/ConvertFileUseCase";

export class ConversionController {
  constructor(private readonly convertFileUseCase: ConvertFileUseCase) {}

  private handleConversion = async (
    req: Request,
    res: Response,
    next: NextFunction,
    type: "md-to-pdf" | "pdf-to-md" | "pdf-to-txt" | "pdf-to-word"
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const downloadUrl = await this.convertFileUseCase.execute(
        req.file.path,
        type
      );

      res.status(200).json({
        message: "File converted successfully",
        downloadUrl: `${req.protocol}://${req.get("host")}${downloadUrl}`,
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

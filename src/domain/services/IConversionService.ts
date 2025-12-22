export interface IConversionService {
  mdToPdf(
    data: Buffer,
    options?: { direction?: "ltr" | "rtl" }
  ): Promise<Buffer>;
  pdfToMd(data: Buffer): Promise<string>;
  pdfToTxt(data: Buffer): Promise<string>;
  pdfToWord(data: Buffer): Promise<Buffer>;
}

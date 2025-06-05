export interface IConversionService {
  mdToPdf(data: Buffer): Promise<Buffer>;
  pdfToMd(data: Buffer): Promise<string>;
  pdfToTxt(data: Buffer): Promise<string>;
  pdfToWord(data: Buffer): Promise<Buffer>;
}

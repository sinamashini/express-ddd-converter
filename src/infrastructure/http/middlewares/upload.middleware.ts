import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";

export const uploadMiddleware = (allowedExtension: string) => {
  // use memory storage so uploads are processed in-memory and then uploaded to S3
  const storage = multer.memoryStorage();

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (path.extname(file.originalname).toLowerCase() !== allowedExtension) {
      return cb(
        new Error(
          `Invalid file type. Only ${allowedExtension} files are allowed.`
        )
      );
    }
    cb(null, true);
  };

  const mul = multer({ storage, fileFilter }).single("file");

  // Wrap multer middleware to validate Content-Type header before parsing
  return (req: any, res: any, next: any) => {
    const ct = req.headers && req.headers["content-type"];
    if (
      !ct ||
      typeof ct !== "string" ||
      ct.indexOf("multipart/form-data") === -1
    ) {
      return res
        .status(400)
        .json({
          message:
            "Bad Request: Content-Type must be multipart/form-data with a boundary. Use form-data multipart uploads.",
        });
    }
    return mul(req, res, next);
  };
};

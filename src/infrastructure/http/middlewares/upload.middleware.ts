import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadMiddleware = (allowedExtension: string) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

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
    const ct = req.headers && req.headers['content-type'];
    if (!ct || typeof ct !== 'string' || ct.indexOf('multipart/form-data') === -1) {
      return res.status(400).json({ message: 'Bad Request: Content-Type must be multipart/form-data with a boundary. Use form-data multipart uploads.' });
    }
    return mul(req, res, next);
  };
};

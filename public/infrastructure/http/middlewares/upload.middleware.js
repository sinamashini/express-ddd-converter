"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uploadMiddleware = (allowedExtension) => {
    // use memory storage so uploads are processed in-memory and then uploaded to S3
    const storage = multer_1.default.memoryStorage();
    const fileFilter = (req, file, cb) => {
        if (path_1.default.extname(file.originalname).toLowerCase() !== allowedExtension) {
            return cb(new Error(`Invalid file type. Only ${allowedExtension} files are allowed.`));
        }
        cb(null, true);
    };
    const mul = (0, multer_1.default)({ storage, fileFilter }).single("file");
    // Wrap multer middleware to validate Content-Type header before parsing
    return (req, res, next) => {
        const ct = req.headers && req.headers["content-type"];
        if (!ct ||
            typeof ct !== "string" ||
            ct.indexOf("multipart/form-data") === -1) {
            return res
                .status(400)
                .json({
                message: "Bad Request: Content-Type must be multipart/form-data with a boundary. Use form-data multipart uploads.",
            });
        }
        return mul(req, res, next);
    };
};
exports.uploadMiddleware = uploadMiddleware;

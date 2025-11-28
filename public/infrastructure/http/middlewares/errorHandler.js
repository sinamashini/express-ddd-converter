"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const multer_1 = require("multer");
const CustomError_1 = require("../../../errors/CustomError");
const errorHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    if (err instanceof multer_1.MulterError) {
        res
            .status(res.statusCode || 500)
            .json({ message: "File upload error", error: err.message });
        return;
    }
    if (err.message.includes("Invalid file type")) {
        res.status(400).json({ message: "Validation Error", error: err.message });
        return;
    }
    if (err instanceof CustomError_1.CustomError) {
        const { statusCode, errors, logging } = err;
        if (logging) {
            console.error(JSON.stringify({
                code: err.statusCode,
                errors: err.errors,
                stack: err.stack,
            }, null, 2));
        }
        res.status(statusCode).send({ errors });
        return;
    }
    console.error(JSON.stringify(err, null, 2));
    res.status(500).send({ errors: [{ message: "Something went wrong" }] });
};
exports.errorHandler = errorHandler;

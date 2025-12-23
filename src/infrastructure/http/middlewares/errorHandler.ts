import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { CustomError } from "../../../errors/CustomError.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err.stack);

  if (err instanceof MulterError) {
    res
      .status(res.statusCode || 500)
      .json({ message: "File upload error", error: err.message });
    return;
  }

  if (err.message.includes("Invalid file type")) {
    res.status(400).json({ message: "Validation Error", error: err.message });
    return;
  }

  if (err instanceof CustomError) {
    const { statusCode, errors, logging } = err;
    if (logging) {
      console.error(
        JSON.stringify(
          {
            code: err.statusCode,
            errors: err.errors,
            stack: err.stack,
          },
          null,
          2
        )
      );
    }

    res.status(statusCode).send({ errors });
    return;
  }
  console.error(JSON.stringify(err, null, 2));
  res.status(500).send({ errors: [{ message: "Something went wrong" }] });
};

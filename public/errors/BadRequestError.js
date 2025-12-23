import { CustomError } from "./CustomError.js";
export default class BadRequestError extends CustomError {
    static _statusCode = 400;
    _code;
    _logging;
    _context;
    constructor(params) {
        const { code, message, logging } = params || {};
        super(message || "Bad request");
        this._code = code || BadRequestError._statusCode;
        this._logging = logging || false;
        this._context = params?.context || {};
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
    get errors() {
        return [{ message: this.message, context: this._context }];
    }
    get statusCode() {
        return this._code;
    }
    get logging() {
        return this._logging;
    }
}

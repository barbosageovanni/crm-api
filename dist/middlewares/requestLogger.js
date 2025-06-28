"use strict";
// src/middlewares/requestLogger.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map
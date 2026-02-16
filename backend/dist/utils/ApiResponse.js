"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(message, data = null, success = true) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}
exports.ApiResponse = ApiResponse;

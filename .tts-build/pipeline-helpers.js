"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRIPT = void 0;
exports.splitSentencesSafe = splitSentencesSafe;
/** Small helpers shared by the pipeline (kept isolated for clean imports). */
const script_data_1 = require("./script-data");
Object.defineProperty(exports, "SCRIPT", { enumerable: true, get: function () { return script_data_1.SCRIPT; } });
const easing_1 = require("./easing");
function splitSentencesSafe(text) {
    try {
        return (0, easing_1.splitSentences)(text);
    }
    catch {
        return [text];
    }
}

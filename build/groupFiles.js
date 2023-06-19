"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupFilesByType = void 0;
const mime_1 = __importDefault(require("mime"));
/**
 * Given an array of files, it groups it by it's type.
 * Type of the file is inferred from it's mimetype based on the extension
 * file ends up with. The returned value is an object with properties that
 * correspond to the first part of the mimetype, e.g. images will be grouped
 * under `image` key since the mimetype for them is `image/jpg` etc.
 *
 * Example:
 * Given an array ['fonts/a.ttf', 'images/b.jpg'],
 * the returned object will be: {font: ['fonts/a.ttf'], image: ['images/b.jpg']}
 */
function groupFilesByType(assets) {
    return groupBy(assets, (type) => (mime_1.default.getType(type) || "").split("/")[0]);
}
exports.groupFilesByType = groupFilesByType;
function groupBy(arr, block) {
    const out = {};
    for (const i of arr) {
        const key = block(i);
        if (!(key in out)) {
            out[key] = [];
        }
        out[key].push(i);
    }
    return out;
}

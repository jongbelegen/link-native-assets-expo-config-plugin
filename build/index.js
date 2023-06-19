"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug = require("debug")("bacons:link-assets");
const groupFiles_1 = require("./groupFiles");
const withLinkedAsset = (config, props) => {
    const expanded = props
        .map((filePath) => {
        var _a;
        const resolved = path_1.default.resolve((_a = config._internal) === null || _a === void 0 ? void 0 : _a.projectRoot, filePath);
        if (fs_1.default.statSync(resolved).isDirectory()) {
            return fs_1.default
                .readdirSync(resolved)
                .map((file) => path_1.default.join(resolved, file));
        }
        return [resolved];
    })
        .flat();
    debug("All files:", expanded);
    const assets = (0, groupFiles_1.groupFilesByType)(expanded);
    debug("Grouped:", assets);
    withIosLinkedAsset(config, assets);
    withAndroidLinkedAsset(config, assets);
    return config;
};
const withAndroidLinkedAsset = (config, { font = [], ...raw }) => {
    (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        (config) => {
            function addResourceFiles(assets, directoryName) {
                return assets.forEach((asset) => {
                    const dir = path_1.default.join(config.modRequest.platformProjectRoot, `app/src/main/res/${directoryName}`);
                    fs_1.default.mkdirSync(dir, { recursive: true });
                    const output = path_1.default.join(dir, path_1.default.basename(asset));
                    debug("Copying asset:", asset, "to", output);
                    fs_1.default.copyFileSync(asset, output);
                });
            }
            addResourceFiles(font, "fonts");
            addResourceFiles(Object.values(raw).flat(), "raw");
            return config;
        },
    ]);
    return config;
};
const withIosLinkedAsset = (config, { font = [], image = [], ...rest }) => {
    config = (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const project = config.modResults;
        config_plugins_1.IOSConfig.XcodeUtils.ensureGroupRecursively(project, "Resources");
        function addResourceFile(f) {
            return (f !== null && f !== void 0 ? f : [])
                .map((asset) => {
                const absoluteAssetPath = path_1.default.relative(config.modRequest.platformProjectRoot, asset);
                debug(`Linking asset ${asset} -- ${absoluteAssetPath} -- ${project.getFirstTarget().uuid}`);
                return project.addResourceFile(absoluteAssetPath, {
                    target: project.getFirstTarget().uuid,
                });
            })
                .filter(Boolean) // xcode returns false if file is already there
                .map((file) => file.basename);
        }
        addResourceFile(font);
        addResourceFile(image);
        addResourceFile(Object.values(rest).flat());
        return config;
    });
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        var _a;
        // console.log("set fonts:", fontList);
        // @ts-ignore Type mismatch with the lib
        const existingFonts = config.modResults.UIAppFonts || [];
        const fontList = (_a = font === null || font === void 0 ? void 0 : font.map((font) => path_1.default.basename(font))) !== null && _a !== void 0 ? _a : [];
        debug("Native iOS Fonts:", fontList);
        const allFonts = [
            // @ts-expect-error
            ...existingFonts,
            ...fontList,
        ];
        // @ts-ignore Type mismatch with the lib
        config.modResults.UIAppFonts = Array.from(new Set(allFonts));
        return config;
    });
    return config;
};
exports.default = withLinkedAsset;

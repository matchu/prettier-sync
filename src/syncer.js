"use strict";

const fs = require("fs");
const path = require("path");
const walk = require("walk");

const formatFile = require("./format-file");

class Syncer {
    constructor(sourceDir, destDir, options) {
        this.sourceDir = sourceDir;
        this.destDir = destDir;
        this.excludePaths = options.excludePaths || [];
        this.prettierOptions = options.prettier || {};
    }

    printError(err) {
        if (err) {
            console.warn(err.message);
        }
    }

    fileIsFormattable(relativePathToFile) {
        const extension = path.extname(relativePathToFile);
        return extension === ".js" || extension === ".jsx";
    }

    fileIsIncluded(relativePathToFile) {
        const fileIsExcluded = this.excludePaths.some(
            excludePath => relativePathToFile.indexOf(excludePath) === 0);
        return !fileIsExcluded;
    }

    shouldSyncFile(relativePathToFile) {
        return this.fileIsFormattable(relativePathToFile) &&
            this.fileIsIncluded(relativePathToFile);
    }

    syncFile(relativePathToFile) {
        if (this.shouldSyncFile(relativePathToFile)) {
            const sourceFile = path.join(this.sourceDir, relativePathToFile);
            const destFile = path.join(this.destDir, relativePathToFile);
            formatFile(
                sourceFile,
                destFile,
                this.prettierOptions,
                this.printError.bind(this)
            );
        }
    }

    watchAll() {
        fs.watch(
            this.sourceDir,
            {recursive: true},
            (eventType, relativePathToFile) =>
                this.syncFile(relativePathToFile)
        );
    }

    syncAll() {
        const walker = walk.walk(this.sourceDir);

        walker.on("file", (root, fileStat, next) => {
            const absolutePathToFile = path.join(root, fileStat.name);
            const relativePathToFile =
                path.relative(this.sourceDir, absolutePathToFile);
            this.syncFile(relativePathToFile);
            next();
        });
     
        walker.on("directoryError", (path, params, next) => {
            console.warn(`error reading directory ${path}`, params.error);
            next();
        });

        walker.on("nodeError", (path, params, next) => {
            console.warn(`error statting ${path}`, params.error);
            next();
        });
    }
}

module.exports = Syncer;

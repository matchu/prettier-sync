"use strict";

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const prettier = require("prettier");
const VError = require("verror").VError;

function fileContentAlreadyMatches(destFile, intendedContent) {
    try {
        // TODO(mdr): This is dangerously memory-inefficient. Can we do this
        //     without loading the entire file into RAM?
        const currentContent = fs.readFileSync(destFile, "utf-8");
        return currentContent === intendedContent;
    } catch(e) {
        // This could be an actual unexpected error, or could be the expected
        // case of the file not existing. Either way, let's not short-circuit;
        // formatFile will attempt the write, and we'll see what happens.
        return false;
    }
}

function formatFile(sourceFile, destFile, prettierOptions, callback) {
    console.log(`${sourceFile} -> ${destFile}`);

    fs.readFile(sourceFile, "utf-8", (err, unformattedContent) => {
        if (err) {
            callback(new VError(err, "error reading %s", sourceFile));
            return;
        }

        const formattedContent =
            prettier.format(unformattedContent, prettierOptions);

        if (fileContentAlreadyMatches(destFile, formattedContent)) {
            // Writing would be a no-op, so we're done!
            // This is not just an optimization, but helps us avoid infinite
            // loops when we have two parallel processes syncing
            // bidirectionally between two directories.
            callback();
            return;
        }

        const destDir = path.dirname(destFile);
        mkdirp(destDir, (err) => {
            if (err) {
                callback(new VError(err, "error creating %s", destDir));
                return;
            }

            fs.writeFile(destFile, formattedContent, (err) => {
                if (err) {
                    callback(new VError(err, "error writing %s", destFile));
                    return;
                }

                callback();
            });
        });
    });
}

module.exports = formatFile;

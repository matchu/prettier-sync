"use strict";

const fs = require("fs");
const process = require("process");

const Syncer = require("./syncer");

const mode = process.argv[2];
const sourceDir = process.argv[3];
const destDir = process.argv[4];
const optionsPath = process.argv[5];

const options = JSON.parse(fs.readFileSync(optionsPath, "utf-8"));
const syncer = new Syncer(sourceDir, destDir, options);

if (mode === "sync") {
    syncer.syncAll();
} else if (mode === "watch") {
    syncer.watchAll();
} else {
    console.error("unexpected mode %s; should be sync or watch", mode);
}

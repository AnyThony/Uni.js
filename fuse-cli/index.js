#!/usr/bin/env node
const figlet = require('figlet');
const cmd = require("./cmd.js")
const [,,...args] = process.argv;
const cwd = process.cwd();

if (args.length && cmd[args[0]]){
    cmd[args[0]](args);
}
else {
    console.log("Failed: Unknown arguments");
}
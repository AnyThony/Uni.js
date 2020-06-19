#!/usr/bin/env node
const cmd = require("./cmd.js")
const [,,...args] = process.argv;

if (args.length && cmd[args[0]]){
    cmd[args[0]](args);
}
else {
    console.log("Failed: Unknown arguments");
}
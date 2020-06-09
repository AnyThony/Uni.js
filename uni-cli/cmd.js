const fs = require("fs");
const pkg = require("../package.json")
const cwd = process.cwd();
const figlet = require('figlet');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
var ncp = require('ncp').ncp;
 
ncp.limit = 16;

function init(args) {
    console.log(figlet.textSync('UniJS', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }));
    
    console.log(`ver. ${pkg.version}`)    
    
    if (args.length < 2){
        return console.error("Failed: Missing project name")
    }

    var resPkg = fs.readFileSync(__dirname + '/res/package.json');
    resPkg = JSON.parse(resPkg.toString());
    var projectName = args[1];
    var root = path.join(cwd, projectName);
    if (!fs.existsSync(root))
        fs.mkdirSync(root);
    var dest = path.join(root, "src");
    if (!fs.existsSync(dest))
        fs.mkdirSync(dest);

    ncp(__dirname + '/res/src', dest, function (err) {
        if (err) {
          return console.error(err);
        }
        resPkg.name = projectName;
        resPkg.scripts.dev = `concurrently --kill-others \"uni build && live-server --WATCH=/build --mount=/:%cd%/build --wait=200 --no-css-inject\" \"uni watch\"`;
        fs.writeFileSync(root + "/package.json", JSON.stringify(resPkg, null, 2));
        console.log(`Project dir ${projectName} created`);
        console.log('Initializing npm...');
        execSync(`cd ${projectName} && npm install`);
        console.log('Done.');
    });
}

function build(){
    console.log("Bundling...");
    execSync(`node ${__dirname + '/../bundle/bundler.js'} ${cwd}`);
    console.log("Done.");
}

function serve(args){
    console.log("Bundling...");
    execSync(`concurrently --kill-others 
    \"live-server --WATCH=/build --mount=/:%cd%/build --wait=200 --no-css-inject\" 
    \"node ${__dirname + '/../bundle/watch.js'} ${cwd}\"`);
    console.log("Done.");
}

function watch(args){
    chokidar.watch(cwd + '/src').on('change', (event, path) => {
        build();
    });
}

module.exports = {init, build, watch}
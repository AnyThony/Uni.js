const fs = require("fs-extra");
const pkg = require("../package.json")
const cwd = process.cwd();
const figlet = require('figlet');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');

function init(args) {
    console.log(figlet.textSync('Uni.JS', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }));

    console.log(`ver. ${pkg.version}`)

    if (args.length < 2) {
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

    fs.copy(__dirname + '/res/src', dest, function(err) {
        if (err) {
            return console.error(err);
        }
        resPkg.name = projectName;
        resPkg.scripts.dev = `concurrently --kill-others \"uni build && live-server --WATCH=/build --mount=/:%cd%/build --wait=200 --no-css-inject\" \"uni watch\"`;
        resPkg.dependencies["uni-cmd"] = `^${pkg.version}`;
        fs.writeFileSync(root + "/package.json", JSON.stringify(resPkg, null, 2));
        console.log(`Project dir ${projectName} created`);
        console.log('Installing packages...');
        execSync(`cd ${projectName} && npm install`);
        console.log('Done.');
    });
}

function build() {
    console.log("Bundling...");
    execSync(`node ${__dirname + '/../bundle/bundler.js'} ${cwd}`);
    console.log("Done.");
}

function serve(args) {
    console.log("Bundling...");
    execSync(`concurrently --kill-others 
    \"live-server --WATCH=/build --mount=/:%cd%/build --wait=200 --no-css-inject\" 
    \"node ${__dirname + '/../bundle/watch.js'} ${cwd}\"`);
    console.log("Done.");
}

function watch(args) {
    var timeout = 600;
    //timeout is a temp fix since multiple changes at once makes watch build multiple times
    var isBuilding = false;
    chokidar.watch(cwd + '/src').on('change', (event, path) => {
        if (!isBuilding) {
            build();
            isBuilding = true;
            setTimeout(() => { isBuilding = false }, timeout);
        }
    });
}

module.exports = { init, build, watch }
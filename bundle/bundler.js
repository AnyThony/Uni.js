/*
 * This script compiles all user scripts of app.uni
 * Any nested/dynamic components are processed on runtime using uniDOM.js
 */
const [, , ...args] = process.argv;
const cheerio = require('cheerio')
const path = require('path');
const inlineParser = require('./inline-parser.js')
const closureData = require('./env-scripts/closure')
const util = require('./util.js');
const fs = require('fs');
var root_dir;

if (args.length)
    root_dir = args[0];
else
    root_dir = process.cwd();

// handle case if ran inside the src folder
if (!fs.existsSync(path.join(root_dir, "src"))) {
    root_dir = root_dir + '/../';
}

var htmlRaw = fs.readFileSync(path.join(root_dir, "src/app.uni"), "utf8");
var $ = cheerio.load(htmlRaw);

//indexBuffer written to index.html
//scriptBuffer written to main.js
var indexBuffer = util.unescapeHtml($.html()); // since cheerio returns escaped characters
var scriptBuffer = closureData.makeScript(util.getComponentMap(root_dir));

// creates an execution tree in the order of the DOM tree
// in-line scripts are parsed and stored in the corresponding tree node as a closure
async function createExecTree(target, context) {
    var execTree = {
        context: context,
        closure: "",
        children: []
    }
    var closure;
    var rootValue = target.childNodes.length ? target.childNodes[0].nodeValue : "";
    // start and end index of in-line scripts
    var closureI = rootValue ? inlineParser.scanForClosure(rootValue) : [-1, -1]
    var startI = closureI[0];
    var endI = closureI[1];
    var closureBuff = "";

    if (startI == -1 || endI == -1) {
        closure = "";
    } else {
        // remove the script
        indexBuffer = indexBuffer.replace(rootValue.substring(startI, endI + 1), "");
        closure = rootValue.substring(startI + 1, endI);
        closureBuff = closureData.makeClosure(closure, context);
    }
    // if the script is empty or DNE we still setup an empty closure to bind env properties in closure.js
    execTree.closure = closure;
    for (let i = 0; i < target.childNodes.length; i++) {
        let child = target.childNodes[i];
        if (child.type == "tag") {
            let execChild = await createExecTree(child, context + `.childNodes[${i}]`)
            if (execChild)
                execTree.children.push(execChild);
        }
    }
    return execTree;
}

async function main() {
    //execution tree of document.body and descendants
    var execTree = await createExecTree($('body')[0], "document.body");
    var buildPath = path.join(root_dir, "./build");
    
    if (!fs.existsSync(buildPath))
        fs.mkdirSync(buildPath);

    scriptBuffer += `const execTree = ${JSON.stringify(execTree)};` + closureData.postScript();
    // a copy of uniDOM.js
    var uniBuffer = fs.readFileSync(__dirname + '/../dist/uniDOM.js');

    // writes index, main and uniDOM to build, as well as external resources if exists
    fs.writeFileSync(path.join(buildPath, "uniDOM.js"), uniBuffer);
    fs.writeFileSync(path.join(buildPath, "main.js"), scriptBuffer);
    fs.writeFileSync(path.join(buildPath, "index.html"), indexBuffer);
    // copy any other ext resource
    util.copyToBuild(path.join(root_dir, "./src"), path.join(root_dir, "./build"));
}
main();
/*
 * This script compiles all user scripts of app.uni
 */
const [, , ...args] = process.argv;
const cheerio = require('cheerio');
const path = require('path');
const inlineParser = require('./inline-parser.js');
const closureData = require('./env-scripts/closure');
const util = require('./util.js');
const fs = require('fs-extra');
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

//indexBuffer written to index.html
//scriptBuffer written to main.js
var scriptBuffer = closureData.makeScript(getComponentMap(root_dir));

function getComponentMap(root_dir) {
    /*
    *   Stores all components into an object such that:
    *   Key: Component Name
    *   Value: Execution Tree (execTree), HTML Source (srcBuffer)
    */
    var comDir = path.join(root_dir, "src/components");
    var cMap = {}
    if (!fs.existsSync(comDir)) 
        return cMap;
    var files = fs.readdirSync(comDir);
    for (var i = 0; i < files.length; i++) {
        var fName = files[i].split(".")[0]; //filename
        var cBuffer = fs.readFileSync(path.join(comDir, files[i]));
        cMap[fName.toLowerCase()] = createExecObj(cBuffer.toString(), "template", "");
    }
    return cMap;
}

// creates an execution tree and html src buffer
// in-line scripts are parsed and stored in the corresponding tree node as a closure
function createExecObj(src, target, context) {
    var $ = cheerio.load(src);
    var srcBuffer = util.unescapeHtml($.html());
    target = $(target)[0]
    function _createExecTree(target, context) {
        var execTree = {
            context: context,
            closure: "",
            children: []
        }
        var closure = "";
        var rootValue = target.childNodes.length ? target.childNodes[0].nodeValue : "";
        // start and end index of in-line scripts
        var closureI = rootValue ? inlineParser.scanForClosure(rootValue) : [-1, -1]
        var startI = closureI[0];
        var endI = closureI[1];
        var closureBuff = "";
        if (startI != -1 && endI != -1) {
            // remove the script
            srcBuffer = srcBuffer.replace(rootValue.substring(startI, endI + 1), "");
            closure = rootValue.substring(startI + 1, endI);
            closureBuff = closureData.makeClosure(closure, context);
        }
        // if the script is empty or DNE we still setup an empty closure to bind env properties in closure.js
        execTree.closure = closure;
        for (let i = 0; i < target.childNodes.length; i++) {
            let child = target.childNodes[i];
            if (child.type == "tag" || (child.type == "root" && !context)) {
                let execChild = _createExecTree(child, i);
                if (execChild)
                    execTree.children.push(execChild);
            }
        }
        return execTree;
    }
    var result = {
        execTree: _createExecTree(target, context),
        srcBuffer
    };

    if (!context){ // no context, assumed to be loading a component
        $ = cheerio.load(srcBuffer);
        result.srcBuffer = cheerio.html($("template"));
        result.execTree = result.execTree.children[0];
    }
    return result;
}

function main() {
    //execution tree of document.body and descendants
    var execObj = createExecObj(htmlRaw, "body", "document.body");
    var execTree = execObj.execTree;
    var indexBuffer = execObj.srcBuffer;

    var buildPath = path.join(root_dir, "./build");
    
    fs.emptyDirSync(buildPath);
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
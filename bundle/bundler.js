/*
* This script compiles all user scripts of app.html
* Any nested or dynamic components are processed on runtime by uniDOM.js
*/
const [,,...args] = process.argv;
var root_dir;
const path = require('path');
var DomParser = require('dom-parser');
var inlineParser = require('./inline-parser.js')
var parser = new DomParser();

const fs = require('fs');

if (args.length)
    root_dir = args[0];
else 
    root_dir = process.cwd();
if (!fs.existsSync(path.join(root_dir, "src"))){
    root_dir = root_dir + '/../';
}

var htmlRaw = fs.readFileSync(path.join(root_dir, "src/app.html"), "utf8");
var dom = parser.parseFromString(htmlRaw);

let indexBuffer = dom.rawHTML;
let scriptBuffer = inlineParser.makeScript(getComponentMap());

function getComponentMap(){
    var cMap = {}
    var files = fs.readdirSync(path.join(root_dir, "src/components"));
    for (var i = 0; i < files.length; i++){
        var fName = files[i].split(".")[0];
        var cBuffer = fs.readFileSync(path.join(root_dir, `src/components/${files[i]}`));
        cMap[fName.toLowerCase()] = cBuffer.toString()
    }
    return cMap;
}

function addComponentsBuild(dir){
    var files = fs.readdirSync("src/components");
    for (var i = 0; i < files.length; i++){
        var buffer = fs.readFileSync(path.join(root_dir, `src/components/${files[i]}`)).toString();
        //buffer = parser.parseFromString(buffer).getElementsByTagName("template")[0].innerHTML;
        fs.writeFileSync(dir + "/" + files[i], buffer);
    }
}

// setup environment and run a closure inside target context
async function getClosureBuff(closure, context) {
    var result = {
        onFullLoad: null,
        onChildLoad: null
    }

    return inlineParser.makeClosure(closure, context);
}

// initially for being called on document body, evaluates js on
// first node if found, recurses on children
async function evalElement(target, context) {
    var execTree = {
        context: context,
        closure: "",
        children: []
    }
    var closure;
    var rootValue = target.childNodes.length ? target.childNodes[0].text : "";
    var closureI = rootValue ? inlineParser.scanForClosure(rootValue) : [-1, -1]
    var startI = closureI[0];
    var endI = closureI[1];
    var closureBuff = "";
    if (startI == -1 || endI == -1) {
        closure = "";
    }
    else {
        indexBuffer = indexBuffer.replace(rootValue.substring(startI, endI + 1), "");
        //console.log(rootValue.substring(startI, endI + 1))
        closure = rootValue.substring(startI + 1, endI);
        closureBuff = await getClosureBuff(closure, context);
    }
    execTree.closure = closure;
    for (var i = 0; i < target.childNodes.length; i++) {
        var child = target.childNodes[i];
        if (child.nodeType == 1) {
            //console.log('child', child)
            var execChild = await evalElement(child, context + `.childNodes[${i}]`)
            if (execChild)
                execTree.children.push(execChild);
        }
    }
    return execTree;
}
async function main(){
    var execTree = await evalElement(dom.getElementsByTagName("body")[0], "document.body");
    console.log(execTree);
    if (!fs.existsSync(path.join(root_dir, "./build")))
        fs.mkdirSync( path.join(root_dir, "./build")) ;
    /*if (!fs.existsSync("./build/components"))
        fs.mkdirSync("./build/components");
    addComponentsBuild("./build/components")*/

    scriptBuffer += `var execTree = ${JSON.stringify(execTree)};` + inlineParser.postScript();

    fs.writeFileSync( path.join(root_dir, "./build/main.js"), scriptBuffer );
    fs.writeFileSync( path.join(root_dir, "./build/index.html"), indexBuffer );

    var uniBuffer = fs.readFileSync( __dirname + '/../dist/uniDOM.js' );

    fs.writeFileSync( path.join(root_dir, "./build/uniDOM.js"), uniBuffer);

    var styleBuffer = fs.readFileSync( path.join(root_dir, "./src/styles.css"));

    fs.writeFileSync( path.join(root_dir, "./build/styles.css"), styleBuffer);

}
main();
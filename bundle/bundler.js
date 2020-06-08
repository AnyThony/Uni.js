var DomParser = require('dom-parser');
var inlineParser = require('./inline-parser.js')
var parser = new DomParser();

const fs = require('fs');

var htmlRaw = fs.readFileSync("src/app.fus", "utf8");
var dom = parser.parseFromString(htmlRaw);

let indexBuffer = dom.rawHTML;
let scriptBuffer = inlineParser.makeScript(getComponentMap());

function getComponentMap(){
    var cMap = {}
    var files = fs.readdirSync("src/components");
    for (var i = 0; i < files.length; i++){
        var fName = files[i].split(".")[0];
        var cBuffer = fs.readFileSync(`src/components/${files[i]}`);
        cMap[fName.toLowerCase()] = cBuffer.toString()
    }
    return cMap;
}

function addComponentsBuild(dir){
    var files = fs.readdirSync("src/components");
    for (var i = 0; i < files.length; i++){
        var buffer = fs.readFileSync(`src/components/${files[i]}`).toString();
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

    if (!target.childNodes.length) {
        return;
    }
    var execTree = {
        context: context,
        closure: "",
        children: []
    }
    var closure;
    var rootValue = target.childNodes[0].text;
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
    var dir = "./build"
    if (!fs.existsSync("./build"))
        fs.mkdirSync("./build");
    /*if (!fs.existsSync("./build/components"))
        fs.mkdirSync("./build/components");
    addComponentsBuild("./build/components")*/

    scriptBuffer += `var execTree = ${JSON.stringify(execTree)};` + inlineParser.postScript();

    fs.writeFileSync( "./build/main.js", scriptBuffer );
    fs.writeFileSync( "./build/index.html", indexBuffer );

    var fuseBuffer = fs.readFileSync("./dist/fuseDOM.js");

    fs.writeFileSync("./build/fuseDOM.js", fuseBuffer);

    var styleBuffer = fs.readFileSync("./src/styles.css");

    fs.writeFileSync("./build/styles.css", styleBuffer);

}
main()
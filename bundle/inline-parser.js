var closureData = require('./env-scripts/closure.js');
const TOK_START = "{";
const TOK_END = "}";
// parse the raw data for code
function scanForClosure(data) {
    var left = data && data[0] == TOK_START ? 0 : -1;
    var right = -1;

    for (var i = 0; i < data.length - 1; i++) {
        if (data[i] == "\\") {
            continue;
        }
        if (left == -1 && data[i + 1] == TOK_START) {
            left = i + 1;
        }
        else if (data[i + 1] == TOK_END) {
            right = i + 1;
        }

    }

    return [left, right]
}

function makeScript(cMap){
//(${closureData.fuseLibrary.toString()})();
    return `
        fuse._rawComponents = ${JSON.stringify(cMap)};

        function runClosure(closure, context){
            var raw = \`
            (${closureData.preClosure.toString()}).call(this);
            \`+closure+\` 
            (${closureData.postClosure.toString()}).call(this);
            return {
                onFullLoad: typeof this.onFullLoad === 'function' ? this.onFullLoad : null,
                onChildLoad: typeof this.onChildLoad === 'function' ? this.onChildLoad : null,
                imports: typeof this.imports === 'object' ? this.imports : null
            }\`
            var _cl = Function(raw);
            _cl.call(context);
            return _cl
        }
    `
}

function postScript(){
    return `
    function evalExecTree(tree){
        var children = tree.children;
        var context = Function('return '+tree.context)();
        runClosure(tree.closure, context);
        for (var i = 0; i < children.length; i++){
            var child = evalExecTree(children[i]);
            if (context.onChildload){
                context.onChildLoad(child);
            }
        }
        if (context.onFullLoad){
            console.log("on full loaded", tree);
            context.onFullLoad();
        }
        return context
    }
    evalExecTree(execTree);
    (${closureData.renderInitComponents.toString()})();
    `
}

var makeClosure = (closure, context) => {
    return `
        runClosure(\`${closure}\`, ${context});
    `
}

module.exports = {
    scanForClosure: scanForClosure,
    makeClosure: makeClosure,
    makeScript: makeScript,
    postScript: postScript
}
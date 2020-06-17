/*
* This module contains all functions to be used in main.js and for evaluating closures
*/

// this evaluates static components in the entry point (app.uni) only
// gets called at the end of main.js
async function initStaticComponents(target = null) {
    
    // gets the props of a static component via html attributes
    function getProps(target) {
        var props = {};
        var nameList = target.getAttributeNames();
        for (let i = 0; i < nameList.length; i++) {
            let name = nameList[i];
            props[name] = target.getAttribute(name);
        }
        return props;
    }

    // find the index of a given child
    function childIndex(parent, child) {
        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i] == child) {
                return i;
            }
        }
        return -1;
    };
    
    if (!target){
        target = document.body
    }
    var tag = target.tagName;
    var parent = target.parentElement;
    var componentHTML = uni._rawComponents[tag.toLowerCase()];
    if (uni._ignore_interpret.indexOf(tag.toUpperCase()) != -1) {
        return;
    }
    //if target is a valid component and its parent has imported it
    if (parent.imports &&
        componentHTML &&
        parent.imports.map(c => c.toUpperCase()).indexOf(tag) != -1) {

        var props = getProps(target);
        var targetIndex = childIndex(parent, target);
        target.outerHTML = componentHTML;
        // components are wrapped in <template> tag so we need to do this
        parent.children[targetIndex].outerHTML = parent.children[targetIndex].innerHTML;
        // the component can unload multiple elements so all must be evaluated
        for (let i = targetIndex; i < parent.children.length; i++) {
            let child = parent.children[i];
            if (!child._didInit) {
                await uni._evalElement(parent.children[i], props);
            }
            else {
                break;
            }
        }
    }
    // recurse on children
    for (var j = 0; j < target.children.length; j++) {
        await initStaticComponents(target.children[j]);
    }
}

//start of the main.js script
function makeScript(cMap) {
    // makes use of the uniDOM.js library in dist
    return `
        uni._rawComponents = ${JSON.stringify(cMap)};

        function runClosure(closure, context){
            var raw = \`
            uni._preClosure.call(this);
            \`
            +closure+\` 
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
    // runClosure evaluates a closure with the given context
    // preClosure is called first binding the necessary properties
}

//end of the main.js script
function postScript() {
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
            context.onFullLoad();
        }
        return context;
    }
    evalExecTree(execTree);
    (${initStaticComponents.toString()})();
    `
}

function makeClosure(closure, context) {
    return `
        runClosure(\`${closure}\`, ${context});
    `
}

module.exports = {
    initStaticComponents,
    makeScript,
    postScript,
    makeClosure
}
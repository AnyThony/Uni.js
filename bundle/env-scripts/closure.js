/*
* This module contains all functions to be used in main.js and for evaluating closures
*/

//start of the main.js script
function makeScript(cMap) {
    // makes use of the uniDOM.js library in dist
    return `
        uni._rawComponents = ${JSON.stringify(cMap)};
    `
    // preClosure is called first binding the necessary properties
}

//end of the main.js script
function postScript() {
    return `
    uni._evalExecTree(execTree, document.body);
    `
}

function makeClosure(closure, context) {
    return `
        uni._runClosure(\`${closure}\`, ${context});
    `
}

module.exports = {
    makeScript,
    postScript,
    makeClosure
}
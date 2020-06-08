
        fuse._rawComponents = {"container":"<template>\r\n    <div class =\"container\">\r\n        {\r\n            this.imports = [\"test1\"]\r\n            this.state = {\r\n                counter: 0\r\n            };\r\n\r\n            var p = this.find(\"p\");\r\n\r\n            this.bindState(newState => {\r\n                p.innerText = \"Tick: \" + newState.counter;\r\n            });\r\n            \r\n            var tick = () => this.setState({counter: this.state.counter + 1})\r\n                //aadsddssssssss2ssssssssssssssssssssssssssssss\r\n            setInterval(tick, 1000);\r\n        }\r\n        <p></p>\r\n        <test1>2222</test1>\r\n    </div>\r\n</template>","test1":"<template>\r\n    <div class =\"test1\">\r\n        {\r\n            console.log(\"test1\")\r\n        }\r\n        hi!\r\n    </div>\r\n</template>"};

        function runClosure(closure, context){
            var raw = `
            (function preClosure() {
    this._rawImports = {};
    this._stateChangeListens = [];
    this.find = this.querySelector;
    this.bindState = function (cb) {
        if (this.state) {
            this._stateChangeListens.push(cb);

            cb(this.state);
        }
        else if (this != document.body) {
            this.parentElement.bindState(cb);
        }
    }
    this.setState = function (newState) {

        var updated = false;
        if (this.state) {

            for (var key in newState) {
                if (newState.hasOwnProperty(key)) {
                    var val = newState[key];
                    if (this.state[key] !== undefined) {

                        if (!updated) {
                            this._stateChangeListens.forEach(f => {
                                f(newState);
                            });
                            updated = true;
                        }
                        this.state[key] = val;

                        delete newState[key];
                    }
                }
            }
            if (Object.keys(newState).length && this != document.body) {
                this.parentElement.setState(newState);
            }
        }
        else if (this != document.body) {
            this.parentElement.setState(newState);
        }
    }
}).call(this);
            `+closure+` 
            (function postClosure() {
    /*if (this.parentElement) {
        var par = this.parentElement;
        if (par.onChildLoad)
            par.onChildLoad(this);
        if (par.onFullLoad &&
            !par.onFullLoad._ran &&
            par.children[par.children.length - 1] == this) {
            par.onFullLoad();
            par.onFullLoad._ran = true;
        }
    }*/
}).call(this);
            return {
                onFullLoad: typeof this.onFullLoad === 'function' ? this.onFullLoad : null,
                onChildLoad: typeof this.onChildLoad === 'function' ? this.onChildLoad : null,
                imports: typeof this.imports === 'object' ? this.imports : null
            }`
            var _cl = Function(raw);
            _cl.call(context);
            return _cl
        }
    var execTree = {"context":"document.body","closure":"","children":[{"context":"document.body.childNodes[1]","closure":"\r\n                this.imports = [\"container\"];\r\n                this.state = {\r\n                    data: 14\r\n                }\r\n                this.onFullLoad = () => {\r\n                    this.setState({data: 222})\r\n                }\r\n                this.onChildLoad = (c) => {console.log(\"chilsd\", c)}\r\n\r\n            ","children":[{"context":"document.body.childNodes[1].childNodes[1]","closure":"\r\n                    this.imports = [\"container\"];\r\n                    console.log(\"context2\", this)\r\n                    this.parentElement.bindState(newState =>{\r\n                        console.log(newState)\r\n                    })\r\n                    console.log(\"hsssadss2dssadse332 2\");\r\n                ","children":[]}]}]};
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
    (async function renderInitComponents(target = null) {
    function childIndex(parent, child){
        for (var i = 0; i < parent.children.length; i++){
            if (parent.children[i] == child){
                return i;
            }
        }
        return -1;
    }
    if (!target)
        target = document.body
    console.log("init",target);
    var tag = target.tagName;
    if (fuse._ignore_interpret.indexOf(tag.toUpperCase()) != -1){
        return;
    }
    var parent = target.parentElement;
    if (parent.imports && parent.imports.indexOf(tag.toLowerCase()) != -1) {
        var componentHTML = fuse._rawComponents[tag.toLowerCase()]
        if (componentHTML) {
            var lenOld = childIndex(parent, target);
            target.outerHTML = componentHTML;
            parent.children[lenOld].outerHTML = parent.children[lenOld].innerHTML;
            for (var i = lenOld; i < parent.children.length; i++) {
                var child = parent.children[i];
                if (!child._didInit){
                    await fuse._evalElement(parent.children[i]);
                }
                else{
                    break;
                }
            }
        }
    }

    for (var j = 0; j < target.children.length; j++) {
        await renderInitComponents(target.children[j]);
    }
    
})();
    
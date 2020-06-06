
(() => {
    const TOK_START_JS = "{";
    const TOK_START_CSS = "{";
    const TOK_END = "}";
    const TOKENS = [TOK_START_JS, TOK_START_CSS, TOK_END]
    const IGNORE_INTERPRET = ["SCRIPT", "LINK", "HTML", "HEAD", "LINK", "IFRAME", "TITLE"];
    const SCAN_JS = 0;
    const SCAN_CSS = 1;
    const parser = new DOMParser();

    async function registerComponent(target, name){
        var path = `/components/${name}.html`;
        var response = await fetch(path);
        if (!response.ok){
            console.error(`${path} failed to load. It may have been moved or deleted.`);
            return;
        }
        response = await response.text();
        var responseDOM = parser.parseFromString(response, "text/html");
        var componentHTML = responseDOM.getElementsByTagName("template")[0].innerHTML;
        //console.log(componentHTML)
        for (var i = 0; i < target.childNodes.length; i++){
            var el = target.childNodes[i];
            //console.log(el);
            //console.log(el.tagName, name)
            if (el.tagName == name.toUpperCase()){
                    el.outerHTML = componentHTML;
            }

        }
    }

    async function interpret(target, closure) {
        //console.log("running", closure)
        var result = {
            onFullLoad: null,
            onChildLoad: null
        }

        var _cl = Function(` 
            this._stateChangeListens = [];
            this.find = this.querySelector;
            this.bindState = function (cb){
                if (this.state){
                    this._stateChangeListens.push(cb);
                    cb(this.state);
                }
                else if (this != document.body){
                    this.parentElement.bindState(cb);
                }
            }
            this.setState = function(newState){
                var updated = false;
                if (this.state){
                    for (var key in newState) {
                        if (newState.hasOwnProperty(key)) {
                            var val = newState[key];
                            if (this.state[key] !== undefined){
                                this.state[key] = val;
                                if (!updated){
                                    this._stateChangeListens.forEach(f => {
                                        f(newState);
                                    });
                                    updated = true;
                                }
                                
                                delete newState[key]
                            }
                        }
                    }
                    if (Object.keys(newState).length && this != document.body){
                        this.parentElement.setState(newState);
                    }
                }
                else if (this != document.body){
                    this.parentElement.setState(newState);
                }
            }
            ${closure} 
            return {
                onFullLoad: typeof this.onFullLoad === 'function' ? this.onFullLoad : null,
                onChildLoad: typeof this.onChildLoad === 'function' ? this.onChildLoad : null,
                imports: typeof this.imports === 'object' ? this.imports : null
            }
        `);
        var evaluated = _cl.call(target);
        if (evaluated.imports){
            var imports = evaluated.imports;
            for (var i = 0; i < imports.length; i++){
                await registerComponent(target, imports[i]);
            }
        }
        if (typeof evaluated.onFullLoad === 'function') {
            result.onFullLoad = evaluated.onFullLoad;
        }
        if (typeof evaluated.onChildLoad === 'function') {
            result.onChildLoad = evaluated.onChildLoad;
        }
        if (typeof evaluated.imports === 'object') {
            result.imports = evaluated.imports;
        }
        return result;
    }

    function scanForClosure(data, type) {
        var TOK_START = type;
        var left = data && data[0] == TOK_START ? 0 : -1;
        var right = -1;
        //console.log("scanning", data)
        for (var i = 0; i < data.length - 1; i++) {
            if (data[i] == "\\"){
                continue;
            }
            if (left == -1 && data[i + 1] == TOK_START) {
                left = i + 1;
            }
            else if (data[i + 1] == TOK_END) {
                right = i + 1;
            }

        }
        //console.log('done scan', [left, right])
        return [left, right]
    }

    async function parseScript(target, childCallbacks = []) {
        
        if (!target.childNodes.length){
            return;
        }
        //console.log("parsing", target)
        var rootValue = target.childNodes[0].nodeValue;
        var closureI = scanForClosure(rootValue, TOK_START_JS)
        var startI = closureI[0];
        var endI = closureI[1];
        var interpreted = {};
        var closure = rootValue.substring(startI + 1, endI)
        if (startI == -1 || endI == -1) { 
            closure = "";
        }
        else{
            target.childNodes[0].nodeValue = rootValue.replace(
                rootValue.substring(startI, endI + 2), "");
        }
        interpreted = await interpret(target, closure);
        
        for (var i = 0; i < target.children.length; i++) {
            var child = target.children[i];
            if (IGNORE_INTERPRET.indexOf(child.tagName) == -1) {
                try {
                    parseScript(child);
                }
                catch (e) {
                    console.error(e);
                }
                if (interpreted.onChildLoad) {
                    interpreted.onChildLoad(child);
                }
            }
        }
        if (interpreted.onFullLoad) {
            interpreted.onFullLoad();
        }
        //parseStyle(target);
    }
    function parseStyle(target){ //unsure about adding this feature
        if (target.childNodes.length < 3){
            return;
        }
        var i = 1;
        while (i < target.childNodes.length){
            var lastNode = target.childNodes[i];
            //console.log("node",lastNode.nodeType)
            if (lastNode.nodeType != 3){
                i++;
                continue;
            }
            lastNode = lastNode.nodeValue;
            var closureI = scanForClosure(lastNode, TOK_START_CSS)
            var startI = closureI[0];
            var endI = closureI[1];
            //console.log(startI, endI);
            if (startI != -1 && endI != -1) {
                var styles = lastNode.substring(startI + 1, endI)
                //console.log("applying", styles)
                target.style = styles;
                target.childNodes[i].nodeValue = lastNode.replace(
                    lastNode.substring(startI, endI + 2), "");
                break;
            }
            i += 1;
        }
    }
    parseScript(document.body);
})()
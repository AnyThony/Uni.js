console.log("uni loaded");
var uni;
(() => {
    const TOK_START_JS = "{";
    const TOK_END = "}";
    const IGNORE_INTERPRET = ["SCRIPT", "LINK", "HTML", "HEAD", "LINK", "IFRAME", "TITLE"];
    const parser = new DOMParser();

    //exports
    uni = {
        getComponentHTML,
        addComponent,
        _evalElement: evalElement,
        _ignore_interpret: IGNORE_INTERPRET,
        _preClosure: preClosure
    };

    // lookup component table and get its uni html
    async function getComponentHTML(name){
        var existingImport = uni._rawComponents && uni._rawComponents[name];
        var response;

        if (existingImport) {
            response = existingImport;
        } 
        else {
            var path = `/components/${name}.uni`;
            response = await fetch(path);
            if (!response.ok) {
                console.error(`${path} failed to load. It may have been moved or deleted.`);
                return false;
            }
            response = await response.text();
        }
        var responseDOM = parser.parseFromString(response, "text/html");
        return responseDOM.getElementsByTagName("template")[0].innerHTML;
    }

    // loads a component as a child of parent
    async function addComponent(name, parent, props){
        var componentHTML = await uni.getComponentHTML(name);
        // keep track of the initial num of childs
        var numChildOld = parent.children.length;
        var component = document.createElement('DIV');
        component.innerHTML = componentHTML;
        for (let i = 0; i < component.children.length; i++) {
            parent.appendChild(component.children[i]);
        }
        // component is appended
        // components can have multiple roots so they all need to be evaluated
        // numChildOld is the index of the first new component root so iteration starts there
        var children = parent.children;
        for (let i = numChildOld; i < children.length; i++) {
            if (!children[i]._didInit) {
                await evalElement(children[i], props)
            }
        }
    }

    // get props from html tag attributes
    function getProps(target) {
        var props = {};
        var nameList = target.getAttributeNames();
        for (let i = 0; i < nameList.length; i++) {
            let name = nameList[i];
            props[name] = target.getAttribute(name);
        }
        return props;
    }

    // search children of target for component tags then load if exists
    async function registerComponent(target, name) {
        var componentHTML = await uni.getComponentHTML(name);
        if (!componentHTML) return;

        for (var i = 0; i < target.childNodes.length; i++) {
            var el = target.childNodes[i];
            if (el.tagName == name.toUpperCase()) {
                let props = getProps(el);
                el.outerHTML = componentHTML;
                el = target.childNodes[i];
                evalElement(el, props);
            }
        }
    }

    // ran before every closure to bind core properties to a target
    function preClosure(){
        this.addComponent = (name, props = {}) => uni.addComponent(name, this, props);
        this._stateChangeListens = [];
        this.find = this.querySelector;

        this.bindState = function (cb){
            // attach this callback to the nearest ancestor with a declared state
            if (this.state){
                this._stateChangeListens.push(cb);
                cb(this.state);
            }
            else if (this != document.body){
                this.parentElement.bindState(cb);
            }
        };
        this.setState = function (newState) {
            var updated = false;
            // call on the nearest ancestor with a declared state
            if (!this.state) {
                if (this != document.body && this.parentElement) {
                    this.parentElement.setState(newState);
                }
                return;
            }
    
            for (let key in newState) {
                if (!newState.hasOwnProperty(key)) {
                    return;
                }
                let val = newState[key];
                if (this.state[key] !== undefined) { 
                    // if state has a matching attribute with newState
                    if (!updated) {
                        this._stateChangeListens.forEach(f => {
                            f(newState);
                        });
                        updated = true;
                    }
                    this.state[key] = val;
                    delete newState[key]; // delete the matching attribute from newState
                }
            }
            //if newState still has attributes then it could mean that they are meant for higher ancestors as well
            //we make sure by recursing on the ancestors until we used up all attributes or reached the root
            if (Object.keys(newState).length && this != document.body) {
                this.parentElement.setState(newState);
            }
        };
    }

    // setup environment and run a closure inside target context
    async function evalClosure(target, closure, props) {
        target._didInit = true;
        target.props = props;
        // same as closure.js used by the bundler
        var _cl = Function(` 
            (${preClosure.toString()}).call(this);
            ${closure} 
            return {
                onFullLoad: this.onFullLoad || null,
                onChildLoad: this.onChildLoad || null,
                imports: this.imports || null
            };
        `);
        var _context = target
        var evaluated = _cl.call(_context);
        if (evaluated.imports) {
            var imports = evaluated.imports;
            for (var i = 0; i < imports.length; i++) {
                await registerComponent(target, imports[i]);
            }
        }
        return evaluated;
    }

    // parse the node for closure
    function scanForClosure(data, type) {
        var TOK_START = type;
        var left = data && data[0] == TOK_START ? 0 : -1;
        var right = -1;
        for (var i = 0; i < data.length - 1; i++) {
            if (data[i] == "\\") {
                continue;
            }
            if (left == -1 && data[i + 1] == TOK_START) {
                left = i + 1;
            } else if (data[i + 1] == TOK_END) {
                right = i + 1;
            }
        }
        return [left, right]
    }

    // runs in-line closures, recurses on children
    async function evalElement(target, props = {}) {
        // first node value, assuming it is text
        var rootValue = (target.childNodes.length && target.childNodes[0].nodeValue) || '';
        
        var closureI = rootValue && rootValue.trim() ? scanForClosure(rootValue, TOK_START_JS) : [-1, -1]
        var startI = closureI[0];
        var endI = closureI[1];
        var evaluated = {};
        var closure = rootValue.substring(startI + 1, endI)
        if (startI == -1 || endI == -1) {
            closure = "";
        } else {
            // remove the script
            target.childNodes[0].nodeValue = rootValue.replace(
                rootValue.substring(startI, endI + 2), "");
        }
        // if the script is empty or DNE we still setup an empty closure to bind env properties in closure.js
        evaluated = await evalClosure(target, closure, props);

        for (var i = 0; i < target.children.length; i++) {
            var child = target.children[i];
            if (IGNORE_INTERPRET.indexOf(child.tagName) == -1) {
                try {
                    if (!child._didInit) {
                        evalElement(child, props);
                    }
                } catch (e) {
                    console.error(e);
                }
                if (evaluated.onChildLoad) {
                    evaluated.onChildLoad(child);
                }
            }
        }
        if (evaluated.onFullLoad) {
            evaluated.onFullLoad();
        }
    }
})()
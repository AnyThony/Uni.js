console.log("uni loaded");
var uni;
(() => {
    const TOK_START_JS = "{";
    const TOK_START_CSS = "{";
    const TOK_END = "}";
    const TOKENS = [TOK_START_JS, TOK_START_CSS, TOK_END];
    const IGNORE_INTERPRET = ["SCRIPT", "LINK", "HTML", "HEAD", "LINK", "IFRAME", "TITLE"];
    const SCAN_JS = 0;
    const SCAN_CSS = 1;
    const parser = new DOMParser();
    uni = {
        getComponentHTML: async(target, name) => {

            var existingImport = uni._rawComponents && uni._rawComponents[name];
            var response;
            if (existingImport) {
                response = existingImport;
            } else {
                console.log("getComHTML", [name, uni._rawComponents])
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
        },
        addComponent: async(name, parent, props) => {
            var componentHTML = await uni.getComponentHTML(parent, name);
            var numChildOld = parent.children.length;
            var component = document.createElement('DIV');
            component.innerHTML = componentHTML;
            for (let i = 0; i < component.children.length; i++) {
                parent.appendChild(component.children[i]);
            }
            var children = parent.children;
            for (let i = numChildOld; i < children.length; i++) {
                if (!children[i]._didInit) {
                    await evalElement(children[i], props)
                }
            }
        },
        _evalElement: evalElement,
        _ignore_interpret: IGNORE_INTERPRET,
        _getWrapContext: getWrapContext
    };

    function getWrapContext(target) {
        // TODO: wrapper
        return target;
        const handler = {
            set: function(obj, prop, value) {
                if (typeof obj[prop] == "undefined") {
                    this[prop] = value;
                } else {
                    obj[prop] = prop;
                }
            },
            get: function(obj, prop) {
                return obj[prop] || this[prop];
            }
        };

        return new Proxy(target, handler);
    }

    function getProps(target) {
        var props = {};
        var nameList = target.getAttributeNames();
        for (let i = 0; i < nameList.length; i++) {
            let name = nameList[i];
            props[name] = target.getAttribute(name);
        }

        return props;
    }

    // called on startup to load all components referenced from custom alias elements
    async function registerComponent(target, name) {
        var componentHTML = await uni.getComponentHTML(target, name);
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

    // setup environment and run a closure inside target context
    async function interpret(target, closure, props) {
        //console.log("running", target)
        var result = {
            onFullLoad: null,
            onChildLoad: null
        }
        target._didInit = true;
        target.props = props;
        var _cl = Function(` 
            this.addComponent = (name, props = {}) => uni.addComponent(name, this, props);
            this._rawImports = {}
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
            };
            this.setState = function(newState){
                
                var updated = false;
                if (this.state){
                    
                    for (var key in newState) {
                        if (newState.hasOwnProperty(key)) {
                            var val = newState[key];
                            if (this.state[key] !== undefined){
                                
                                if (!updated){
                                    this._stateChangeListens.forEach(f => {
                                        f(newState);
                                    });
                                    updated = true;
                                }
                                this.state[key] = val;
                                
                                delete newState[key]
                            }
                        }
                    }
                    if (Object.keys(newState).length && this != document.body){
                        this.parentElement.setState(newState);
                    }
                }
                else if (this != document.body && this.parentElement){
                    this.parentElement.setState(newState);
                }
            };
            ${closure} 
            return {
                onFullLoad: typeof this.onFullLoad === 'function' ? this.onFullLoad : null,
                onChildLoad: typeof this.onChildLoad === 'function' ? this.onChildLoad : null,
                imports: typeof this.imports === 'object' ? this.imports : null
            };
        `);
        var _context = getWrapContext(target)
        var evaluated = _cl.call(_context);
        if (evaluated.imports) {
            var imports = evaluated.imports;
            for (var i = 0; i < imports.length; i++) {
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

    // parse the raw data for code
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

    // initially for being called on document body, evaluates js on
    // first node if found, recurses on children
    async function evalElement(target, props = {}) {

        var rootValue = (target.childNodes.length && target.childNodes[0].nodeValue) || '';
        var closureI = rootValue && rootValue.trim() ? scanForClosure(rootValue, TOK_START_JS) : [-1, -1]
        var startI = closureI[0];
        var endI = closureI[1];
        var interpreted = {};
        var closure = rootValue.substring(startI + 1, endI)
        if (startI == -1 || endI == -1) {
            closure = "";
        } else {
            target.childNodes[0].nodeValue = rootValue.replace(
                rootValue.substring(startI, endI + 2), "");
        }
        interpreted = await interpret(target, closure, props);

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
                if (interpreted.onChildLoad) {
                    interpreted.onChildLoad(child);
                }
            }
        }
        if (interpreted.onFullLoad) {
            interpreted.onFullLoad();
        }
    }

    evalElement(document.body);
})()
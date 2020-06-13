async function renderInitComponents(target = null) {
    function getProps(target) {
        var props = {};
        var nameList = target.getAttributeNames();
        for (let i = 0; i < nameList.length; i++) {
            let name = nameList[i];
            props[name] = target.getAttribute(name);
        }
        return props;
    }

    function childIndex(parent, child) {
        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i] == child) {
                return i;
            }
        }
        return -1;
    };

    if (!target)
        target = document.body
    var tag = target.tagName;

    if (uni._ignore_interpret.indexOf(tag.toUpperCase()) != -1) {
        return;
    }

    var parent = target.parentElement;
    if (parent.imports &&
        parent.imports.map(c => c.toUpperCase()).indexOf(tag) != -1) {
        var componentHTML = uni._rawComponents[tag.toLowerCase()];
        if (componentHTML) {
            let props = getProps(target);
            var lenOld = childIndex(parent, target);
            target.outerHTML = componentHTML;
            parent.children[lenOld].outerHTML = parent.children[lenOld].innerHTML;
            for (var i = lenOld; i < parent.children.length; i++) {
                var child = parent.children[i];
                if (!child._didInit) {
                    await uni._evalElement(parent.children[i], props);
                } else {
                    break;
                }
            }
        }
    }

    for (var j = 0; j < target.children.length; j++) {
        await renderInitComponents(target.children[j]);
    }

}

// ran before every closure
function preClosure() {
    this.addComponent = (name, props = {}) => uni.addComponent(name, this, props);
    this._rawImports = {};
    this._stateChangeListens = [];
    this.find = this.querySelector;
    this.bindState = function(cb) {
        if (this.state) {
            this._stateChangeListens.push(cb);

            cb(this.state);
        } else if (this != document.body) {
            this.parentElement.bindState(cb);
        }
    };
    this.setState = function(newState) {

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
        } else if (this != document.body && this.parentElement) {
            this.parentElement.setState(newState);
        }
    };

}

// ran after every closure
function postClosure() {
    this._didInit = true;
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
}
module.exports = {
    preClosure: preClosure,
    postClosure: postClosure,
    renderInitComponents: renderInitComponents
}
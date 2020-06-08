async function renderInitComponents(target = null) {
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
    
}

// ran before every closure
function preClosure() {
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
}

// ran after every closure
function postClosure() {
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
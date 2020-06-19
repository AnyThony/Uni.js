const ncp = require('ncp').ncp;
const fs = require('fs');
const path = require('path');
ncp.limit = 16;

function unescapeHtml(unsafe) {
    return unsafe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'");
}

function copyToBuild(src, build) {
    /*
     *   Takes path src and recursivly copies all files to the new build location
     *   .uni files are ignored
     */
    var options = {
        filter: dir => {
            return dir.split('.').pop() != "uni"
        }
    }
    ncp(src, build, options, err => {
        if (err) throw err;
        // the component folder is copied but there are no ncp filters to avoid this
        // a temp work around to just delete it right after
        var componentDir = path.join(build, "/components");
        if (fs.existsSync(componentDir)) {
            fs.rmdirSync(componentDir);
        }
    })
}

module.exports = { copyToBuild, unescapeHtml }
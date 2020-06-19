const fs = require('fs-extra');

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
            && dir.split('\\').indexOf("components") == -1
        }
    }
    fs.copy(src, build, options, err => {
        if (err) throw err;
    })
}

module.exports = { copyToBuild, unescapeHtml}
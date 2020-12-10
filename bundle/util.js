const fs = require('fs-extra');

// remove script tag node from the cheerio dom
function clearScriptTag($, element){
    const childNodes = element.childNodes;
    for (let i = 0 ; i < childNodes.length; i++){
        if (childNodes[i].type === "script" &&
            $(childNodes[i]).attr("name") == "uni"){
            let hasTextAfter = i != childNodes.length-1 &&
                               childNodes[i + 1].type === "text";
            childNodes.splice(i, hasTextAfter ? 2 : 1);
            return;
        }
    }
}

function findScriptTag($, element){
    element = $(element)
    if (element.children().length === 0
        || element.children()[0].name.toLowerCase() !== "script"
        || $(element.children()[0]).attr("name") !== "uni"
        ) 
        return "";
    return $(element.children()[0])
}

function unescapeHtml(unsafe) {
    return unsafe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'");
}

function copyToBuild(src, build) {
    /*
     *   Takes path src and recursivly copies all files to the new build location
     *   .uni files are ignored
     */
    const options = {
        filter: dir => {
            return dir.split('.').pop() != "uni" 
            && dir.split('\\').indexOf("components") == -1
        }
    }
    fs.copy(src, build, options, err => {
        if (err) throw err;
    })
}

module.exports = { copyToBuild, unescapeHtml, findScriptTag, clearScriptTag}
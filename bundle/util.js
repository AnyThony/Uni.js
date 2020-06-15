const ncp = require('ncp').ncp;
const fs = require('fs');
const path = require('path');
ncp.limit = 16;

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
        var componentDir = path.join(build, "/components");
        if (fs.existsSync(componentDir)) {
            fs.rmdirSync(componentDir);
        }
    })
}

module.exports = { copyToBuild }
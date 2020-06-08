/* dev script: auto bundle upon any source change
*  live server will display results
*/
const chokidar = require('chokidar');
const { execSync } = require('child_process');

chokidar.watch('src').on('change', (event, path) => {
  execSync("node bundle/bundler");
});
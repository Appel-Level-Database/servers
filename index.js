const {listen: appListen} = require("./src/app.js");

// Clear screen, thanks stackoverflow
process.stdout.write('\033c');

console.log("====== Appel Level Database Server ======");
console.log("                  (WIP)                  \n");

require("./src/paths.js");

appListen();
const exec = require("exec-sh");

module.exports.runCommand = (command, silent = false) => {
  return exec.promise(command, silent);
};

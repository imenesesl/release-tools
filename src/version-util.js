const fs = require("fs");
const path = require("path");

const { runCommand } = require("./command");

const getPkgJson = () => {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "./package.json"))
  );
};

module.exports.getCurrentVersion = () => {
  return getPkgJson().version;
};

module.exports.updateVersion = (newVersion, noGitTag = false) => {
  let cmd = `yarn version --new-version ${newVersion}`;

  if (noGitTag) {
    cmd += " --no-git-tag-version";
  }

  return runCommand(cmd, true);
};

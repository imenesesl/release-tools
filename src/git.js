const semver = require("semver");
const { runCommand } = require("./command");

module.exports.add = async (name) => {
  return await runCommand(`git add "${name}"`);
};

module.exports.commit = async (message) => {
  return await runCommand(`git commit -m "${message}"`);
};

module.exports.push = async () => {
  return await runCommand(`git push`);
};

module.exports.pushTag = async (tagName) => {
  return await runCommand(`git push origin "${tagName}"`);
};

module.exports.tagExists = async (tagName) => {
  const output = await runCommand(`git tag -l "${tagName}"`, true);
  return output.stdout.trim() === tagName;
};

module.exports.isUpToDate = async () => {
  await runCommand(`git remote update`, true);
  const output = await runCommand(`git status`, true);
  const content = output.stdout.trim();

  return (
    content.indexOf("is behind") === -1 &&
    content.indexOf("have diverged") === -1
  );
};

module.exports.getBranchName = async () => {
  const output = await runCommand(`git rev-parse --abbrev-ref HEAD`, true);
  return output.stdout.trim();
};

module.exports.getLatestPrereleases = async (currentVer) => {
  const command = await runCommand(`git tag -l`, true);
  const tags = command.stdout
    .trim()
    .split("\n")
    .filter((tag) => tag.startsWith(`v${currentVer}-`))
    .map((tag) => tag.trim())
    .sort()
    .reverse();
  const latest = {};

  for (const tag of tags) {
    const match = tag.match(/.-(.?)(\.|$)/);
    const prerelease = match[1];

    if (!latest.hasOwnProperty(prerelease)) {
      latest[prerelease] = semver.clean(tag);
    }
  }

  return latest;
};

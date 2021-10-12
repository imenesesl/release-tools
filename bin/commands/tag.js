#!/usr/bin/env node
const semver = require("semver");
const git = require("../../src/git");
const versionUtil = require("../../src/version-util");
const questions = require("../../src/tag-questions");
const colors = require("colors/safe");

module.exports = async () => {
  // first of all, check if we are up to date with remote
  const upToDate = await git.isUpToDate();
  if (!upToDate) {
    throw new Error(
      "Your local branch is not up to date with remote. Run git pull first."
    );
  }

  const current = versionUtil.getCurrentVersion();
  let newVersion;

  const branch = await git.getBranchName();
  const isMaintenance = branch.startsWith("maintenance/");

  if (isMaintenance) {
    newVersion = await questions.nextPrereleaseVersion(current);
    await versionUtil.updateVersion(newVersion);
    console.log(
      colors.green(
        `🎉 Version v${newVersion} tagged. Since this is a maintenance fix, snapshot ver. is not updated.`
      )
    );
  } else {
    newVersion = await questions.askForNewVersion(current);
    await versionUtil.updateVersion(newVersion);

    // goes from 18.25.1 to 18.25.2-SNAPSHOT.0
    const newSnapshot = semver.inc(newVersion, "prerelease", "SNAPSHOT");
    await versionUtil.updateVersion(newSnapshot, true);
    await git.add("package.json");
    await git.commit(`Increment snapshot version to ${newSnapshot}`);

    console.log(
      colors.green(
        `🎉 Version v${newVersion} tagged. Current snapshot is ${newSnapshot}.`
      )
    );
  }

  const shouldPush = await questions.shouldPushChanges(newVersion);
  if (shouldPush) {
    await git.push();
    await git.pushTag(`v${newVersion}`);
  }

  console.log(colors.green(`🎉 ${newVersion} pushed to git.`));
};

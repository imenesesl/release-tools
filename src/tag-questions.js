const inquirer = require("inquirer");
const git = require("./git");
const semver = require("semver");

const removePrerelease = (version) => {
  return semver.coerce(version).version;
};

module.exports.askForNewVersion = async (current) => {
  const question = {
    name: "version",
    message: `Snapshot: ${current}. What should be the tagged version be?`,
    default: removePrerelease(current),
    validate: async (input) => {
      if (!semver.valid(input)) {
        return "Invalid semver version.";
      }

      const exists = await git.tagExists(`v${input}`);
      if (exists) {
        return Promise.reject(`Tag ${input} already exists.`);
      }

      return true;
    },
  };

  const answers = await inquirer.prompt([question]);
  return answers.version;
};

module.exports.shouldPushChanges = async (newVersion) => {
  const question = {
    name: "push",
    message: `Do you want to push the changes? (git push && git push origin v${newVersion})`,
    type: "confirm",
    default: true,
  };

  const answers = await inquirer.prompt([question]);
  return answers.push;
};

module.exports.nextPrereleaseVersion = async (current) => {
  const withoutPrerelease = removePrerelease(current);
  const latest = await git.getLatestPrereleases(withoutPrerelease);
  const increment = (type) => {
    // note that we're not using semver.inc here, because we don't want to increment the patch version.
    // This is not really how semver is meant to be used, but we have a different use case for prerelease versions (hotfixes)
    if (latest[type]) {
      const [, number] = semver.prerelease(latest[type]);
      return `${withoutPrerelease}-${type}.${number + 1}`;
    }

    return `${withoutPrerelease}-${type}.0`;
  };

  // new Set() removes duplicate items. We want to combine this with all existing prerelease types for this tag, so that
  // adding a custom type (choosing Custom from the menu) adds it to the selection list next time this command is used.
  const availableTypes = [
    ...new Set(["warmfix", "hotfix", "localization", ...Object.keys(latest)]),
  ];
  const choices = availableTypes.map((type) => {
    return {
      name: `${type} (next: ${increment(type)})`,
      value: increment(type),
    };
  });

  const answers = await inquirer.prompt([
    {
      name: "version",
      message: `You are on a maintenance branch. What kind of change is this?`,
      type: "list",
      choices: [
        ...choices,
        {
          name: "Custom",
          value: "custom",
        },
      ],
    },
  ]);
  let version = answers.version;

  if (version === "custom") {
    const customVersion = await inquirer.prompt([
      {
        name: "version",
        message: `Type a prerelease name (lower-case, alphanumeric)`,
        validate: (input) => {
          if (!input.match(/^[a-z0-9]+$/)) {
            return "Use alphanumeric characters only.";
          }

          return true;
        },
      },
    ]);

    version = increment(customVersion.version);
  }

  return version;
};

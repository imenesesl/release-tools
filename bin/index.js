#!/usr/bin/env node
const { Command } = require("commander");
const packageJson = require("../package.json");
const colors = require("colors/safe");

const runTagCommand = require("./commands/tag");
const runDeployCommand = require("./commands/deploy");

const withErrors = (command) => {
  return async (...args) => {
    try {
      await command(...args);
    } catch (error) {
      console.log(
        colors.bold.red("⛔ An error occurred while running this command.")
      );
      console.log(colors.red(error.stack));
      process.exitCode = 1;
    }
  };
};

const program = new Command();
program.version(packageJson.version);

program
  .command("tag")
  .description("Tag the release and increment snapshot version")
  .action(withErrors(runTagCommand));

program
  .command("deploy <file>")
  .description(
    "Deploy the file specified in <file> to nexus. The file must be a zip."
  )
  .option("--final", "set this option if this is a final (release) build")
  .option("--username <username>", "nexus username")
  .option("--password <password>", "nexus password")
  .option(
    "--override-version [version]",
    "optionally override the version. By default the version is read from package.json"
  )
  .action(withErrors(runDeployCommand));

program.parseAsync(process.argv);

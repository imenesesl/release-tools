#!/usr/bin/env node
const { Command } = require("commander");
const packageJson = require("../package.json");
const colors = require("colors/safe");

const runTagCommand = require("./commands/tag");

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

program.parseAsync(process.argv);

// @remove-file-on-eject
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use strict";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  throw err;
});

const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("react-dev-utils/chalk");
const execSync = require("child_process").execSync;
const spawn = require("react-dev-utils/crossSpawn");
const initPackage = require("../package.json");

module.exports = function(
  appPath,
  appName,
  verbose,
  originalDirectory,
  template
) {
  const pathToAppPackageJson = path.join(appPath, "package.json");

  const ownPath = path.dirname(
    require.resolve(path.join(__dirname, "..", "package.json"))
  );

  // Install additional deps
  const command = "yarnpkg";
  let args;
  let proc;

  args = ["add"];
  args.push("react-router-dom");

  proc = spawn.sync(command, args, { stdio: "inherit" });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.join(" ")}\` failed`);
    return;
  }

  args = ["add", "-D"];
  args.push(
    "express",
    "http-proxy-middleware",
    "morgan",
    "@types/react-router-dom",
    "jest",
    "jest-dom",
    "ts-jest",
    "react-testing-library",
    "env-cmd",
    "prettier",
    "husky",
    "lint-staged"
  );

  proc = spawn.sync(command, args, { stdio: "inherit" });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.join(" ")}\` failed`);
    return;
  }

  const appPackage = require(pathToAppPackageJson);

  const devDep = [
    "@types/jest",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "typescript",
    initPackage.name
  ];

  let dep;
  let depVer;
  for (let i in devDep) {
    dep = devDep[i];
    depVer = appPackage.dependencies[dep];
    appPackage.devDependencies[dep] = depVer;
    delete appPackage.dependencies[dep];
  }

  // Add husky and prettier
  appPackage.husky = {
    hooks: {
      "pre-commit": "lint-staged"
    }
  };

  appPackage["lint-staged"] = {
    "src/**/*.{js,jsx,ts,tsx,json}": ["prettier --write", "git add"]
  };

  // Setup the script rules
  appPackage.scripts = {
    start: "react-scripts start",
    build: "react-scripts build",
    test: "yarn jest --watch",
    "test:coverage": "yarn jest --coverage",
    server: "env-cmd .env node server.js"
  };

  // Setup the eslint config
  appPackage.eslintConfig = {
    parser: "@typescript-eslint/parser",
    extends: [
      "react-app",
      "plugin:@typescript-eslint/recommended",
      "prettier/@typescript-eslint",
      "plugin:prettier/recommended"
    ],
    parserOptions: {
      ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
      sourceType: "module", // Allows for the use of imports
      ecmaFeatures: {
        jsx: true // Allows for the parsing of JSX
      }
    }
  };

  appPackage.browserslist = [
    ">0.2%",
    "not dead",
    "not ie <= 11",
    "not op_mini all"
  ];

  fs.writeFileSync(
    path.join(appPath, "package.json"),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  // Copy the files for the user
  const templatePath = path.join(ownPath, "template");

  if (fs.existsSync(templatePath)) {
    fs.copySync(templatePath, appPath);
  } else {
    console.error(
      `Could not locate supplied template: ${chalk.green(templatePath)}`
    );
    return;
  }

  // Display the most elegant way to cd.
  // This needs to handle an undefined originalDirectory for
  // backward compatibility with old global-cli's.
  let cdpath;
  if (originalDirectory && path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  // Change displayed command to yarn instead of yarnpkg
  const displayedCommand = "yarn";

  console.log();
  console.log(`Success! Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} start`));
  console.log("    Starts the development server.");
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} build`));
  console.log("    Bundles the app into static files for production.");
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} test`));
  console.log("    Starts the test runner.");
  console.log(
    "    Removes this tool and copies build dependencies, configuration files"
  );
  console.log(
    "    and scripts into the app directory. If you do this, you can’t go back!"
  );
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
  console.log();
  console.log("Happy hacking!");

  console.log(`it's alive: ${initPackage.name}:${initPackage.version}`);
};

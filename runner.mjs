import { glob } from "glob";
import Mocha from "mocha";
import { Status } from "allure-js-commons";

const mocha = new Mocha({
  timeout: 60000,
  reporter: "allure-mocha",
  reporterOptions: {
    resultsDir: "allure-results",
    extraReporters: "spec",
  }});

glob.sync("test/**/*.js").forEach((file) => mocha.addFile(file));
await mocha.loadFilesAsync();
mocha.run((failures) => process.exit(failures));
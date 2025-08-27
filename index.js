const cron = require("node-cron");
const { analyse } = require("./src/lookgoodAnalyse");

cron.schedule("*/1 * * * *", () => {
  console.log("Analysing...");
  analyse();
});

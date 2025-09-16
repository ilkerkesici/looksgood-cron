const cron = require("node-cron");
const { analyse } = require("./src/lookgoodAnalyse");
const { sendReminderIfRequired } = require("./src/looksGoodReminder");

// cron.schedule("*/1 * * * *", () => {
//   // console.log("Analysing...");
//   analyse();
// });
analyse();
// sendReminderIfRequired();
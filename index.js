const cron = require("node-cron");
const { analyse } = require("./src/lookgoodAnalyse");
const { sendReminderIfRequired } = require("./src/looksGoodReminder");

cron.schedule("*/1 * * * *", () => {
  // console.log("Analysing...");
  analyse();
});

// Saatte bir çalışan yeni cron job
cron.schedule("0 * * * *", () => {
  console.log("Saatlik hatırlatma kontrolü başlatılıyor...");
  sendReminderIfRequired();
});
// analyse();
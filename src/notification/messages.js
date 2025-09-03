const getDailyReminderMessage = () => {
  return {
    headings: {
      en: "🤖 Continue to improve your beauty!",
      tr: "🤖 Kendini güzelleştirmeye devam et!",
    },
    content: {
      en: "You have tasks to complete for your beauty. Check them now!",
      tr: "Kendin için yapman gereken görevler var. Hemen kontrol et!",
    },
  };
};

const getAnalyseCompletedMessage = () => {
  return {
    headings: {
      en: "🤖 Your analysis is complete!",
      tr: "🤖 Analiziniz tamamlandı!",
    },
    content: {
      en: "You can check your analysis now!",
      tr: "Analizinizi şimdi kontrol edebilirsiniz!",
    },
  };
};

module.exports = {
  getDailyReminderMessage,
  getAnalyseCompletedMessage,
};

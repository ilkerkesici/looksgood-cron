const axios = require("axios");

const sendNotification = async (headings, content, users) => {
  await axios.post(
    `${process.env.API_DOMAIN}/api/notification/send`,
    {
      headings,
      content,
      users,
    },
    {
      headers: {
        "x-access-token": process.env.COMMON_API_TOKEN,
        pk: process.env.API_PK,
      },
    }
  );
};

module.exports = {
  sendNotification,
};

const { DateTime } = require("luxon");
const LOOKSGOOD_DB = require("./db");
const COMMON_DB = require("./db/commonDB");
const { getDailyReminderMessage } = require("./notification/messages");
const { sendNotification } = require("./notification/sendNotificaiton");

const getUsersLast24HourNotCheckedATask = async () => {
  const nowDate = DateTime.now().toSQL({ includeOffset: false });
  const todayTaskUser = await LOOKSGOOD_DB("tasks")
    .where("tasks.created_at", "<", nowDate)
    .where("tasks.ends_at", ">", nowDate)
    .join("requests", "tasks.request_id", "=", "requests.id")
    .groupBy("requests.user")
    .select("requests.user");

  const todayTaskUserList = todayTaskUser.map((user) => user.user);
  if (!todayTaskUserList.length) {
    return;
  }

  const userCheckedLast24Hours = await LOOKSGOOD_DB("task_check")
    .whereIn("user_id", todayTaskUserList)
    .andWhere(
      "created_at",
      ">",
      DateTime.now().minus({ days: 1 }).toSQL({ includeOffset: false })
    )
    .andWhere(
      "created_at",
      "<",
      DateTime.now().toSQL({ includeOffset: false })
    );

  const todayCheckedUser = userCheckedLast24Hours.map((user) => user.user_id);

  const diffUser = todayTaskUserList.filter(
    (user) => !todayCheckedUser.includes(user)
  );

  const commonnDBUsers = await COMMON_DB("users")
    .whereIn("id", diffUser)
    .andWhere("pk", process.env.APP_PK);

  const kesisim = diffUser.filter((user) =>
    commonnDBUsers.some((commonnDBUser) => commonnDBUser.id === user)
  );

  const NOTIFICATION_HOUR = 11;

  const timeZonedUsers = [];
  kesisim.forEach((user) => {
    const userTimeZone =
      commonnDBUsers.find((commonnDBUser) => commonnDBUser.id === user)
        .timezone || "UTC"; // "Europe/Istanbul"

    const userHour = DateTime.now().setZone(userTimeZone).hour;
    console.log(userHour);
    if (userHour === NOTIFICATION_HOUR) {
      timeZonedUsers.push(user);
    }
  });

  if (timeZonedUsers.length > 0) {
    const { headings, content } = getDailyReminderMessage();
    await sendNotification(headings, content, timeZonedUsers);
  }
};

const sendReminderIfRequired = async () => {
  try {
    await getUsersLast24HourNotCheckedATask();
  } catch (e) {
    console.log(e);
  }
};

module.exports = { sendReminderIfRequired };

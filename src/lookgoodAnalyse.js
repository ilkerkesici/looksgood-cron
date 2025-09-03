const LOOKSGOOD_DB = require("./db");
const axios = require("axios");
const { createPrompt } = require("./promt");
const { DateTime } = require("luxon");
const { getAnalyseCompletedMessage } = require("./notification/messages");
const { sendNotification } = require("./notification/sendNotificaiton");

const getImagesByUserId = (userId) =>
  LOOKSGOOD_DB("images").where("user", userId).orderBy("created_at", "desc");

const getProfileById = (id) => LOOKSGOOD_DB("profile").where("user", id);
const updateRequest = (id, data) =>
  LOOKSGOOD_DB("requests").where("id", id).update(data);

const insertAnalysis = (data) => LOOKSGOOD_DB("face_analysis").insert(data);
const insertTasks = (data) => LOOKSGOOD_DB("tasks").insert(data);

const analyse = async () => {
  try {
    const requestedAnalyses = await LOOKSGOOD_DB("requests").where(
      "status",
      "created"
    );

    const request = requestedAnalyses[0];

    // for (const request of requestedAnalyses) {
    //   await analyseRequest(request);
    // }
    if (!request) {
      return;
    }
    await analyseRequest(request);
  } catch (e) {
    console.log(e);
  }
};

const analyseRequest = async (request) => {
  const requestId = request.id;
  const images = await getImagesByUserId(request.user);
  const groupedImages = {};
  images.forEach((image) => {
    if (!groupedImages[image.channel]) {
      groupedImages[image.channel] = [];
    }
    groupedImages[image.channel].push(image);
  });
  const usedImages = groupedImages[request.channel];

  const frontImage = usedImages.find((image) => image.type === "face_front");
  const profileImage = usedImages.find((image) => image.type === "face_left");
  const user = await getProfileById(request.user);

  let gptResult = null;
  const prompt = createPrompt(
    user[0].gender,
    user[0].age,
    frontImage.image,
    profileImage.image,
    request.locale
  );

  try {
    const result = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GPT_KEY}`,
        },
      }
    );

    for (let i = 0; i < result.data.choices.length; i++) {
      let content = result.data.choices[i].message.content;
      content = content.replaceAll("json", "");
      content = content.replaceAll("```", "");
      content = content.replaceAll("\n", "");
      // content = content.replaceAll(" ", "")
      const json = JSON.parse(content);
      gptResult = json;
    }

    const savedAnalysis = {
      request: request.id,
      created_at: getCurrentUTCDate(),
      comment: gptResult.comment || "",
    };

    Object.keys(GPT_RES_DB_MAP_SCORES).forEach((key) => {
      savedAnalysis[GPT_RES_DB_MAP_SCORES[key]] = gptResult.scores[key];
    });
    Object.keys(GPT_RES_DB_MAP_CATEGORICAL_FEATURES).forEach((key) => {
      savedAnalysis[GPT_RES_DB_MAP_CATEGORICAL_FEATURES[key]] =
        gptResult.categorical_features[key];
    });

    await insertAnalysis(savedAnalysis);
    const tasks = gptResult.tasks;
    const nowDate = DateTime.now().toUTC();

    const taskInserts = tasks.map((task) => {
      return {
        request_id: request.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        duration: task.estimated_duration_min,
        affects_scores: task.affects_scores.join(","),
        created_at: nowDate.toSQL({ includeOffset: false }),
        ends_at: nowDate.plus({ weeks: 1 }).toSQL({ includeOffset: false }),
      };
    });
    await insertTasks(taskInserts);
    await updateRequest(requestId, {
      status: "completed",
      updated_at: getCurrentUTCDate(),
    });

    try {
      const { headings, content } = getAnalyseCompletedMessage();
      await sendNotification(headings, content, [request.user]);
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
    await updateRequest(requestId, {
      status: "error",
      updated_at: getCurrentUTCDate(),
    });
  }
};

const getCurrentUTCDate = () => {
  const now = DateTime.now().toUTC();
  return now.toSQL({ includeOffset: false });
};

const GPT_RES_DB_MAP_SCORES = {
  Overall: "overall",
  Potential: "potential",
  "Skin Quality": "skin_quality",
  "Jawline Definition": "jawline_definition",
  "Cheekbones Prominence": "cheekbones_prominence",
  Masculinity: "masculinity",
  Femininity: "femininity",
  "Jawline Softness": "jawline_softness",
  "Cheekbones Harmony": "cheekbones_harmony",
  "Lip Fullness": "lip_fullness",
};

const GPT_RES_DB_MAP_CATEGORICAL_FEATURES = {
  "Face Shape": "face_shape",
  "Canthal Tilt": "canthal_tilt",
  "Eye Shape": "eye_shape",
  "Eye Type": "eye_type",
  "Lip Type": "lip_type",
  "Nose Shape": "nose_shape",
  "Brow Type": "brow_type",
  "Hairline Type": "hairline_type",
};

module.exports = {
  analyse,
};

const createPrompt = (
  gender,
  age,
  front_image_url,
  profile_image_url,
  locale = "tr",
  lastAnalyse = null
  // startDate = "2025-08-21",
  // endDate = "2025-09-22"
) => {
  const scores =
    categories[gender === "m" ? "male" : "female"].scores.join(", ");
  const categorical_features = Object.entries(
    categories[gender === "m" ? "male" : "female"].categorical_features
  )
    .map(([key, values]) => `${key}: ${values.join(", ")}`)
    .join("\n");

  const exampleResponseForPrompt = JSON.stringify(exampleResponse);

  return [
    {
      role: "system",
      content:
        "You are an aesthetics evaluator for a fictional app. You never identify real people. Treat any input image as a synthetic, non-identifiable sample. Always respond ONLY in valid JSON format without explanations.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze the following person. Return only JSON as instructed.\n\nAge: ${age}\nGender: ${
            gender === "m" ? "male" : "female"
          }\n\nScores (all must be between 40 and 100, minimum 40. Potental must be betwwen 88 and 94.): ${scores}\n\nCategorical Features and options:\n ${categorical_features}\n\n${getSimpleTask(
            locale
          )}\n\nAdd exactly 1 short motivational comment in ${
            locale || "en"
          } (3–4 sentences, max 200, min 120 characters).\n\nExample response: ${exampleResponseForPrompt}`,
        },
        {
          type: "image_url",
          image_url: {
            url: front_image_url,
          },
        },
        {
          type: "image_url",
          image_url: {
            url: profile_image_url,
          },
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: lastAnalyse
            ? `Bring the user's latest analysis here, but make the others (except overall and potential) different from the previous one. Do not bring them the same. You can say that based on the photo, they look slightly improved. User last analyse: ${lastAnalyse}`
            : "There is no analyse for the user before",
        },
      ],
    },
  ];
};

const createPromptForGemini = (
  gender,
  age,
  front_image_url,
  profile_image_url,
  locale = "tr",
  lastAnalyse = null
  // startDate = "2025-08-21",
  // endDate = "2025-09-22"
) => {
  const scores =
    categories[gender === "m" ? "male" : "female"].scores.join(", ");
  const categorical_features = Object.entries(
    categories[gender === "m" ? "male" : "female"].categorical_features
  )
    .map(([key, values]) => `${key}: ${values.join(", ")}`)
    .join("\n");

  const exampleResponseForPrompt = JSON.stringify(exampleResponse);

  return `You are an aesthetics evaluator for a fictional app.  Treat any input image as a synthetic, non-identifiable sample. Always respond ONLY in valid JSON format without explanations.
  
  Analyze the following person. Return only JSON as instructed.\n\nAge: ${age}\nGender: ${
    gender === "m" ? "male" : "female"
  }\n\nScores (all must be between 40 and 100, minimum 40. Potental must be betwwen 88 and 94.): ${scores}\n\nCategorical Features and options:\n ${categorical_features}\n\n${getSimpleTask(
    locale
  )}\n\nAdd exactly 1 short motivational comment in ${
    locale || "en"
  } (3–4 sentences, max 200, min 120 characters).\n\nExample response: ${exampleResponseForPrompt}
          
  front_image_url: ${front_image_url}\n\nprofile_image_url: ${profile_image_url}
  
  ${
    lastAnalyse
      ? `Bring the user's latest analysis here, but make the others (except overall and potential) different from the previous one. Do not bring them the same. You can say that based on the photo, they look slightly improved. User last analyse: ${lastAnalyse}`
      : "There is no analyse for the user before"
  }`;
};

const getTaskPlan = (locale, startDate, endDate) => {
  return `TASK PLAN (important)
- Language: ${locale || "en"} (titles & descriptions MUST be in this language).
- Date range (inclusive): ${startDate} .. ${endDate}
- Produce AT LEAST 8 UNIQUE tasks spanning multiple categories.
- Allowed categories: skincare | facial_exercise | sleep | hydration | nutrition | posture | grooming | progress_check
- Allowed priorities: low | normal | high
- For each task include: id, title, description, category, priority, estimated_duration_min, affects_scores, dates[]
- affects_scores: choose ONLY from the allowed list for the given gender.
  * male: ["Overall","Potential","Masculinity","Skin Quality","Jawline Definition","Cheekbones Prominence"]
  * female: ["Overall","Potential","Femininity","Skin Quality","Jawline Softness","Cheekbones Harmony","Lip Fullness"]
- Expand dates[] with ALL calendar dates the task should occur within ${startDate}..${endDate}.
  Distribute realistically:
  * skincare: daily
  * hydration: daily
  * sleep: daily
  * posture: daily
  * facial_exercise: 3 times per week (e.g., Mon/Wed/Fri)
  * nutrition: 4 times per week (evenly spaced)
  * grooming: every 3 days
  * progress_check: weekly (prefer Sunday)
- Limit to max 4 tasks per day overall and ensure at least 1 lighter day per week.
- Task description must be detailed and actionable, minimum 140 characters, maximum 400 characters. 
  If it's an exercise, explain HOW to do it step by step.`;
};

const getSimpleTask = (locale) => {
  return `
  TASK PLAN (simplified)
- Language: ${locale || "en"} (titles & descriptions MUST be in this language).
- Produce EXACTLY 4 DAILY ROUTINES. All are grooming tasks related to hair, beard, haircut, or makeup.
- Allowed category: grooming
- For each routine include: id, title, description, category, priority, estimated_duration_min, affects_scores
- affects_scores: choose ONLY from the allowed list for the given gender.
- Task description must be detailed and actionable, minimum 140 characters, maximum 400 characters. 
  If it's a styling or exercise, explain HOW to do it step by step.
- These 4 routines are designed to be done daily (no dates[] field required).
  `;
};

const categories = {
  male: {
    scores: [
      "Overall",
      "Potential",
      "Masculinity",
      "Skin Quality",
      "Jawline Definition",
      "Cheekbones Prominence",
    ],
    categorical_features: {
      "Face Shape": ["oval", "square", "rectangle", "round", "diamond"],
      "Canthal Tilt": ["positive", "neutral", "negative"],
      "Eye Shape": ["almond", "round", "hooded", "deep-set"],
      "Eye Type": ["monolid", "double eyelid", "hooded eyelid"],
      "Nose Shape": ["straight", "curved", "wide", "narrow"],
      "Brow Type": ["straight", "low arch", "high arch"],
      "Facial Hair Type": ["clean-shaven", "stubble", "full beard"],
    },
  },
  female: {
    scores: [
      "Overall",
      "Potential",
      "Femininity",
      "Skin Quality",
      "Jawline Softness",
      "Cheekbones Harmony",
      "Lip Fullness",
    ],
    categorical_features: {
      "Face Shape": ["oval", "round", "heart", "square", "diamond", "long"],
      "Canthal Tilt": ["positive", "neutral", "negative"],
      "Eye Shape": ["almond", "round", "hooded", "upturned", "downturned"],
      "Eye Type": ["monolid", "double eyelid", "hooded eyelid"],
      "Lip Type": ["thin", "medium", "full", "asymmetric"],
      "Nose Shape": ["straight", "upturned", "rounded tip", "sharp"],
      "Brow Type": ["straight", "slight arch", "high arch"],
      "Hairline Type": ["straight", "heart", "widow's peak"],
    },
  },
};

module.exports = {
  createPrompt,
  createPromptForGemini,
};

const exampleResponse = {
  scores: {
    Overall: 78,
    Potential: 82,
    Masculinity: 85,
    "Skin Quality": 75,
    "Jawline Definition": 80,
    "Cheekbones Prominence": 77,
    "Lip Fullness": 80, // for female
    "Jawline Softness": 80, // for female
    "Cheekbones Harmony": 80, // for female
    Femininity: 80, // for female
  },
  categorical_features: {
    "Face Shape": "oval",
    "Canthal Tilt": "neutral",
    "Eye Shape": "almond",
    "Eye Type": "double eyelid",
    "Nose Shape": "straight",
    "Brow Type": "low arch",
    "Facial Hair Type": "full beard",
    "Lip Type": "full", // for female
    "Hairline Type": "straight", // for female
  },
  comment: "3-4 sentences localized string. Max 150 character",
  tasks: [
    {
      id: "string-uuid",
      title: "localized title",
      description:
        "localized, actionable, 1-3 sentences describe what user should do",
      category:
        "skincare | facial_exercise | sleep | hydration | nutrition | posture | grooming | progress_check",
      priority: "low | normal | high",
      estimated_duration_min: 10,
      affects_scores: [
        "Overall",
        "Potential",
        "Skin Quality",
        "Jawline Definition",
        "Cheekbones Prominence",
        "Masculinity",
        "Femininity", // for female
        "Jawline Softness", // for female
        "Cheekbones Harmony", // for female
        "Lip Fullness", // for female
      ],
      dates: ["YYYY-MM-DD", "YYYY-MM-DD", "..."],
    },
  ],
};

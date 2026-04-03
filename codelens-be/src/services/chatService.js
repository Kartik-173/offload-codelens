// services/authService.js
const axios = require('axios');

async function chatOllama(req) {

  req?.log?.info(
    { requestBody: req.body },
    "chatService: chatOllama request data"
  );

  const { prompt } = req.body;
  try {
    const res = await axios.post(
          "https://chatapi.cloudsanalytics.ai/api/generate",
          {
            prompt,
            model: "mistral",
            stream: false,
          }
        );

    return res.data?.response || "🤖 No response";
  } catch (error) {
    throw new Error(error.response?.data?.error_description || error.message);
  }
}

module.exports = {
  chatOllama,
};

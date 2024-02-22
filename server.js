const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const dotenv = require("dotenv");
const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage } = require("@langchain/core/messages");

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PORT = 8001;
const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
  temperature: 0.2,
  openAIApiKey: OPENAI_API_KEY,
});

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("Connected...");

  socket.on("message", async (msg) => {
    const aiResponse = await getAIResponse(msg.message);

    if (aiResponse.error) {
      socket.emit("message", {
        user: "AI",
        message: { error: aiResponse.error, details: aiResponse.details },
      });
    } else {
      socket.emit("message", { user: "Bot", message: aiResponse });
    }

    console.log(`User: ${msg.message}`);
    console.log(`AI: ${aiResponse}`);
  });
});

async function getAIResponse(userMessage) {
  try {
    const response = await chat.invoke([
      new HumanMessage({ content: userMessage }),
    ]);

    console.log("AI Response:", response);
    return response.content;
  } catch (error) {
    console.error("Error invoking chat:", error);
    return { error: "Error generating AI response.", details: error.message };
  }
}

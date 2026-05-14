const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let conversationHistory = [];
let detectedExcuses = [];
// let excuseCounts = {
//   tired: 0,
//   busy: 0,
//   later: 0,
// };

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const lastMessage = messages[messages.length - 1].content;

    const lowerMessage = lastMessage.toLowerCase();

    if (lowerMessage.includes("tired")) {
      detectedExcuses.push("User often says they are tired.");
    }

    if (lowerMessage.includes("busy")) {
      detectedExcuses.push("User claims they are too busy.");
    }

    if (lowerMessage.includes("later")) {
      detectedExcuses.push("User delays action.");
    }

    conversationHistory.push(`User: ${lastMessage}`);

    if (conversationHistory.length > 10) {
      conversationHistory.shift();
    }

    const prompt = `
You are an argumentative productivity coach.
- Challenge excuses
- Be slightly sarcastic
- Push user to act now

Known behavior patterns:
${detectedExcuses.join("\n")}

Conversation:
${conversationHistory.join("\n")}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    conversationHistory.push(`AI: ${reply}`);

    if (!reply) {
      return res.json({
        content: "No response from Gemini (check server logs)"
      });
    }

    res.json({ content: reply });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ content: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

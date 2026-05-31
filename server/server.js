const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use(cors());
app.use(express.json());


let conversationHistory = [];
let detectedExcuses = [];

let excuseCounts = {
  tired: 0,
  busy: 0,
  later: 0,
};

const excuseKeywords = {
  tired: ["tired", "exhausted", "sleepy", "burnt out", "no energy", "lazy",],
  busy: ["busy", "no time", "booked", "swamped", "overloaded", "too much going on"],
  later: ["later", "one day", "tomorrow", "afterwards", "eventually", "not now", "procrastinating"]
};

const detectCategory = (message, keywords) => {
  return keywords.some(word => message.includes(word));
};

app.post("/chat", async (req, res) => {
  try {
    const { messages, memoryEnabled } = req.body;

    if (memoryEnabled) {
      const memoryData = JSON.parse(
        fs.readFileSync("./memory.json", "utf8")
      );

      conversationHistory = memoryData.conversationHistory;
      detectedExcuses = memoryData.detectedExcuses;
      excuseCounts = memoryData.excuseCounts;
    }

    const lastMessage = messages[messages.length - 1].content;

    const lowerMessage = lastMessage.toLowerCase();

    if (detectCategory(lowerMessage, excuseKeywords.tired)) {
      excuseCounts.tired++;

      if (!detectedExcuses.includes("User often says they are tired.")) {
        detectedExcuses.push("User often says they are tired.");
      }
    }

    if (detectCategory(lowerMessage, excuseKeywords.busy)) {
      excuseCounts.busy++;

      if (!detectedExcuses.includes("User claims they are too busy.")) {
        detectedExcuses.push("User claims they are too busy.");
      }
    }

    if (detectCategory(lowerMessage, excuseKeywords.later)) {
      excuseCounts.later++;

      if (!detectedExcuses.includes("User delays action.")) {
        detectedExcuses.push("User delays action.");
      }
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

    if (memoryEnabled) {
      fs.writeFileSync(
        "./memory.json",
        JSON.stringify(
          {
            conversationHistory,
            detectedExcuses,
            excuseCounts,
          },
          null,
          2
        )
      );
    }

    app.post("/reset-memory", (req, res) => {
      const emptyMemory = {
        conversationHistory: [],
        detectedExcuses: [],
        excuseCounts: {
          tired: 0,
          busy: 0,
          later: 0,
        },
      };

      fs.writeFileSync(
        __dirname + "/memory.json",
        JSON.stringify(emptyMemory, null, 2)
      );

      res.json({ success: true });
    });

    res.json({
      content: reply,
      excuseCounts,
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ content: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
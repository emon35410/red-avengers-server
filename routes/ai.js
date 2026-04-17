const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/chat", async (req, res) => {
  try {
    const { prompt, history } = req.body; // history will be an array of previous messages (if any)

    const systemInstruction = `
    You are 'Red Bot', the official assistant for 'Red Avengers'.
    
    [STRICT LANGUAGE RULE]
    - Mirror the user's language EXACTLY.
    - If user writes in Bengali (বাংলা লিপি), reply ONLY in Bengali.
    - If user writes in Romanized Bengali/Banglish (e.g., "Kemon achen"), reply ONLY in Romanized Bengali.
    - If user writes in English, reply ONLY in English.
    - DO NOT mix languages in a single response unless the user does.

    [CORE ATTITUDE]
    - You are heroic and medical-focused.
    - Eligibility: 18-60 years, weight > 45kg, gap > 4 months.
    - If the user is from Metropolitan University Batch 58, acknowledge them as a fellow Hero, but keep the language rule strict.

    [CONVERSATION STYLE]
    - Be concise. 
    - Don't be over-excited; be professional.
`;

    // messages array will include the system instruction, the conversation history (if any), and the current user prompt
    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []), // if history exists, spread it into the messages array
      { role: "user", content: prompt },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, // create a balance between creativity and coherence
      max_tokens: 500,
      top_p: 1,
    });

    const reply = chatCompletion.choices[0]?.message?.content;
    res.send({ reply });
  } catch (error) {
    console.error("Red Bot Error:", error);
    res
      .status(500)
      .send({ message: "Red Bot is recharging!", error: error.message });
  }
});

module.exports = router;

import OpenAI from "openai";
import { KEVAI_SYSTEM_PROMPT } from "./kevaiSystemPrompt.js";

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY missing when initializing OpenAI client");
    }

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function askKevAi(prompt) {
  try {
    const openai = getClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: KEVAI_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("KevAi OpenAI Error:", err);
    throw new Error("Failed to contact KevAi.", { cause: err });
  }
}

import { askKevAi } from "../services/openaiService.js";

export async function handleKevAi(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const reply = await askKevAi(message);

    return res.json({ reply });
  } catch (err) {
    console.error("KevAi Controller Error:", err);
    return res.status(500).json({ error: "KevAi failed. Try again." });
  }
}

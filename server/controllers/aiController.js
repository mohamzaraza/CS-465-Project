import { askKevAi } from "../services/openaiService.js";
import { validateChatMessage } from "../utils/validateInputs.js";

export async function handleKevAi(req, res) {
  try {
    const message = req.body?.message;

    const problem = validateChatMessage(message);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    const reply = await askKevAi(message);

    return res.json({ reply });
  } catch (err) {
    console.error("KevAi Controller Error:", err);
    return res.status(500).json({ error: "KevAi failed. Try again." });
  }
}

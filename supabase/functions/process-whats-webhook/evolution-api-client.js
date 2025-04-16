// Get API key
import { EVOLUTION_API_KEY  } from "./env.ts";

if (!EVOLUTION_API_KEY) {
  throw new Error("Evolution API Key não configurada");
}
const sendWhatsMessage = async (phone, message) => {
  // Send WhatsApp message using Evolution API
  const evolutionUrl = `https://evolution.apps.catify.tech/message/sendText/Teste`;
  const response = await fetch(evolutionUrl, {
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });
  return response.json();
};

const getAllUserMessages = async (remoteJid) => {
  // Send WhatsApp message using Evolution API
  const evolutionUrl = `https://evolution.apps.catify.tech/chat/findMessages/Teste`;
  const response = await fetch(evolutionUrl, {
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      where: {
        key: {
          remoteJid,
        },
      },
    }),
  });
  return response.json();
};
export { sendWhatsMessage, getAllUserMessages };

import { OPENAI_API_KEY, OPENAI_API_MODEL, OPENAI_API_URL } from "./env.ts";
// function validateApiKey(){
//    if (!apiKey) {
//     return new Response(
//       JSON.stringify({ error: `Missing ${OPENAI_API_KEY_SECRET} API key` }),
//       { status: 500 },
//     );
//   }
// }
async function generateOpenAiResponse(
  systemPrompt: string,
  message: string,
) {
  return await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_API_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        // ...messagesOpenaiMapped,
        { role: "user", content: message },
      ],
    }),
  });
}

export { generateOpenAiResponse };

/** LLM Configuration */
const OPENAI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_API_MODEL = "gemini-2.5-pro-exp-03-25";
const OPENAI_API_KEY_SECRET = "GEMINI_OPENAI_API_KEY";
const OPENAI_API_KEY = Deno.env.get(OPENAI_API_KEY_SECRET);

/** Gutifin Configuration */
const COMMAND_SEPARATOR = "__HAS_COMMAND:";

const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

export { OPENAI_API_URL, OPENAI_API_MODEL, OPENAI_API_KEY_SECRET, COMMAND_SEPARATOR, EVOLUTION_API_KEY , OPENAI_API_KEY};
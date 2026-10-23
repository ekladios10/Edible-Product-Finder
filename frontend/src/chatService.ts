import type { ChatMessage, ChatReply } from "./Types.interface";

const CHAT_URL = "/api/chat";

// Sends the conversation to the backend and returns the assistant's reply.
export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Send only the latest 10 messages, matching the backend's context limit.
      messages: messages.slice(-10),
    }),
  });

  let data: ChatReply = {};

  try {
    data = (await response.json()) as ChatReply;
  } catch {
    if (!response.ok) {
      throw new Error(`Chat request failed (${response.status}).`);
    }
    throw new Error("The assistant returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        `Chat request failed (${response.status}).`
    );
  }

  if (typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("The assistant returned an empty reply.");
  }

  return data.reply;
}

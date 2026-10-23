import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessage } from "./Types.interface";
import { sendChatMessage } from "./chatService";
import "./ChatWidget.css";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Edible Product Finder assistant. Tell me about your occasion, budget, and how many people you're shopping for.",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, sending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();

    if (!text || sending) {
      return;
    }

    if (text.length > 2000) {
      setError("Please keep your message under 2,000 characters.");
      return;
    }

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const reply = await sendChatMessage(updatedMessages);

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: reply },
      ]);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Unable to contact the chat assistant."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-panel" aria-label="Product assistant">
          <header className="chat-header">
            <div>
              <h2>Product Assistant</h2>
              <p>Here to help you find the right arrangement</p>
            </div>

            <button
              type="button"
              className="chat-close"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chat-message ${
                  message.role === "user" ? "user-message" : "assistant-message"
                }`}
              >
                {message.content}
              </div>
            ))}

            {sending && (
              <div className="chat-message assistant-message">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && <p className="chat-error">{error}</p>}

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about products..."
              aria-label="Your message"
              maxLength={2000}
              disabled={sending}
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span aria-hidden="true">💬</span>
        {isOpen ? "Close chat" : "Ask our assistant"}
      </button>
    </div>
  );
}

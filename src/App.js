import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.content },
    ]);
  }

  return (
    <div className="container">
      <h2>Argumentative AI Coach</h2>

      <div className="chatBox">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "userMsg" : "aiMsg"}
          >
          <strong>
            {m.role === "user" ? "User: " : "AI: "}
          </strong>
            {m.content}
          </div>
        ))}
      </div>

      <div className="inputRow">
        <input
          className="input"
          value={input}
          placeholder="Type your excuse..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;

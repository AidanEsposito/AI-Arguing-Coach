import { useState, useEffect, useRef } from "react";
import logo from "./AIArguer.png";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [excuseCounts, setExcuseCounts] = useState({
    tired: 0,
    busy: 0,
    later: 0,
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        memoryEnabled,
      }),
    });

    const data = await res.json();
    setLoading(false);

    setExcuseCounts(
      data.excuseCounts || {
        tired: 0,
        busy: 0,
        later: 0,
      }
    );

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.content },
    ]);
  }

  async function resetMemory() {
    await fetch("http://localhost:5000/reset-memory", {
      method: "POST",
    });

    setExcuseCounts({
      tired: 0,
      busy: 0,
      later: 0,
    });

    setMessages([]);
  }

  return (
    <div className="container">
      <img
        src={logo}
        alt="Logo"
        className="logo"
        onClick={() => window.location.reload()}
      />

      <h2>Argumentative AI Coach</h2>

      <div className="counterBox">
        <h3>Excuses</h3>

        <p>Tired: {excuseCounts.tired}</p>
        <p>Busy: {excuseCounts.busy}</p>
        <p>Later: {excuseCounts.later}</p>
      </div>

    <div className="memorySettings">
      <label className="memoryToggle">
        <input
          type="checkbox"
          checked={memoryEnabled}
          onChange={() => setMemoryEnabled(!memoryEnabled)}
        />
        🧠 Persistent Memory
      </label>

      <button className="resetButton" onClick={resetMemory}>
        Reset Memory
      </button>
    </div>

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
            <div ref={chatEndRef}></div>
          </div>
        ))}

        {loading && <div className="aiMsg">AI is typing...</div>}
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
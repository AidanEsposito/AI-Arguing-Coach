import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  //const [darkMode, setDarkMode] = useState(false); //future
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
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setLoading(false);


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

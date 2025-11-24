import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const testAPI = async () => {
    try {
      const res = await fetch("http://localhost:5000/");
      const data = await res.text();
      setMessage(data);
    } catch (error) {
      setMessage("Error connecting to backend");
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Frontend ↔ Backend Connection Test</h1>

      <button onClick={testAPI} style={{ padding: "10px 20px", marginTop: "10px" }}>
        Test Backend Connection
      </button>

      <p style={{ marginTop: "20px", fontSize: "18px" }}>
        {message && `Response: ${message}`}
      </p>
    </div>
  );
}

export default App;
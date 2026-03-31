import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api.js";

function Signup() {
  const [data, setData] = useState({ name: "", email: "", password: "", role: "tenant" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Signup failed");
        return;
      }

      alert("Signup successful! Ab login karo.");
      navigate("/");

    } catch (err) {
      setError("Server se connect nahi ho pa raha");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📝 New User Signup</h2>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          placeholder="Name"
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Email"
          type="email"
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        <select
          style={styles.input}
          onChange={(e) => setData({ ...data, role: e.target.value })}
        >
          <option value="tenant">Tenant (Room Wala)</option>
          <option value="admin">Admin</option>
        </select>

        <button style={styles.button} onClick={handleSubmit}>Signup</button>
        <p style={styles.link} onClick={() => navigate("/")}>
          Already account hai? Login karo
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" },
  card: { background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "350px", display: "flex", flexDirection: "column", gap: "12px" },
  title: { textAlign: "center", marginBottom: "10px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
  button: { padding: "10px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
  error: { color: "red", textAlign: "center", fontSize: "14px" },
  link: { textAlign: "center", color: "#4f46e5", cursor: "pointer", fontSize: "13px" }
};

export default Signup;
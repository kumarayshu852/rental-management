import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";
 
function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
 
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
 
      const result = await res.json();
 
      if (!res.ok) {
        setError(result.message || "Login failed");
        setLoading(false);
        return;
      }
 
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
 
      // Role ke hisaab se redirect
      if (result.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/my-dashboard");
      }
 
    } catch (err) {
      setError("Server se connect nahi ho pa raha");
    }
    setLoading(false);
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>🏠</div>
        <h2 style={styles.title}>Rent Manager</h2>
        <p style={styles.sub}>Apne account mein login karo</p>
 
        {error && <p style={styles.error}>⚠️ {error}</p>}
 
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          placeholder="aapka@email.com"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          placeholder="••••••••"
          type="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Login ho raha hai..." : "Login Karo"}
        </button>
        <p style={styles.link} onClick={() => navigate("/signup")}>
          Naya account? Signup karo
        </p>
      </div>
    </div>
  );
}
 
const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f1f5f9" },
  card: { background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "360px", display: "flex", flexDirection: "column", gap: "10px" },
  logoWrap: { fontSize: "36px", textAlign: "center" },
  title: { textAlign: "center", margin: "0", fontSize: "22px", fontWeight: 800, color: "#1e293b" },
  sub: { textAlign: "center", color: "#64748b", fontSize: "14px", margin: "0 0 6px" },
  input: { padding: "11px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" },
  label: { fontSize: "13px", color: "#475569", fontWeight: 600, marginBottom: "-4px" },
  button: { padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: 700, marginTop: "6px" },
  error: { color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "13px", textAlign: "center" },
  link: { textAlign: "center", color: "#4f46e5", cursor: "pointer", fontSize: "13px", marginTop: "4px" }
};
 
export default Login;
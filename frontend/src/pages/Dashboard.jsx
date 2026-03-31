import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tenants, setTenants] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [activeTab, setActiveTab] = useState("milk");
  const [message, setMessage] = useState({ text: "", type: "" });

  const [milkHistory, setMilkHistory] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [milkData, setMilkData] = useState({ date: "", liter: null });
  const [bill, setBill] = useState({
    month: "", electricityBill: "", electricityRate: "",
    milkRate: "", rent: "", miscExpense: "", miscNote: ""
  });

  // ✅ Tenants ek baar fetch ho — cache mein raho
  useEffect(() => { fetchTenants(); }, []);

  useEffect(() => {
    if (selectedUser) {
      if (activeTab === "milk") fetchMilkHistory();
      if (activeTab === "bill") fetchBillHistory();
    }
  }, [selectedUser, activeTab]);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTenants(data.filter(u => u.role === "tenant"));
    } catch { showMessage("Tenants load nahi hue", "error"); }
  };

  const fetchMilkHistory = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/milkentry/user/${selectedUser}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMilkHistory(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { showMessage("Milk history load nahi hui", "error"); }
    setLoadingData(false);
  }, [selectedUser, token]);

  const fetchBillHistory = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/bill/user/${selectedUser}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBillHistory(data.sort((a, b) => b.month.localeCompare(a.month)));
    } catch { showMessage("Bill history load nahi hui", "error"); }
    setLoadingData(false);
  }, [selectedUser, token]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const handleMilkSubmit = async () => {
    if (!selectedUser) return alert("Pehle tenant select karo!");
    if (!milkData.date) return alert("Select Date !");
    if (milkData.liter === null) return alert(" Select Milk amount!");

    const res = await fetch(`${BASE_URL}/milkentry/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId: selectedUser,
        date: milkData.date,
        isPresent: milkData.liter > 0,
        liter: milkData.liter
      })
    });
    const result = await res.json();
    if (res.ok) {
      showMessage(`✅ Entry save! (${milkData.liter === 0 ? "Nahi liya" : milkData.liter + "L"})`, "success");
      setMilkData({ date: "", liter: null });
      fetchMilkHistory();
    } else {
      showMessage("❌ " + result.message, "error");
    }
  };

  const handleBillSubmit = async () => {
    if (!selectedUser) return alert("firstly select your tenant !");
    if (!bill.month) return alert("Choose the Month!");
    const res = await fetch(`${BASE_URL}/bill/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: selectedUser, ...bill })
    });
    const result = await res.json();
    if (res.ok) {
      showMessage(`✅ Your Bill is ready! Total: ₹${result.totalAmount} | Milk: ${result.milkLiters}L`, "success");
      setBill({ month: "", electricityBill: "", electricityRate: "", milkRate: "", rent: "", miscExpense: "", miscNote: "" });
      fetchBillHistory();
    } else {
      showMessage("❌ " + result.message, "error");
    }
  };

  const handleApprove = async (billId) => {
    if (!window.confirm("This bill needs to be marked paid.?")) return;
    setApprovingId(billId);
    try {
      const res = await fetch(`${BASE_URL}/bill/approve/${billId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        showMessage("✅ Payment approved!", "success");
        // ✅ Sirf us bill ko update karo — dobara fetch mat karo
        setBillHistory(prev => prev.map(b =>
          b._id === billId ? { ...b, isPaid: true, paidAt: new Date() } : b
        ));
      } else {
        showMessage("❌ " + result.message, "error");
      }
    } catch { showMessage("❌ Server error", "error"); }
    setApprovingId(null);
  };

  // ✅ NAYA — Milk delete
  const handleMilkDelete = async (milkId) => {
    if (!window.confirm("This milk entry is to be deleted?")) return;
    setDeletingId(milkId);
    try {
      const res = await fetch(`${BASE_URL}/milkentry/delete/${milkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage("✅ Milk entry deleted!", "success");
        // ✅ State se hata do — dobara fetch nahi
        setMilkHistory(prev => prev.filter(m => m._id !== milkId));
      } else {
        showMessage("❌ not deleted", "error");
      }
    } catch { showMessage("❌ Server error", "error"); }
    setDeletingId(null);
  };

  // ✅ NAYA — Bill delete
  const handleBillDelete = async (billId) => {
    if (!window.confirm("Do you want to delete this bill? It won't come back!")) return;
    setDeletingId(billId);
    try {
      const res = await fetch(`${BASE_URL}/bill/delete/${billId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage("✅ Bill deleted!", "success");
        setBillHistory(prev => prev.filter(b => b._id !== billId));
      } else {
        showMessage("❌ Not deleted", "error");
      }
    } catch { showMessage("❌ Server error", "error"); }
    setDeletingId(null);
  };

  const milkPresent = milkHistory.filter(m => m.isPresent).length;
  const totalLiters = milkHistory.reduce((sum, m) => sum + m.liter, 0);
  const totalBilled = billHistory.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingBills = billHistory.filter(b => !b.isPaid).length;
  const selectedTenant = tenants.find(t => t._id === selectedUser);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>🏠</span>
          <div>
            <div style={s.headerTitle}>Rent Manager</div>
            <div style={s.headerSub}>Admin Panel</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>👤 Select the Tenant </div>
          <select style={s.select} value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">-- choose the Tenant --</option>
            {tenants.map(t => (
              <option key={t._id} value={t._id}>{t.name} — {t.email}</option>
            ))}
          </select>
          {selectedTenant && (
            <div style={s.tenantBadge}>
              <span style={s.tenantDot}></span>{selectedTenant.name} selected
            </div>
          )}
        </div>

        {message.text && (
          <div style={{ ...s.message, background: message.type === "error" ? "#fef2f2" : "#f0fdf4", color: message.type === "error" ? "#dc2626" : "#16a34a", borderColor: message.type === "error" ? "#fca5a5" : "#86efac" }}>
            {message.text}
          </div>
        )}

        <div style={s.tabs}>
          {["milk", "bill"].map(tab => (
            <button key={tab} style={activeTab === tab ? s.activeTab : s.tab} onClick={() => setActiveTab(tab)}>
              {tab === "milk" ? "🥛 Milk Entry" : "🧾 Bill"}
            </button>
          ))}
        </div>

        {/* ===== MILK TAB ===== */}
        {activeTab === "milk" && (
          <>
            {selectedUser && milkHistory.length > 0 && (
              <div style={s.statsRow}>
                <div style={s.statBox}>
                  <div style={s.statNum}>{milkPresent}</div>
                  <div style={s.statLabel}>✅ Present</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statNum}>{milkHistory.length - milkPresent}</div>
                  <div style={s.statLabel}>❌ Absent</div>
                </div>
                <div style={{ ...s.statBox, background: "#eff6ff" }}>
                  <div style={{ ...s.statNum, color: "#2563eb" }}>{totalLiters}L</div>
                  <div style={s.statLabel}>🥛 Total</div>
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>🥛 New Milk Entry</div>
              <label style={s.label}>Date:</label>
              <input style={s.input} type="date" value={milkData.date}
                onChange={(e) => setMilkData({ ...milkData, date: e.target.value })} />
              <label style={s.label}>How much milk did you take?</label>
              <div style={s.milkBtns}>
                {[0, 1, 1.5, 2].map(l => (
                  <button key={l}
                    style={{ ...s.milkBtn, background: milkData.liter === l ? (l === 0 ? "#ef4444" : "#4f46e5") : "white", color: milkData.liter === l ? "white" : "#475569", borderColor: milkData.liter === l ? (l === 0 ? "#ef4444" : "#4f46e5") : "#e2e8f0" }}
                    onClick={() => setMilkData({ ...milkData, liter: l })}>
                    {l === 0 ? "❌ Skipped" : `🥛 ${l}L`}
                  </button>
                ))}
              </div>
              <button style={s.btn} onClick={handleMilkSubmit}>Save Entry</button>
            </div>

            {selectedUser && (
              <div style={s.card}>
                <div style={s.cardTitle}>📋 Milk History</div>
                {loadingData ? <div style={s.loading}>Loading...</div>
                  : milkHistory.length === 0 ? <div style={s.empty}>No entry found</div>
                  : (
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead><tr style={s.thead}>
                          <th style={s.th}>Date</th>
                          <th style={s.th}>Status</th>
                          <th style={s.th}>Liter</th>
                          <th style={s.th}>Delete</th>
                        </tr></thead>
                        <tbody>
                          {milkHistory.map((m, i) => (
                            <tr key={m._id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                              <td style={s.td}>{new Date(m.date).toLocaleDateString("en-IN")}</td>
                              <td style={s.td}><span style={m.isPresent ? s.badgeGreen : s.badgeRed}>{m.isPresent ? "✅ Taken" : "❌ Skipped"}</span></td>
                              <td style={s.td}>{m.liter}L</td>
                              <td style={s.td}>
                                <button
                                  style={{ ...s.deleteBtn, opacity: deletingId === m._id ? 0.5 : 1 }}
                                  onClick={() => handleMilkDelete(m._id)}
                                  disabled={deletingId === m._id}
                                >
                                  {deletingId === m._id ? "..." : "🗑️"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* ===== BILL TAB ===== */}
        {activeTab === "bill" && (
          <>
            {selectedUser && billHistory.length > 0 && (
              <div style={s.statsRow}>
                <div style={s.statBox}>
                  <div style={s.statNum}>{billHistory.length}</div>
                  <div style={s.statLabel}>📄 Total Bills</div>
                </div>
                <div style={{ ...s.statBox, background: "#fef9c3" }}>
                  <div style={{ ...s.statNum, color: "#b45309" }}>₹{totalBilled.toLocaleString("en-IN")}</div>
                  <div style={s.statLabel}>💰 Total Amount</div>
                </div>
                <div style={{ ...s.statBox, background: pendingBills > 0 ? "#fef2f2" : "#f0fdf4" }}>
                  <div style={{ ...s.statNum, color: pendingBills > 0 ? "#dc2626" : "#16a34a" }}>{pendingBills}</div>
                  <div style={s.statLabel}>⏳ Pending</div>
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>🧾 New Bill generated</div>
              <div style={s.infoBox}>ℹ️ Once the bill is generated, the milk for that month will be automatically calculated.</div>
              <label style={s.label}>Month:</label>
              <input style={s.input} type="month" value={bill.month}
                onChange={(e) => setBill({ ...bill, month: e.target.value })} />
              <label style={s.label}>Electricity Units:</label>
              <input style={s.input} type="number" placeholder="As: 65" value={bill.electricityBill}
                onChange={(e) => setBill({ ...bill, electricityBill: e.target.value })} />
              <label style={s.label}>Electricity Rate (₹/unit):</label>
              <input style={s.input} type="number" placeholder="As: 7" value={bill.electricityRate}
                onChange={(e) => setBill({ ...bill, electricityRate: e.target.value })} />
              <label style={s.label}>Milk Rate (₹/liter):</label>
              <input style={s.input} type="number" placeholder="As: 60" value={bill.milkRate}
                onChange={(e) => setBill({ ...bill, milkRate: e.target.value })} />
              <label style={s.label}>Rent (₹):</label>
              <input style={s.input} type="number" placeholder="As: 5000" value={bill.rent}
                onChange={(e) => setBill({ ...bill, rent: e.target.value })} />
              <label style={s.label}>Miscellaneous (₹) — Optional:</label>
              <input style={s.input} type="number" placeholder="As: 0" value={bill.miscExpense}
                onChange={(e) => setBill({ ...bill, miscExpense: e.target.value })} />
              {bill.miscExpense && Number(bill.miscExpense) > 0 && (
                <>
                  <label style={s.label}>Misc  reason:</label>
                  <input style={s.input} type="text" placeholder="As: Water bill, repairs..." value={bill.miscNote}
                    onChange={(e) => setBill({ ...bill, miscNote: e.target.value })} />
                </>
              )}
              <button style={s.btn} onClick={handleBillSubmit}>Generate Bill</button>
            </div>

            {selectedUser && (
              <div style={s.card}>
                <div style={s.cardTitle}>📋 Bill History</div>
                {loadingData ? <div style={s.loading}>Loading...</div>
                  : billHistory.length === 0 ? <div style={s.empty}>No bill received</div>
                  : (
                    <div style={s.billCards}>
                      {billHistory.map((b) => (
                        <div key={b._id} style={{ ...s.billCard, borderColor: b.isPaid ? "#86efac" : "#e2e8f0" }}>
                          <div style={s.billCardHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={s.billMonth}>{b.month}</span>
                              <span style={b.isPaid ? s.paidBadge : s.pendingBadge}>
                                {b.isPaid ? "✅ Paid" : "⏳ Pending"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={s.billTotal}>₹{b.totalAmount.toLocaleString("en-IN")}</span>
                              {/* ✅ DELETE BUTTON */}
                              <button
                                style={{ ...s.deleteBtn, opacity: deletingId === b._id ? 0.5 : 1 }}
                                onClick={() => handleBillDelete(b._id)}
                                disabled={deletingId === b._id}
                                title="Bill delete karo"
                              >
                                {deletingId === b._id ? "..." : "🗑️"}
                              </button>
                            </div>
                          </div>
                          <div style={s.billCardBody}>
                            <span>⚡ ₹{(b.electricityBill * b.electricityRate).toLocaleString("en-IN")}</span>
                            <span>🥛 ₹{(b.milkLiters * b.milkRate).toLocaleString("en-IN")} ({b.milkLiters}L)</span>
                            <span>🏠 ₹{b.rent.toLocaleString("en-IN")}</span>
                            {b.miscExpense > 0 && (
                              <span>📦 ₹{b.miscExpense.toLocaleString("en-IN")}{b.miscNote ? ` (${b.miscNote})` : " (Misc)"}</span>
                            )}
                          </div>
                          {!b.isPaid && (
                            <div style={s.billCardFooter}>
                              <button
                                style={{ ...s.approveBtn, opacity: approvingId === b._id ? 0.6 : 1 }}
                                onClick={() => handleApprove(b._id)}
                                disabled={approvingId === b._id}
                              >
                                {approvingId === b._id ? "Processing..." : "✅ Payment Approve Karo"}
                              </button>
                            </div>
                          )}
                          {b.isPaid && b.paidAt && (
                            <div style={s.paidInfo}>
                              💚 Paid on: {new Date(b.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" },
  header: { background: "white", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "28px" },
  headerTitle: { fontWeight: 700, fontSize: "18px", color: "#1e293b" },
  headerSub: { fontSize: "12px", color: "#64748b" },
  logoutBtn: { padding: "8px 18px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  body: { maxWidth: "640px", margin: "0 auto", padding: "20px 16px" },
  card: { background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  cardTitle: { fontWeight: 700, fontSize: "16px", color: "#1e293b", marginBottom: "4px" },
  select: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" },
  label: { fontSize: "13px", color: "#475569", fontWeight: 600 },
  btn: { padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: 600 },
  infoBox: { background: "#eff6ff", color: "#1d4ed8", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" },
  tenantBadge: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#16a34a", background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px" },
  tenantDot: { width: "8px", height: "8px", background: "#16a34a", borderRadius: "50%", display: "inline-block" },
  tabs: { display: "flex", gap: "10px", marginBottom: "4px" },
  tab: { flex: 1, padding: "11px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#64748b", fontWeight: 500 },
  activeTab: { flex: 1, padding: "11px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600 },
  message: { padding: "12px 16px", borderRadius: "10px", border: "1px solid", fontSize: "14px", fontWeight: 600, marginBottom: "4px" },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "4px" },
  statBox: { background: "#f0fdf4", padding: "14px", borderRadius: "12px", textAlign: "center" },
  statNum: { fontSize: "22px", fontWeight: 800, color: "#16a34a" },
  statLabel: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  loading: { textAlign: "center", color: "#94a3b8", padding: "16px" },
  empty: { textAlign: "center", color: "#94a3b8", padding: "16px", fontStyle: "italic" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  thead: { background: "#f8fafc" },
  th: { padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, borderBottom: "2px solid #e2e8f0" },
  trEven: { background: "white" },
  trOdd: { background: "#f8fafc" },
  td: { padding: "10px 12px", color: "#334155", borderBottom: "1px solid #f1f5f9" },
  badgeGreen: { background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  badgeRed: { background: "#fee2e2", color: "#dc2626", padding: "3px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  milkBtns: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" },
  milkBtn: { padding: "10px 6px", borderRadius: "8px", border: "1.5px solid", cursor: "pointer", fontSize: "13px", fontWeight: 600 },
  billCards: { display: "flex", flexDirection: "column", gap: "12px" },
  billCard: { border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" },
  billCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc" },
  billMonth: { fontWeight: 700, color: "#1e293b", fontSize: "14px" },
  billTotal: { color: "#4f46e5", fontSize: "16px", fontWeight: 800 },
  billCardBody: { display: "flex", gap: "14px", padding: "10px 14px", fontSize: "13px", color: "#64748b", flexWrap: "wrap" },
  billCardFooter: { padding: "10px 14px", borderTop: "1px solid #f1f5f9" },
  approveBtn: { width: "100%", padding: "10px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" },
  paidBadge: { background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  pendingBadge: { background: "#fef9c3", color: "#b45309", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  paidInfo: { padding: "8px 14px", fontSize: "12px", color: "#16a34a", background: "#f0fdf4", fontWeight: 500 },
  // ✅ NAYA DELETE BUTTON
  deleteBtn: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }
};

export default Dashboard;
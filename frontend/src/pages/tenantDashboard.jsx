import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

function TenantDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [milkHistory, setMilkHistory] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("bills");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [milkRes, billRes] = await Promise.all([
        fetch(`${BASE_URL}/milkentry/user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/bill/user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const milkData = await milkRes.json();
      const billData = await billRes.json();
      setMilkHistory(milkData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setBillHistory(billData.sort((a, b) => b.month.localeCompare(a.month)));
    } catch (err) {
      console.log("Error:", err);
    }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // Stats
  const totalLiters = milkHistory.reduce((sum, m) => sum + m.liter, 0);
  const latestBill = billHistory[0];
  const pendingAmount = billHistory.filter(b => !b.isPaid).reduce((sum, b) => sum + b.totalAmount, 0);
  const paidAmount = billHistory.filter(b => b.isPaid).reduce((sum, b) => sum + b.totalAmount, 0);

  // Current month milk — UTC se month/year nikalo taaki IST shift na ho
  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const thisMonthMilk = milkHistory.filter(m => {
    const d = new Date(m.date);
    const mMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return mMonth === currentMonth;
  });
  const thisMonthLiters = thisMonthMilk.reduce((sum, m) => sum + m.liter, 0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>{user.name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div>
            <div style={s.headerName}>{user.name}</div>
            <div style={s.headerEmail}>{user.email}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      <div style={s.body}>
        <div style={s.pageTitle}>🏠 Your Dashboard</div>

        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinnerWrap}><div style={s.spinner}></div></div>
            <p style={{ color: "#94a3b8" }}>Loading Your Data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={s.summaryGrid}>
              <div style={{ ...s.summCard, background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}>
                <div style={s.summIcon}>⏳</div>
                <div style={s.summVal}>₹{pendingAmount.toLocaleString("en-IN")}</div>
                <div style={s.summLabel}>Remaining pending</div>
                <div style={s.summSub}>{billHistory.filter(b => !b.isPaid).length} bills</div>
              </div>
              <div style={{ ...s.summCard, background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
                <div style={s.summIcon}>🥛</div>
                <div style={s.summVal}>{thisMonthLiters}L</div>
                <div style={s.summLabel}>Milk this month</div>
                <div style={s.summSub}>{thisMonthMilk.length} days</div>
              </div>
              <div style={{ ...s.summCard, background: "linear-gradient(135deg, #10b981, #059669)" }}>
                <div style={s.summIcon}>✅</div>
                <div style={s.summVal}>₹{paidAmount.toLocaleString("en-IN")}</div>
                <div style={s.summLabel}>Paid Total</div>
                <div style={s.summSub}>{billHistory.filter(b => b.isPaid).length} bills</div>
              </div>
            </div>

            {/* Latest Bill Breakdown */}
            {latestBill && (
              <div style={{ ...s.billDetail, borderLeft: `4px solid ${latestBill.isPaid ? "#16a34a" : "#f59e0b"}` }}>
                <div style={s.bdHeader}>
                  <span style={s.bdTitle}>📋 Latest Bill — {latestBill.month}</span>
                  <span style={latestBill.isPaid ? s.paidBig : s.pendingBig}>
                    {latestBill.isPaid ? "✅ Paid" : "⏳ Pending"}
                  </span>
                </div>
                <div style={s.bdRows}>
                  <div style={s.bdRow}>
                    <span style={s.bdKey}>⚡ Electricity ({latestBill.electricityBill} units × ₹{latestBill.electricityRate})</span>
                    <span style={s.bdVal}>₹{(latestBill.electricityBill * latestBill.electricityRate).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={s.bdRow}>
                    <span style={s.bdKey}>🥛 Milk ({latestBill.milkLiters}L × ₹{latestBill.milkRate})</span>
                    <span style={s.bdVal}>₹{(latestBill.milkLiters * latestBill.milkRate).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={s.bdRow}>
                    <span style={s.bdKey}>🏠 Room Rent</span>
                    <span style={s.bdVal}>₹{latestBill.rent.toLocaleString("en-IN")}</span>
                  </div>
                  {latestBill.miscExpense > 0 && (
                    <div style={s.bdRow}>
                      <span style={s.bdKey}>📦 Misc{latestBill.miscNote ? ` — ${latestBill.miscNote}` : ""}</span>
                      <span style={s.bdVal}>₹{latestBill.miscExpense.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div style={{ ...s.bdRow, ...s.bdTotal }}>
                    <span>💰 Kul Total</span>
                    <span>₹{latestBill.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                {latestBill.isPaid && latestBill.paidAt && (
                  <div style={s.paidDate}>
                    💚 Admin ne approve kiya: {new Date(latestBill.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
                {!latestBill.isPaid && (
                  <div style={s.pendingNote}>
                    ⚠️ This bill has not yet been approved by the administrator. Please wait for the approval of administrator. If it's taking too Long then contact Your administrator. and Thank you for Your Patience. 
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div style={s.tabs}>
              <button style={activeTab === "bills" ? s.activeTab : s.tab} onClick={() => setActiveTab("bills")}>
                🧾 Total Bills
              </button>
              <button style={activeTab === "milk" ? s.activeTab : s.tab} onClick={() => setActiveTab("milk")}>
                🥛 Milk History
              </button>
            </div>

            {/* Bill History */}
            {activeTab === "bills" && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.cardTitle}>Bill History</span>
                  <span style={s.cardBadge}>{billHistory.length} bills</span>
                </div>
                {billHistory.length === 0 ? (
                  <div style={s.empty}>No bill yet</div>
                ) : (
                  <div style={s.billCards}>
                    {billHistory.map((b) => (
                      <div key={b._id} style={{ ...s.billCard, borderColor: b.isPaid ? "#86efac" : "#fde68a" }}>
                        <div style={s.billCardHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={s.billMonth}>{b.month}</span>
                            <span style={b.isPaid ? s.paidBadge : s.pendingBadge}>
                              {b.isPaid ? "✅ Paid" : "⏳ Pending"}
                            </span>
                          </div>
                          <span style={{ ...s.billTotal, color: b.isPaid ? "#16a34a" : "#b45309" }}>
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div style={s.billCardBody}>
                          <span>⚡ ₹{(b.electricityBill * b.electricityRate).toLocaleString("en-IN")}</span>
                          <span>🥛 ₹{(b.milkLiters * b.milkRate).toLocaleString("en-IN")} ({b.milkLiters}L)</span>
                          <span>🏠 ₹{b.rent.toLocaleString("en-IN")}</span>
                          {b.miscExpense > 0 && (
                            <span>📦 ₹{b.miscExpense.toLocaleString("en-IN")}{b.miscNote ? ` (${b.miscNote})` : " (Misc)"}</span>
                          )}
                        </div>
                        {b.isPaid && b.paidAt && (
                          <div style={s.paidInfo}>
                            💚 Paid: {new Date(b.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Milk History */}
            {activeTab === "milk" && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.cardTitle}>Milk Records</span>
                  <span style={s.cardBadge}>{totalLiters}L total</span>
                </div>
                {milkHistory.length === 0 ? (
                  <div style={s.empty}>No milk entries yet</div>
                ) : (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr style={s.thead}>
                          <th style={s.th}>Date</th>
                          <th style={s.th}>Status</th>
                          <th style={s.th}>Liters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milkHistory.map((m, i) => (
                          <tr key={m._id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.td}>{new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                            <td style={s.td}>
                              <span style={m.isPresent ? s.badgeGreen : s.badgeRed}>
                                {m.isPresent ? "✅ Taken" : "❌ Skipped"}
                              </span>
                            </td>
                            <td style={s.td}>{m.liter}L</td>
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
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" },
  header: { background: "white", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "18px" },
  headerName: { fontWeight: 700, fontSize: "16px", color: "#1e293b" },
  headerEmail: { fontSize: "12px", color: "#64748b" },
  logoutBtn: { padding: "8px 18px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  body: { maxWidth: "640px", margin: "0 auto", padding: "20px 16px" },
  pageTitle: { fontSize: "22px", fontWeight: 800, color: "#1e293b", marginBottom: "16px" },
  loadingBox: { textAlign: "center", padding: "60px 0" },
  spinnerWrap: { display: "flex", justifyContent: "center", marginBottom: "12px" },
  spinner: { width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTop: "3px solid #4f46e5", borderRadius: "50%" },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" },
  summCard: { borderRadius: "14px", padding: "16px 10px", color: "white", textAlign: "center" },
  summIcon: { fontSize: "20px", marginBottom: "4px" },
  summVal: { fontSize: "18px", fontWeight: 800 },
  summLabel: { fontSize: "11px", opacity: 0.9, marginTop: "2px" },
  summSub: { fontSize: "10px", opacity: 0.75, marginTop: "2px" },
  billDetail: { background: "white", borderRadius: "14px", padding: "18px 20px", marginBottom: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  bdHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  bdTitle: { fontWeight: 700, fontSize: "15px", color: "#1e293b" },
  bdRows: { display: "flex", flexDirection: "column", gap: "10px" },
  bdRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" },
  bdKey: { color: "#64748b" },
  bdVal: { fontWeight: 600, color: "#1e293b" },
  bdTotal: { borderTop: "2px solid #e2e8f0", paddingTop: "10px", fontWeight: 800, fontSize: "16px", color: "#4f46e5", marginTop: "4px" },
  paidDate: { marginTop: "12px", fontSize: "13px", color: "#16a34a", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px" },
  pendingNote: { marginTop: "12px", fontSize: "13px", color: "#b45309", background: "#fefce8", padding: "8px 12px", borderRadius: "8px" },
  paidBig: { background: "#dcfce7", color: "#16a34a", padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 },
  pendingBig: { background: "#fef9c3", color: "#b45309", padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 },
  tabs: { display: "flex", gap: "10px", marginBottom: "12px" },
  tab: { flex: 1, padding: "11px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#64748b", fontWeight: 500 },
  activeTab: { flex: 1, padding: "11px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600 },
  card: { background: "white", borderRadius: "14px", padding: "18px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", marginBottom: "16px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  cardTitle: { fontWeight: 700, fontSize: "15px", color: "#1e293b" },
  cardBadge: { fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px" },
  empty: { textAlign: "center", color: "#94a3b8", padding: "24px", fontStyle: "italic" },
  billCards: { display: "flex", flexDirection: "column", gap: "10px" },
  billCard: { border: "1px solid", borderRadius: "10px", overflow: "hidden" },
  billCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc" },
  billMonth: { fontWeight: 700, color: "#1e293b", fontSize: "14px" },
  billTotal: { fontSize: "15px", fontWeight: 800 },
  billCardBody: { display: "flex", gap: "14px", padding: "10px 14px", fontSize: "13px", color: "#64748b", flexWrap: "wrap" },
  paidBadge: { background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  pendingBadge: { background: "#fef9c3", color: "#b45309", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  paidInfo: { padding: "7px 14px", fontSize: "12px", color: "#16a34a", background: "#f0fdf4", fontWeight: 500 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  thead: { background: "#f8fafc" },
  th: { padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, borderBottom: "2px solid #e2e8f0" },
  trEven: { background: "white" },
  trOdd: { background: "#f8fafc" },
  td: { padding: "10px 12px", color: "#334155", borderBottom: "1px solid #f1f5f9" },
  badgeGreen: { background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  badgeRed: { background: "#fee2e2", color: "#dc2626", padding: "3px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
};

export default TenantDashboard;
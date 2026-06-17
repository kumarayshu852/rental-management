import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import jsPDF from "jspdf";
import {
  Home, Moon, Sun, LogOut, Milk, Receipt, CheckCircle2, Clock,
  Download, Droplet
} from "lucide-react";
import BASE_URL from "../api/api";
import { useTheme } from "../context/ThemeContext";

function TenantDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("bill");
  const [milkHistory, setMilkHistory] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => {
    if (activeTab === "milk") fetchMilkHistory();
    if (activeTab === "bill") fetchBillHistory();
  }, [activeTab]);

  const fetchMilkHistory = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/milkentry/user/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMilkHistory(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { /* silent */ }
    setLoadingData(false);
  };

  const fetchBillHistory = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/bill/user/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBillHistory(data.sort((a, b) => b.month.localeCompare(a.month)));
    } catch { /* silent */ }
    setLoadingData(false);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const sanitizeText = (str) => {
    if (!str) return "";
    return String(str).normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  };

  const generateBillPDF = (b) => {
    const doc = new jsPDF();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Rent Manager", 14, 20);
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text("Monthly Bill Invoice", 14, 28);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Tenant: ${user.name || "N/A"}`, 14, 48);
    doc.setFont(undefined, "normal");
    doc.text(`Email: ${user.email || "N/A"}`, 14, 55);
    doc.text(`Bill Month: ${b.month}`, 14, 62);

    doc.setFontSize(11);
    if (b.isPaid) {
      doc.setTextColor(22, 163, 74);
      doc.text(`Status: PAID${b.paidAt ? " on " + new Date(b.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}`, 14, 69);
    } else {
      doc.setTextColor(217, 119, 6);
      doc.text("Status: PENDING", 14, 69);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 76, 196, 76);

    let y = 86;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("DESCRIPTION", 14, y);
    doc.text("AMOUNT", 170, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 3, 196, y + 3);

    y += 12;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);

    const rows = [
      [`Electricity (${b.electricityBill} units x Rs.${b.electricityRate})`, b.electricityBill * b.electricityRate],
      [`Milk (${b.milkLiters} L x Rs.${b.milkRate})`, b.milkLiters * b.milkRate],
      ["Room Rent", b.rent],
    ];
    if (b.miscExpense > 0) {
      rows.push([`Miscellaneous${b.miscNote ? " - " + sanitizeText(b.miscNote) : ""}`, b.miscExpense]);
    }

    rows.forEach(([label, amount]) => {
      const lines = doc.splitTextToSize(label, 145);
      doc.text(lines, 14, y);
      doc.text(`Rs. ${amount.toLocaleString("en-IN")}`, 170, y, { align: "right" });
      y += lines.length * 7 + 3;
    });

    y += 4;
    doc.setDrawColor(124, 58, 237);
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(124, 58, 237);
    doc.text("TOTAL AMOUNT", 14, y);
    doc.text(`Rs. ${b.totalAmount.toLocaleString("en-IN")}`, 170, y, { align: "right" });

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 14, 280);

    doc.save(`Bill_${user.name || "Tenant"}_${b.month}.pdf`);
  };

  const milkPresent = milkHistory.filter(m => m.liter > 0).length;
  const milkAbsent = milkHistory.filter(m => m.liter === 0).length;
  const totalLiters = milkHistory.reduce((sum, m) => sum + m.liter, 0);
  const totalBilled = billHistory.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingBills = billHistory.filter(b => !b.isPaid).length;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const groupedMilk = milkHistory.reduce((acc, entry) => {
    const d = new Date(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
  const sortedMilkMonths = Object.keys(groupedMilk).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#080810] relative overflow-hidden">

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: theme === "dark"
            ? "radial-gradient(circle, #ffffff08 1px, transparent 1px)"
            : "radial-gradient(circle, #00000008 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <motion.div
        className="fixed w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"
        style={{ top: "5%", right: "5%" }}
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#080810]/85 backdrop-blur-xl border-b border-zinc-200 dark:border-violet-500/15 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center">
            <Home className="w-4.5 h-4.5 text-violet-600 dark:text-violet-300" />
          </div>
          <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-50 text-[15px] leading-tight">Rent Manager</div>
            <div className="text-xs text-zinc-500">Hi, {user.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-400" />
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
            <Sun className="w-4 h-4 text-zinc-400" />
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl h-9 px-4 text-sm font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">

        {/* TABS */}
        <div className="flex gap-2.5 mb-4">
          {[{ id: "bill", label: "My Bills", icon: Receipt }, { id: "milk", label: "Milk History", icon: Milk }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold border transition-colors ${
                activeTab === id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
                  : "bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-violet-500/15 text-zinc-500"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* BILLS TAB */}
        {activeTab === "bill" && (
          <>
            {billHistory.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <StatBox label="Bills" value={billHistory.length} color="violet" />
                <StatBox label="Total Paid" value={`₹${totalBilled.toLocaleString("en-IN")}`} color="amber" />
                <StatBox label="Pending" value={pendingBills} color={pendingBills > 0 ? "red" : "green"} />
              </div>
            )}

            <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-sm dark:shadow-none">
              <div className="font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">Bill History</div>
              {loadingData ? <Loader /> : billHistory.length === 0 ? <Empty text="Abhi koi bill nahi bana" /> : (
                <div className="flex flex-col gap-3">
                  {billHistory.map(b => (
                    <div key={b._id} className={`rounded-xl border overflow-hidden ${b.isPaid ? "border-green-500/30" : "border-zinc-200 dark:border-violet-500/15"}`}>
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{b.month}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${b.isPaid ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                            {b.isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {b.isPaid ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-violet-600 dark:text-violet-300 font-bold text-[15px]">₹{b.totalAmount.toLocaleString("en-IN")}</span>
                          <button onClick={() => generateBillPDF(b)} className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400" title="Download PDF">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3.5 px-3.5 py-2.5 text-xs text-zinc-500 flex-wrap">
                        <span>⚡ ₹{(b.electricityBill * b.electricityRate).toLocaleString("en-IN")}</span>
                        <span>🥛 ₹{(b.milkLiters * b.milkRate).toLocaleString("en-IN")} ({b.milkLiters}L)</span>
                        <span>🏠 ₹{b.rent.toLocaleString("en-IN")}</span>
                        {b.miscExpense > 0 && <span>📦 ₹{b.miscExpense.toLocaleString("en-IN")}{b.miscNote ? ` (${b.miscNote})` : ""}</span>}
                      </div>
                      {b.isPaid && b.paidAt && (
                        <div className="px-3.5 py-2 text-xs text-green-600 dark:text-green-400 bg-green-500/5">
                          Paid on {new Date(b.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* MILK TAB */}
        {activeTab === "milk" && (
          <>
            {milkHistory.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <StatBox label="Present" value={milkPresent} color="green" />
                <StatBox label="Skipped" value={milkAbsent} color="red" />
                <StatBox label="Total" value={`${totalLiters}L`} color="violet" />
              </div>
            )}

            <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">
                <Droplet className="w-4.5 h-4.5 text-violet-500" /> Milk History
              </div>
              {loadingData ? <Loader /> : milkHistory.length === 0 ? <Empty text="No entry found." /> : (
                <div className="flex flex-col gap-2.5">
                  {sortedMilkMonths.map(monthKey => {
                    const entries = groupedMilk[monthKey];
                    const [year, monthNum] = monthKey.split("-");
                    const monthLabel = `${monthNames[Number(monthNum) - 1]} ${year}`;
                    const totalL = entries.reduce((s, e) => s + e.liter, 0);
                    const isOpen = expandedMonth === monthKey;

                    return (
                      <div key={monthKey} className="border border-zinc-200 dark:border-violet-500/15 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedMonth(isOpen ? null : monthKey)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{monthLabel}</span>
                            <span className="text-xs text-zinc-500">({entries.length} entries)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-violet-600 dark:text-violet-300 font-semibold">{totalL}L total</span>
                            <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-zinc-400">▼</motion.span>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="px-4 py-3 border-t border-zinc-200 dark:border-violet-500/15">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs uppercase text-zinc-500 border-b border-zinc-200 dark:border-violet-500/15">
                                      <th className="text-left py-2 font-semibold">Date</th>
                                      <th className="text-left py-2 font-semibold">Status</th>
                                      <th className="text-left py-2 font-semibold">Liter</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entries.map(m => (
                                      <tr key={m._id} className="border-b border-zinc-100 dark:border-white/[0.04]">
                                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{new Date(m.date).toLocaleDateString("en-IN")}</td>
                                        <td className="py-2.5">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${m.isPresent ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"}`}>
                                            {m.isPresent ? "Taken" : "Skipped"}
                                          </span>
                                        </td>
                                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{m.liter}L</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    green: "text-green-600 dark:text-green-400 border-green-500/20",
    red: "text-red-600 dark:text-red-400 border-red-500/20",
    violet: "text-violet-600 dark:text-violet-300 border-violet-500/20",
    amber: "text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  return (
    <div className={`bg-white dark:bg-white/[0.03] border rounded-xl p-3.5 text-center ${colors[color]}`}>
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

function Loader() { return <div className="text-center text-zinc-500 py-5 text-sm">Loading...</div>; }
function Empty({ text }) { return <div className="text-center text-zinc-500 py-5 text-sm italic">{text}</div>; }

export default TenantDashboard;
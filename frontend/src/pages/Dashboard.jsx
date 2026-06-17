import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Home, Moon, Sun, LogOut, Users, Milk, Receipt, Trash2,
  CheckCircle2, Clock, AlertTriangle, Droplet, X
} from "lucide-react";
import BASE_URL from "../api/api";
import { useTheme } from "../context/ThemeContext";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { shareBillOnWhatsApp } from "../utils/whatsapp";
import { MessageCircle } from "lucide-react";
import { Search } from "lucide-react";
import { Pencil, X as XIcon, Trash } from "lucide-react";
import ExpenseChart from "@/compontent/ExpenseChart";
import { TrendingUp } from "lucide-react";
import { BellRing } from "lucide-react";

function Dashboard() {

  // PDF 
  const sanitizeText = (str) => {
    if (!str) return "";
    return String(str).normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  };
  const generateBillPDF = (b) => {
    const doc = new jsPDF();
    const tenant = tenants.find(t => t._id === (b.userId?._id || b.userId)) || selectedTenant;

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
    doc.text(`Tenant: ${tenant?.name || "N/A"}`, 14, 48);
    doc.setFont(undefined, "normal");
    doc.text(`Email: ${tenant?.email || "N/A"}`, 14, 55);
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

    doc.save(`Bill_${tenant?.name || "Tenant"}_${b.month}.pdf`);
  };



  const [overdueBills, setOverdueBills] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { theme, toggleTheme } = useTheme();

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
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [milkSearch, setMilkSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [billFilter, setBillFilter] = useState("all"); // all, paid, pending
  const [bill, setBill] = useState({ month: "", electricityBill: "", electricityRate: "", milkRate: "", rent: "", miscExpense: "", miscNote: "" });

  useEffect(() => { fetchTenants(); }, []);
  useEffect(() => {
    if (selectedUser) {
      if (activeTab === "milk") fetchMilkHistory();
      if (activeTab === "bill") fetchBillHistory();
    }
  }, [selectedUser, activeTab]);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/get`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTenants(data.filter(u => u.role === "tenant"));
    } catch { showMessage("Tenants did not load.", "error"); }
  };
  const fetchOverdueBills = async () => {
    try {
      const res = await fetch(`${BASE_URL}/bill/overdue`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOverdueBills(data);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchTenants(); fetchOverdueBills(); }, []);

  const fetchMilkHistory = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/milkentry/user/${selectedUser}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMilkHistory(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { showMessage("Milk history did not load.", "error"); }
    setLoadingData(false);
  }, [selectedUser, token]);

  const fetchBillHistory = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${BASE_URL}/bill/user/${selectedUser}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBillHistory(data.sort((a, b) => b.month.localeCompare(a.month)));
    } catch { showMessage("Bill history did not load.", "error"); }
    setLoadingData(false);
  }, [selectedUser, token]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const handleMilkSubmit = async () => {
    if (!selectedUser) return alert("Please select the tenant!");
    if (!milkData.date) return alert("Select the date!");
    if (milkData.liter === null) return alert("Select the milk amount!");
    const res = await fetch(`${BASE_URL}/milkentry/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: selectedUser, date: milkData.date, isPresent: milkData.liter > 0, liter: milkData.liter })
    });
    const result = await res.json();
    if (res.ok) {
      showMessage(`Entry save! (${milkData.liter === 0 ? "It was not taken." : milkData.liter + "L"})`, "success");
      setMilkData({ date: "", liter: null });
      fetchMilkHistory();
    } else showMessage(result.message, "error");
  };

  const handleBillSubmit = async () => {
    if (!selectedUser) return alert("Please select the tenant!");
    if (!bill.month) return alert("Please select the month!");
    const res = await fetch(`${BASE_URL}/bill/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: selectedUser, ...bill })
    });
    const result = await res.json();
    if (res.ok) {
      showMessage(`Generate the bill.! Total: ₹${result.totalAmount} | Milk: ${result.milkLiters}L`, "success");
      setBill({ month: "", electricityBill: "", electricityRate: "", milkRate: "", rent: "", miscExpense: "", miscNote: "" });
      fetchBillHistory();
    } else showMessage(result.message, "error");
  };

  const handleApprove = async (billId) => {
    if (!window.confirm("Do you want to mark the bill as paid?")) return;
    setApprovingId(billId);
    try {
      const res = await fetch(`${BASE_URL}/bill/approve/${billId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) {
        showMessage("Payment approved!", "success");
        setBillHistory(prev => prev.map(b => b._id === billId ? { ...b, isPaid: true, paidAt: new Date() } : b));
      } else showMessage(result.message, "error");
    } catch { showMessage("Server error", "error"); }
    setApprovingId(null);
  };

  const handleMilkDelete = async (id) => {
    if (!window.confirm("Do you want to delete the milk entry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/milkentry/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showMessage("Deleted!", "success"); setMilkHistory(prev => prev.filter(m => m._id !== id)); }
      else showMessage("It was not deleted.", "error");
    } catch { showMessage("Server error", "error"); }
    setDeletingId(null);
  };

  const handleBillDelete = async (id) => {
    if (!window.confirm("Do you want to delete the bill?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/bill/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showMessage("Bill deleted!", "success"); setBillHistory(prev => prev.filter(b => b._id !== id)); }
      else showMessage("It was not deleted.", "error");
    } catch { showMessage("Server error", "error"); }
    setDeletingId(null);
  };

  const handleEditOpen = () => {
    setEditData({ name: selectedTenant.name, email: selectedTenant.email, phone: selectedTenant.phone || "" });
    setEditMode(true);
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/update/${selectedUser}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      const result = await res.json();
      if (res.ok) {
        showMessage("Tenant details have been updated.", "success");
        setEditMode(false);
        fetchTenants();
      } else {
        showMessage(result.message, "error");
      }
    } catch { showMessage("Server error", "error"); }
  };

  const handleTenantDelete = async () => {
    if (!window.confirm(`${selectedTenant.name} Do you want to delete this? It cannot be undone!`)) return;
    try {
      const res = await fetch(`${BASE_URL}/users/delete/${selectedUser}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        showMessage("Tenant has been deleted.", "success");
        setSelectedUser("");
        fetchTenants();
      } else {
        showMessage(result.message, "error");
      }
    } catch { showMessage("Server error", "error"); }
  };

  const milkPresent = milkHistory.filter(m => m.liter > 0).length;
  const milkAbsent = milkHistory.filter(m => m.liter === 0).length;
  const totalLiters = milkHistory.reduce((sum, m) => sum + m.liter, 0);
  const totalBilled = billHistory.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingBills = billHistory.filter(b => !b.isPaid).length;
  const selectedTenant = tenants.find(t => t._id === selectedUser);
  const filteredMilk = milkHistory.filter(m => {
    if (!milkSearch) return true;
    const dateStr = new Date(m.date).toLocaleDateString("en-IN");
    return dateStr.includes(milkSearch);
  });

  const filteredBills = billHistory.filter(b => {
    const matchesSearch = !billSearch || b.month.includes(billSearch);
    const matchesFilter = billFilter === "all" || (billFilter === "paid" && b.isPaid) || (billFilter === "pending" && !b.isPaid);
    return matchesSearch && matchesFilter;
  });

  const inputCls = "bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-11 rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-500";
  const labelCls = "text-xs uppercase text-zinc-500 tracking-wide font-semibold";

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
        style={{ top: "5%", left: "5%" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
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
            <div className="text-xs text-zinc-500">Admin Panel</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-400" />
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
            <Sun className="w-4 h-4 text-zinc-400" />
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl h-9 px-4 text-sm font-semibold shadow-none"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">

        {/* TENANT SELECT */}
        <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">
            <Users className="w-4.5 h-4.5 text-violet-500" /> Please select a tenant.
          </div>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-11 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">-- Select Tenant --</option>
            {tenants.map(t => <option key={t._id} value={t._id}>{t.name} — {t.email}</option>)}
          </select>
          {selectedTenant && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg w-fit mt-3"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {selectedTenant.name} selected
            </motion.div>
          )}
          {selectedTenant && !editMode && (
            <div className="flex gap-2 mt-3">
              <button onClick={handleEditOpen} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={handleTenantDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                <Trash className="w-3.5 h-3.5" /> Remove Tenant
              </button>
            </div>
          )}

          {editMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 flex flex-col gap-2.5 border-t border-zinc-200 dark:border-violet-500/15 pt-3">
              <Input placeholder="Name" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className={inputCls} />
              <Input placeholder="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className={inputCls} />
              <Input placeholder="Phone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <Button onClick={handleEditSave} className="flex-1 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm">Save Changes</Button>
                <button onClick={() => setEditMode(false)} className="px-4 h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-500">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          {overdueBills.length > 0 && (
            <Card className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm mb-2">
                <BellRing className="w-4.5 h-4.5" /> {overdueBills.length} Bill(s) It has been pending for 1+ days!
              </div>
              <div className="flex flex-col gap-2">
                {overdueBills.map(b => (
                  <div key={b._id} className="flex items-center justify-between bg-white dark:bg-white/[0.04] rounded-lg px-3 py-2 text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{b.userId?.name} — {b.month} — ₹{b.totalAmount.toLocaleString("en-IN")}</span>
                    <button onClick={() => shareBillOnWhatsApp(b, b.userId)} className="text-green-600 dark:text-green-400 text-xs font-semibold">
                      Remind →
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Card>

        {/* MESSAGE */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mb-4 border ${message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                : "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                }`}
            >
              {message.type === "error" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABS */}
        <div className="flex gap-2.5 mb-4">
          {[{ id: "milk", label: "Milk Entry", icon: Milk }, { id: "bill", label: "Bill", icon: Receipt }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold border transition-colors ${activeTab === id
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
                : "bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-violet-500/15 text-zinc-500"
                }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* MILK TAB */}
        {activeTab === "milk" && (
          <>
            {selectedUser && milkHistory.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <StatBox label="Present" value={milkPresent} color="green" />
                <StatBox label="Skipped" value={milkAbsent} color="red" />
                <StatBox label="Total" value={`${totalLiters}L`} color="violet" />
              </div>
            )}

            <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">
                <Droplet className="w-4.5 h-4.5 text-violet-500" /> New Milk Entry
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className={labelCls}>Date</Label>
                  <Input type="date" value={milkData.date} onChange={(e) => setMilkData({ ...milkData, date: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className={labelCls}>How much milk did you take?</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 1.5, 2].map(l => (
                      <button key={l} onClick={() => setMilkData({ ...milkData, liter: l })}
                        className={`h-10 rounded-xl text-sm font-semibold border transition-colors ${milkData.liter === l
                          ? l === 0 ? "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400" : "bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300"
                          : "bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-500"
                          }`}>
                        {l === 0 ? "Skipped" : `${l}L`}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleMilkSubmit} className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl">
                    Save Entry
                  </Button>
                </motion.div>
              </div>
            </Card>
            {selectedUser && (
              <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-sm dark:shadow-none">
                <div className="font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">Milk History</div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by date. (e.g. 14/6)"
                    value={milkSearch}
                    onChange={(e) => setMilkSearch(e.target.value)}
                    className="bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-10 rounded-xl pl-9 text-sm"
                  />
                </div>
                {loadingData ? <Loader /> : milkHistory.length === 0 ? <Empty text="No entry found." /> : (
                  <MonthGroupedMilk
                    milkHistory={filteredMilk}
                    expandedMonth={expandedMonth}
                    setExpandedMonth={setExpandedMonth}
                    deletingId={deletingId}
                    handleMilkDelete={handleMilkDelete}
                  />
                )}
              </Card>
            )}

          </>
        )}

        {/* BILL TAB */}
        {activeTab === "bill" && (
          <>
            {selectedUser && billHistory.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <StatBox label="Bills" value={billHistory.length} color="violet" />
                <StatBox label="Total" value={`₹${totalBilled.toLocaleString("en-IN")}`} color="amber" />
                <StatBox label="Pending" value={pendingBills} color={pendingBills > 0 ? "red" : "green"} />
              </div>
            )}
            {selectedUser && billHistory.length > 0 && (
              <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">
                  <TrendingUp className="w-4.5 h-4.5 text-violet-500" /> Monthly Expense Trend
                </div>
                <ExpenseChart billHistory={billHistory} />
              </Card>
            )}

            <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-2">
                <Receipt className="w-4.5 h-4.5 text-violet-500" /> Create a new bill.
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs px-3 py-2 rounded-lg mb-3">
                The milk for that month will be calculated automatically once the bill is generated.
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Month", key: "month", type: "month" },
                  { label: "Electricity Units", key: "electricityBill", type: "number", placeholder: "Enter your Electricity Units" },
                  { label: "Electricity Rate (₹/unit)", key: "electricityRate", type: "number", placeholder: "enter your Electricity Rates" },
                  { label: "Milk Rate (₹/liter)", key: "milkRate", type: "number", placeholder: "Enter your Mik Rates" },
                  { label: "Rent (₹)", key: "rent", type: "number", placeholder: "Enter your Rent Rate" },
                  { label: "Miscellaneous (₹) — Optional", key: "miscExpense", type: "number", placeholder: "Enter your Miscellaneous Expenses" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <Label className={labelCls}>{label}</Label>
                    <Input type={type} placeholder={placeholder} value={bill[key]} onChange={(e) => setBill({ ...bill, [key]: e.target.value })} className={inputCls} />
                  </div>
                ))}
                {bill.miscExpense && Number(bill.miscExpense) > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelCls}>Misc Reason</Label>
                    <Input type="text" placeholder="(e.g/ Water bill...)" value={bill.miscNote} onChange={(e) => setBill({ ...bill, miscNote: e.target.value })} className={inputCls} />
                  </div>
                )}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleBillSubmit} className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl">
                    Generate Bill
                  </Button>
                </motion.div>
              </div>
            </Card>

            {selectedUser && (
              <Card className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-sm dark:shadow-none">
                <div className="font-bold text-zinc-900 dark:text-zinc-50 text-[15px] mb-3">Bill History</div>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search by month (2026-06)."
                      value={billSearch}
                      onChange={(e) => setBillSearch(e.target.value)}
                      className="bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-10 rounded-xl pl-9 text-sm"
                    />
                  </div>
                  <select
                    value={billFilter}
                    onChange={(e) => setBillFilter(e.target.value)}
                    className="bg-zinc-50 dark:bg-white/[0.04] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-10 rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                {loadingData ? <Loader /> : filteredBills.length === 0 ? <Empty text="No bill found." /> : (
                  <div className="flex flex-col gap-3">
                    {filteredBills.map(b => (
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
                            <button onClick={() => generateBillPDF(b)} className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400" title="Download the PDF">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => shareBillOnWhatsApp(b, selectedTenant)} className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400" title="send it via WhatsApp.">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleBillDelete(b._id)} disabled={deletingId === b._id} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-3.5 px-3.5 py-2.5 text-xs text-zinc-500 flex-wrap">
                          <span>⚡ ₹{(b.electricityBill * b.electricityRate).toLocaleString("en-IN")}</span>
                          <span>🥛 ₹{(b.milkLiters * b.milkRate).toLocaleString("en-IN")} ({b.milkLiters}L)</span>
                          <span>🏠 ₹{b.rent.toLocaleString("en-IN")}</span>
                          {b.miscExpense > 0 && <span>📦 ₹{b.miscExpense.toLocaleString("en-IN")}{b.miscNote ? ` (${b.miscNote})` : ""}</span>}
                        </div>
                        {!b.isPaid && (
                          <div className="px-3.5 py-2.5 border-t border-zinc-100 dark:border-white/[0.04]">
                            <button onClick={() => handleApprove(b._id)} disabled={approvingId === b._id}
                              className="w-full h-9 rounded-lg bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 font-semibold text-sm disabled:opacity-60">
                              {approvingId === b._id ? "Processing..." : "Approve the payment."}
                            </button>
                          </div>
                        )}
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
            )}
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

function Loader() {
  return <div className="text-center text-zinc-500 py-5 text-sm">Loading...</div>;
}

function Empty({ text }) {
  return <div className="text-center text-zinc-500 py-5 text-sm italic">{text}</div>;
}
function MonthGroupedMilk({ milkHistory, expandedMonth, setExpandedMonth, deletingId, handleMilkDelete }) {
  // Group entries by "YYYY-MM"
  const grouped = milkHistory.reduce((acc, entry) => {
    const d = new Date(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-2.5">
      {sortedMonths.map(monthKey => {
        const entries = grouped[monthKey];
        const [year, monthNum] = monthKey.split("-");
        const monthLabel = `${monthNames[Number(monthNum) - 1]} ${year}`;
        const taken = entries.filter(e => e.liter > 0).length;
        const totalL = entries.reduce((s, e) => s + e.liter, 0);
        const isOpen = expandedMonth === monthKey;

        return (
          <div key={monthKey} className="border border-zinc-200 dark:border-violet-500/15 rounded-xl overflow-hidden">

            {/* Month Header — clickable */}
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
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-zinc-400">
                  ▼
                </motion.span>
              </div>
            </button>

            {/* Expanded entries */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 border-t border-zinc-200 dark:border-violet-500/15">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-zinc-500 border-b border-zinc-200 dark:border-violet-500/15">
                          <th className="text-left py-2 font-semibold">Date</th>
                          <th className="text-left py-2 font-semibold">Status</th>
                          <th className="text-left py-2 font-semibold">Liter</th>
                          <th className="text-left py-2 font-semibold">Delete</th>
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
                            <td className="py-2.5">
                              <button onClick={() => handleMilkDelete(m._id)} disabled={deletingId === m._id} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
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
  );
}

export default Dashboard;
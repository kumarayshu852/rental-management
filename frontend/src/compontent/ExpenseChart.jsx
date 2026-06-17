import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function ExpenseChart({ billHistory }) {
  // Last 6 months ka data, sorted oldest to newest for chart
  const chartData = [...billHistory]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(b => ({
      month: b.month,
      Electricity: b.electricityBill * b.electricityRate,
      Milk: b.milkLiters * b.milkRate,
      Rent: b.rent,
      Misc: b.miscExpense || 0,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed20" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b6b8a" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6b6b8a" }} />
          <Tooltip
            contentStyle={{ background: "#12121f", border: "1px solid #7c3aed40", borderRadius: "10px", fontSize: "12px" }}
            labelStyle={{ color: "#e2e2f0" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="Electricity" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Milk" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Rent" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Misc" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseChart;
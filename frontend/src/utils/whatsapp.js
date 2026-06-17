export const shareBillOnWhatsApp = (bill, tenant) => {
  if (!tenant?.phone) {
    alert("Tenant ka phone number nahi mila! Pehle tenant profile mein phone add karo.");
    return;
  }

  const electricity = bill.electricityBill * bill.electricityRate;
  const milk = bill.milkLiters * bill.milkRate;

  let message = `🏠 *Rent Manager - Bill Details*\n\n`;
  message += `👤 Tenant: ${tenant.name}\n`;
  message += `📅 Month: ${bill.month}\n`;
  message += `📊 Status: ${bill.isPaid ? "✅ Paid" : "⏳ Pending"}\n\n`;
  message += `--------------------------\n`;
  message += `⚡ Electricity (${bill.electricityBill} units x ₹${bill.electricityRate}): ₹${electricity.toLocaleString("en-IN")}\n`;
  message += `🥛 Milk (${bill.milkLiters}L x ₹${bill.milkRate}): ₹${milk.toLocaleString("en-IN")}\n`;
  message += `🏠 Rent: ₹${bill.rent.toLocaleString("en-IN")}\n`;

  if (bill.miscExpense > 0) {
    message += `📦 Misc${bill.miscNote ? ` (${bill.miscNote})` : ""}: ₹${bill.miscExpense.toLocaleString("en-IN")}\n`;
  }

  message += `--------------------------\n`;
  message += `💰 *Total Amount: ₹${bill.totalAmount.toLocaleString("en-IN")}*\n\n`;
  message += `Dhanyawad! 🙏`;

  // Phone number clean karo (sirf digits, +91 add karo agar nahi hai)
  let phone = tenant.phone.replace(/\D/g, "");
  if (phone.length === 10) phone = "91" + phone;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};
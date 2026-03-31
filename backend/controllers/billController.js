import Bill from "../models/billModel.js";
import Milk from "../models/milkModel.js";

// ✅ BILL BANAO — timezone-safe milk calc + duplicate block
export const addBill = async (req, res) => {
  try {
    const { userId, month, electricityBill, electricityRate, milkRate, rent, miscExpense, miscNote } = req.body;

    if (!month) {
      return res.status(400).json({ message: "Month required hai (YYYY-MM format mein)" });
    }

    // DUPLICATE CHECK
    const existingBill = await Bill.findOne({ userId, month });
    if (existingBill) {
      return res.status(400).json({
        message: `${month} ka bill pehle se bana hua hai! Duplicate nahi ban sakta.`,
        existingBill
      });
    }

    const [year, monthNum] = month.split("-");
    const y = Number(year);
    const m = Number(monthNum);

    // ✅ TIMEZONE-SAFE DATE RANGE
    // ISO string use karo taaki UTC boundary sahi rahe
    // Month ki pehli din 00:00:00 UTC
    const startDate = new Date(`${year}-${String(m).padStart(2, "0")}-01T00:00:00.000Z`);
    // Agli month ki pehli din — yani is month ki aakhri millisecond tak
    const endDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)); // next month 1st, midnight UTC

    // Electricity
    const electricity = Number(electricityBill) * Number(electricityRate);

    // ✅ MILK — UTC-safe range query
    const milkRecords = await Milk.find({
      userId,
      date: {
        $gte: startDate,
        $lt: endDate   // $lt next month start = sab is month ke records
      }
    });

    console.log(`Milk records found for ${month}:`, milkRecords.length);

    const totalMilk = milkRecords.reduce((sum, item) => sum + item.liter, 0);
    const milkAmount = totalMilk * Number(milkRate);

    const misc = Number(miscExpense) || 0;
    const total = electricity + milkAmount + Number(rent) + misc;

    const bill = new Bill({
      userId,
      month,
      electricityBill: Number(electricityBill),
      electricityRate: Number(electricityRate),
      milkLiters: totalMilk,
      milkRate: Number(milkRate),
      rent: Number(rent),
      miscExpense: misc,
      miscNote: miscNote || "",
      totalAmount: total,
      isPaid: false
    });

    await bill.save();
    res.json(bill);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Is month ka bill pehle se bana hua hai! Duplicate nahi ban sakta."
      });
    }
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Kisi user ki sab bills
export const getUserBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.params.userId }).sort({ month: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sab users ke bills (admin ke liye)
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("userId", "name email")
      .sort({ month: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ PAYMENT APPROVE
export const approveBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    if (!bill) return res.status(404).json({ message: "Bill nahi mila" });
    if (bill.isPaid) return res.status(400).json({ message: "Yeh bill pehle se paid hai" });

    bill.isPaid = true;
    bill.paidAt = new Date();
    await bill.save();

    res.json({ message: "Bill paid mark ho gaya ✅", bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ PURANE DUPLICATE BILLS DELETE — ek baar chalao
// GET /api/bill/fix-duplicates
export const fixDuplicateBills = async (req, res) => {
  try {
    // Sab bills lao
    const allBills = await Bill.find().sort({ createdAt: 1 }); // purana pehle

    const seen = new Map(); // key: userId+month
    const toDelete = [];

    for (const bill of allBills) {
      const key = `${bill.userId}_${bill.month}`;
      if (seen.has(key)) {
        // Duplicate — delete karo (paid wala rakho agar hai)
        const existing = seen.get(key);
        if (bill.isPaid && !existing.isPaid) {
          // Naya paid hai, purana delete karo
          toDelete.push(existing._id);
          seen.set(key, bill);
        } else {
          toDelete.push(bill._id);
        }
      } else {
        seen.set(key, bill);
      }
    }

    if (toDelete.length > 0) {
      await Bill.deleteMany({ _id: { $in: toDelete } });
    }

    res.json({
      message: `✅ ${toDelete.length} duplicate bills delete ho gaye`,
      deleted: toDelete.length,
      remaining: allBills.length - toDelete.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
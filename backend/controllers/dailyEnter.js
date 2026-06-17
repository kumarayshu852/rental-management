import Milk from "../models/milkModel.js";

export const addMilkEntry = async (req, res) => {
  try {
    const { userId, date, isPresent, liter } = req.body;
    const milkLiter = liter !== undefined ? Number(liter) : (isPresent ? 1 : 0);
    const present = milkLiter > 0;
    const milk = new Milk({ userId, date, isPresent: present, liter: milkLiter });
    await milk.save();
    res.status(200).json({ message: "Milk entry added successfully", liter: milkLiter });
  } catch (error) {
    console.log("MILK ERROR:", error);
    res.status(500).json({ message: "Error adding milk entry" });
  }
};

export const getMilkEntries = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await Milk.find({ userId }).sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllMilkEntries = async (req, res) => {
  try {
    const data = await Milk.find().populate("userId", "name email").sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NAYA — Milk entry delete
export const deleteMilkEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await Milk.findByIdAndDelete(id);
    res.json({ message: "Milk entry has been deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import Milk from "../models/milkModel.js";

// Milk entry add karo
export const addMilkEntry = async (req, res) => {
  try {
    const { userId, date, isPresent, liter } = req.body;

    // ✅ Liter frontend se aaye — 0, 1, 1.5, 2
    // Agar liter explicitly aaya toh use karo, warna isPresent se decide karo
    const milkLiter = liter !== undefined ? Number(liter) : (isPresent ? 1 : 0);
    const present = milkLiter > 0;

    const milk = new Milk({
      userId,
      date,
      isPresent: present,
      liter: milkLiter
    });

    await milk.save();
    res.status(200).json({ message: "Milk entry added successfully", liter: milkLiter });

  } catch (error) {
    console.log("MILK ERROR:", error);
    res.status(500).json({ message: "Error adding milk entry" });
  }
};

// Kisi ek user ki milk entries lo
export const getMilkEntries = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await Milk.find({ userId }).sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sab users ki entries (admin ke liye)
export const getAllMilkEntries = async (req, res) => {
  try {
    const data = await Milk.find().populate("userId", "name email").sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
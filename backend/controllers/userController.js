import User from "../models/userModel.js";

// Sab users lo (admin ke liye)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Ek user ki detail
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// new function added
export const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { phone }, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Naya — Tenant update karo (name, email, phone)
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not founde" });
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "This email is already in use." });
    }
    res.status(500).json({ message: error.message });
  }
};

// Naya — Tenant delete karo
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin cannot be deleted." });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Tenant has been deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
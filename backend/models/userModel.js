import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: { type: String, default: "" },
  role: { type: String, enum: ["admin", "tenant"], default: "tenant" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
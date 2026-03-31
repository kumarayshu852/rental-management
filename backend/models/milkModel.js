import mongoose from "mongoose";

const milkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: { type: Date, required: true },
  isPresent: { type: Boolean, required: true },
  liter: { type: Number, required: true }
}, { timestamps: true });

const Milk = mongoose.model("Milk", milkSchema);
export default Milk;
import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  month: {
    type: String,
    required: true
  },
  electricityBill: { type: Number, required: true },
  electricityRate: { type: Number, required: true },
  milkLiters: { type: Number, required: true },
  milkRate: { type: Number, required: true },
  rent: { type: Number, required: true },
  miscExpense: { type: Number, default: 0 },
  miscNote: { type: String, default: "" },
  totalAmount: { type: Number, required: true },

  // Payment status
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null }

}, { timestamps: true });

// ✅ EK USER KA EK MONTH MEIN SIRF 1 BILL — DUPLICATE BLOCK
billSchema.index({ userId: 1, month: 1 }, { unique: true });

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
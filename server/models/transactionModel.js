import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    planId: { type: String, required: true }, // ✅ Fixed planId requirement
    amount: { type: Number, required: true },
    credits: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
});

const transactionModel = mongoose.models.transaction || mongoose.model("transaction", transactionSchema);

export default transactionModel;

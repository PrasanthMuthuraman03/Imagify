import userModel from "../models/userModels.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({ name, email, password: hashedPassword });
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ success: true, token, user: { name: user.name } });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.json({ success: true, token, user: { name: user.name } });
        } else {
            return res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const userCredits = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("-password"); // Exclude password

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, credits: user.creditBalance, user });  // ✅ Send full user object
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentRazorPay = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.body;

        if (!userId || !planId) {
            return res.json({ success: false, message: "Missing Details" });
        }

        let credits, amount;
        switch (planId) {
            case 'Basic':
                credits = 100;
                amount = 10;
                break;
            case 'Advanced':
                credits = 500;
                amount = 50;
                break;
            case 'Business':
                credits = 5000;
                amount = 250;
                break;
            default:
                return res.json({ success: false, message: 'Plan not found' });
        }

        const newTransaction = await transactionModel.create({ userId, planId, amount, credits, date: Date.now() });

        const order = await razorpayInstance.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: newTransaction._id.toString(),
        });

        res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt);

            if (!transactionData) {
                return res.json({ success: false, message: 'Transaction not found' });
            }

            if (transactionData.payment === true) {
                return res.json({ success: false, message: 'Payment Already Processed' });
            }

            const userData = await userModel.findById(transactionData.userId);
            if (!userData) {
                return res.json({ success: false, message: 'User not found' });
            }

            await userModel.findByIdAndUpdate(userData._id, { $inc: { creditBalance: transactionData.credits } });
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

            res.json({ success: true, message: "Credits Added" });
        } else {
            res.json({ success: false, message: "Payment Failed" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { registerUser, loginUser, userCredits, paymentRazorPay, verifyRazorpay };

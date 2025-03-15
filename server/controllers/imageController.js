import userModel from "../models/userModels.js";
import FormData from "form-data";
import axios from "axios";

const generateImage = async (req, res) => {
    try {
        const { userId, prompt } = req.body;

        if (!userId || !prompt) {
            return res.status(400).json({
                success: false,
                message: "Missing Details",
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.creditBalance === 0 || user.creditBalance < 0) {
            return res.status(403).json({
                success: false,
                message: "No Credit Balance",
                creditBalance: user.creditBalance,
            });
        }

        // Prepare FormData for API request
        const formData = new FormData();
        formData.append("prompt", prompt);

        // API request to Clipdrop
        const { data } = await axios.post(
            "https://clipdrop-api.co/text-to-image/v1",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "x-api-key": process.env.CLIPDROP_API,
                },
                responseType: "arraybuffer",
            }
        );

        // Convert response to base64 image
        const base64Image = Buffer.from(data, "binary").toString("base64");
        const resultImage = `data:image/png;base64,${base64Image}`;

        // Deduct one credit from user's balance
        const updatedUser = await userModel.findByIdAndUpdate(
            user._id,
            { $inc: { creditBalance: -1 } },
            { new: true }
        );

        res.json({
            success: true,
            message: "Image Generated",
            creditBalance: updatedUser.creditBalance,
            resultImage,
        });
    } catch (error) {
        console.error("❌ Error generating image:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while generating image",
        });
    }
};

export default generateImage;

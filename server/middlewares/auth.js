import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({ success: false, message: "Invalid token. Login Again" });
        }

        req.user = { id: decoded.id }; 
        console.log("✅ User Authenticated:", req.user); // Debugging

        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        return res.status(401).json({ success: false, message: "Token verification failed" });
    }
};

export default userAuth;

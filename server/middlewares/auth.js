import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
        }
// its rendering//
        const token = authHeader.split(" ")[1];
        console.log("🔐 Token Received:", token);

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: "Token verification failed" });
            }

            req.user = { id: decoded.id }; // Attach decoded user info to request
            console.log("✅ User Authenticated:", req.user);
            next();
        });
    } catch (error) {
        console.error("❌ Error verifying token:", error.message);
        return res.status(401).json({ success: false, message: "Token verification failed" });
    }
};

export default userAuth;

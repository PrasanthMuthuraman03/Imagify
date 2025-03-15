import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [credit, setCredit] = useState(false);

    // Ensure backend URL is set properly
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const navigate = useNavigate();

    // 🔹 Load user credits
    const loadCreditData = async () => {
        try {
            if (!token) {
                console.error("No token found, user not authenticated.");
                toast.error("User not authenticated.");
                return;
            }
    
            console.log("Fetching credits with token:", token);
    
            const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("API Response:", data);
    
            if (data.success && data.user) {
                setUser(data.user);
                setCredit(data.credits);
            } else {
                console.error("Failed to fetch user data.");
                toast.error(data.message || "Failed to load credits.");
            }
        } catch (error) {
            console.error("Error loading credits:", error.response?.data || error.message);
            toast.error("Something went wrong. Please try again.");
        }
    };
    

    // 🔹 Generate Image Function (Fixed)
    const generateImage = async (prompt) => {
        try {
            if (!token) {
                toast.error("User not authenticated. Please login again.");
                return;
            }

            if (!user?._id) {
                toast.error("User ID is missing. Try logging in again.");
                return;
            }

            const { data } = await axios.post(
                `${backendUrl}/api/image/generate-image`,  // ✅ Fixed URL formatting
                { prompt, userId: user._id },  // ✅ Added userId
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,  // ✅ Fixed string formatting
                        "Content-Type": "application/json",  // ✅ Added Content-Type
                    },
                }
            );

            if (data.success) {
                loadCreditData();
                return data.resultImage;
            } else {
                toast.error(data.message);
                loadCreditData();
                if (data.creditBalance === 0) navigate("/buy");
            }
        } catch (error) {
            console.error("Error generating image:", error.response?.data || error.message);
            toast.error("Something went wrong while generating the image.");
        }
    };

    // 🔹 Logout Function
    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
    };

    // 🔹 Run on first load
    useEffect(() => {
        console.log("Token from localStorage:", localStorage.getItem("token"));
        console.log("Current Token State:", token);
        console.log("Current User State:", user);
        if (token) loadCreditData();
    }, [token]);
    

    return (
        <AppContext.Provider value={{
            user,
            setUser,
            showLogin,
            setShowLogin,
            backendUrl,
            token,
            setToken,
            credit,
            setCredit,
            loadCreditData,
            logout,
            generateImage
        }}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;

import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [credit, setCredit] = useState(false);

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
            const errMsg = error.response?.data?.message || "Something went wrong.";
            console.error("Error loading credits:", errMsg);
            toast.error(errMsg);
        }
    };

    // 🔹 Generate Image Function
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
                `${backendUrl}/api/image/generate-image`,
                { prompt, userId: user._id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (data.success) {
                loadCreditData();
                return data.resultImage;
            } else {
                toast.error(data.message || "Image generation failed.");
                loadCreditData();
                if (data.creditBalance === 0) navigate("/buy");
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || "Something went wrong while generating the image.";
            console.error("Error generating image:", errMsg);
            toast.error(errMsg);
        }
    };

    // 🔹 Logout Function
    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        toast.info("Logged out successfully.");
    };

    // 🔹 Load token and credit on initial mount
    useEffect(() => {
        const localToken = localStorage.getItem("token");
        if (localToken && !token) {
            setToken(localToken); // triggers the useEffect below
        }
    }, []);

    // 🔹 Load credit when token changes
    useEffect(() => {
        if (token) {
            loadCreditData();
        }
    }, [token]);

    return (
        <AppContext.Provider
            value={{
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
                generateImage,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;

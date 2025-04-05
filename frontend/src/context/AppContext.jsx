import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Cookies from 'js-cookie';

export const AppContent = createContext();

export const AppContextProvider = ({ children }) => {  
    axios.defaults.withCredentials = true;
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(undefined);
    const [loading, setLoading] = useState(true); // 🔥 Add loading state

    useEffect(() => {
        if (isLoggedin) {
            getUserData();  // Only fetch user data when user is logged in
        }
        checkAuthWithServer();
    }, [isLoggedin]);

    const checkAuthWithServer = async () => {
        setLoading(true);  // 🔥 Start loading
        try {
            const response = await axios.post(backendUrl + '/api/auth/is-auth');
            if (response.data.success) {
                setIsLoggedin(true);
                const userResponse = await getUserData();
                setUserData(userResponse);
            } else {
                setIsLoggedin(false);
                setUserData(undefined);
                toast.warn('Login to access all features!', { autoClose: 1000 });
            }
        } catch (error) {
            console.error("Auth check error:", error);
            setIsLoggedin(false);
            setUserData(undefined);
            toast.warn('Login to access all features!', { autoClose: 1000 });
        }
        setLoading(false);  // 🔥 Done loading
    };

    const getUserData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/user/get-data');
            if (response.data.success) {
                setUserData(response.data.userData);
            }else {
                toast.error(response.data.message);
            }
            return response.data.success ? response.data.userData : null;
        } catch (error) {
            console.error("Get user data error:", error);
            return null;
        }
    };

    const value = {
        backendUrl,
        setIsLoggedin,
        isLoggedin,
        setUserData,
        userData,
        getUserData,
        loading, // 🔥 Expose loading state
    };

    return (
        <AppContent.Provider value={value}>
            {!loading && children}  {/* 🔥 Prevent rendering until loading completes */}
        </AppContent.Provider>
    );
};

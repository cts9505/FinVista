import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, User, Wallet, PiggyBank, Receipt, Crown, 
  Menu, Home, ReceiptIndianRupeeIcon, ReceiptText,
  Settings, LogOut, ChevronUp,MessagesSquare
} from "lucide-react";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import axios from 'axios';
import { toast } from "react-toastify";

const Sidebar = ({ onToggle }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const navigate = useNavigate()
  const{userData,backendUrl,setUserData,setIsLoggedin} =useContext(AppContent);
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Extract active section from the path
    const currentPath = location.pathname;
    const activeItem = sidebarItems.find((item) => item.path === currentPath);
    if (activeItem) {
      setActiveSection(activeItem.label);
    }
  }, [location.pathname]); // Runs every time the URL changes

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsExpanded(!isExpanded);
    onToggle(!isCollapsed); // Pass state to parent
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
        setIsCollapsed(true);
        onToggle(true); // Explicitly tell parent component sidebar is collapsed
      } else {
        setIsExpanded(true);
        setIsCollapsed(false);
        onToggle(false); // Tell parent sidebar is expanded
      }
    };
    handleResize(); // Run on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onToggle]);

  const HomeNavigate = () => {
    navigate('/');
  }
  const sidebarItems = [
    { icon: <Home size={24} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={24} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Wallet size={24} />, label: "Incomes", path: "/incomes" },
    { icon: <ReceiptIndianRupeeIcon size={24} />, label: "Expenses", path: "/expenses" },
    { icon: <PiggyBank size={24} />, label: "Budgets", path: "/budgets" },
    { icon: <ReceiptText size={24} />, label: "Bills", path: "/bills" },
    { icon: <Crown size={24} />, label: "Upgrade", path: "/upgrade" },
    // Add more items to test scrolling
    { icon: <Receipt size={24} />, label: "Reports", path: "/reports" },
    { icon: <MessagesSquare size={24} />, label: "AI Assistant", path: "/chat" },
    { icon: <User size={24} />, label: "Accounts", path: "/profile" },
  ];

  const handleNavigation = (label, path) => {
    setActiveSection(label); // Update active section
    navigate(path); // Navigate to the selected section
  };

  const handleProfileAction = (action) => {
    setIsProfileMenuOpen(false);
    if (action === "profile") {
      navigate("/profile");
    } else if (action === "logout") {
      // Handle logout logic here
      // console.log("Logging out...");
      logout();
      navigate("/");
    }
  };
  const logout = async()=>{
    try{
      axios.defaults.withCredentials=true;
      const{data} = await axios.post(backendUrl+'/api/auth/logout');
      data.success && setIsLoggedin(false);
      data.success && setUserData(false);
      localStorage.removeItem('user-info');
      toast.success(data.message)
      navigate('/')
    }
    catch(error){
      toast.error(error.message);
    }
  }

  return (
    <motion.div 
      initial={{ x: -250 }} 
      animate={{ x: 0 }} 
      className={`fixed top-1 left-0 h-screen bg-white shadow-lg flex flex-col transition-all duration-50 z-50 ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        {isExpanded && <h4 className="text-lg font-semibold text-gray-700" ><img onClick={HomeNavigate} className="h-12" src={assets.logo} alt="Finance Management" /></h4>}
        <button 
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={toggleSidebar} 
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Navigation Links - Now in a scrollable container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <nav className="p-3 space-y-2">
          {sidebarItems.map((item, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeSection === item.label 
                  ? "bg-blue-50 text-blue-600" 
                  : "hover:bg-gray-50 text-gray-600"
              }`}
              onClick={() => {
                  setActiveSection(item.label);
                  handleNavigation(item.label, item.path);
                }}>
              <span className="mr-0 sm:mr-3">{item.icon}</span>
              <span className={`font-medium ${!isExpanded ? "hidden" : "block"}`}>{item.label}</span>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Profile Section - Fixed at bottom */}
      <div className="p-4 border-t border-gray-100 bg-white" ref={profileMenuRef}>
        <div 
          className="flex items-center p-3 rounded-xl bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          {userData?.image ? (
            <img 
              src={userData.image} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <User size={40} className="text-gray-300 bg-gray-800 p-2 rounded-xl" />
          )}

          {isExpanded && (
            <div className="ml-3 flex-1">
              <p className="font-medium text-sm">{userData ? userData.name : 'Developer'}</p>
              <p className="text-xs text-gray-500">{userData?.isPremium ? "Premium Account" : userData.isAccountVerified?"Verifed Account" : "UnVerified Account"}</p>
            </div>
          )}
          
          {isExpanded && <ChevronUp size={16} className={`transition-transform ${isProfileMenuOpen ? "" : "transform rotate-180"}`} />}
        </div>
        
        {/* Profile dropdown menu */}
        <AnimatePresence>
          {isProfileMenuOpen && isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div 
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleProfileAction("profile")}
              >
                <Settings size={18} className="text-gray-600" />
                <span className="ml-3 text-gray-700 text-sm">Profile Settings</span>
              </div>
              <div 
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
                onClick={() => handleProfileAction("logout")}
              >
                <LogOut size={18} className="text-gray-600" />
                <span className="ml-3 text-gray-700 text-sm">Log Out</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;
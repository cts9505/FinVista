import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContent } from "../context/AppContext";
import { googleAuth } from "../context/api.js";

const Login = () => {
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentChart, setCurrentChart] = useState("portfolio"); // Default chart
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  
  // Sample data for charts
  const barChartData = [
    { month: 'Jan', savings: 2400, expenses: 1800 },
    { month: 'Feb', savings: 1800, expenses: 2400 },
    { month: 'Mar', savings: 3200, expenses: 1900 },
    { month: 'Apr', savings: 2780, expenses: 2100 },
    { month: 'May', savings: 1890, expenses: 2300 },
    { month: 'Jun', savings: 2390, expenses: 2500 }
  ];
  
  const pieChartData = [
    { name: 'Housing', value: 35 },
    { name: 'Food', value: 20 },
    { name: 'Transport', value: 15 },
    { name: 'Entertainment', value: 10 },
    { name: 'Savings', value: 20 }
  ];
  
  const lineChartData = Array.from({ length: 12 }, (_, i) => ({
    month: i+1,
    value: 2000 + Math.random() * 5000
  }));
  
  const billsData = [
    { name: 'Rent', amount: 1200, dueDate: '25th', status: 'Upcoming' },
    { name: 'Electricity', amount: 850, dueDate: '15th', status: 'Paid' },
    { name: 'Internet', amount: 600, dueDate: '20th', status: 'Upcoming' },
    { name: 'Water', amount: 400, dueDate: '10th', status: 'Overdue' },
  ];
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  useEffect(() => {
    // Set up auto-scrolling for charts every 2 seconds
    const autoScrollInterval = setInterval(() => {
      const charts = ['portfolio', 'income', 'budget', 'bills'];
      const currentIndex = charts.indexOf(currentChart);
      const nextIndex = (currentIndex + 1) % charts.length;
      setCurrentChart(charts[nextIndex]);
    }, 2000);
    
    // Clean up interval when component unmounts or when chart changes manually
    return () => clearInterval(autoScrollInterval);
  }, [currentChart]); // Re-create interval when currentChart changes

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state to true

    axios.defaults.withCredentials = true;

    try {
        let reclocation = { latitude: null, longitude: null };

        // Attempt to get the user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    reclocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    sendLoginRequest(reclocation);
                },
                (error) => {
                    console.warn("Geolocation denied or unavailable:", error);
                    sendLoginRequest(reclocation); // Proceed without location
                }
            );
        } else {
            sendLoginRequest(location); // No geolocation support
        }
    } catch (err) {
        toast.error("Error retrieving location");
        setIsLoading(false);
    }
};

// Function to send login/signup request
const sendLoginRequest = async (reclocation) => {
    try {
        let response;

        if (state === "Sign Up") {
            if (password !== confirmPassword) {
                toast.error("Passwords don't match");
                setIsLoading(false);
                return;
            }
            response = await axios.post(`${backendUrl}/api/auth/register`, { name, email, password, reclocation });
            if (response.data.success) {
              setState('Sign In');
              toast.success(response.data.message);
          } else {
              toast.error(response.data.message || "Something went wrong.");
          }
        } else {
            response = await axios.post(`${backendUrl}/api/auth/login`, { email, password, reclocation });
        
            if (response.data.success) {
              setIsLoggedin(true);
              const userData = await getUserData();
  
              const obj = { email, name };
              localStorage.setItem("user-info", JSON.stringify(obj));
  
              toast.success(response.data.message);
              navigate(userData.isOnboardingComplete ? "/dashboard" : "/onboarding");
          } else {
              toast.error(response.data.message || "Something went wrong.");
          }

          }
    } catch (err) {
        toast.error(err.response?.data?.message || "An error occurred");
    } finally {
        setIsLoading(false); // Reset loading state in all cases
    }
};

  // Card flip animation variants
  const cardVariants = {
    hidden: { rotateY: 90, opacity: 0 },
    visible: { rotateY: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { rotateY: -90, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
  };

  // Input field animation variants
  const inputVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: i => ({ 
      y: 0, 
      opacity: 1, 
      transition: { 
        delay: i * 0.1,
        duration: 0.3
      } 
    })
  };

  // Function to toggle login/signup with animation delay
  const toggleState = (newState) => {
    if (isFlipping) return; // Prevents spam clicks
    setIsFlipping(true);
    setTimeout(() => {
      setState(newState);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsFlipping(false);
    }, 150);
  };
  
  const responseGoogle = async (authResult) => {
    axios.defaults.withCredentials = true;
    
    try {
      setIsLoading(true); // Set loading state to true when authenticating with Google
      if (authResult["code"]) {
        const result = await googleAuth(authResult.code);
        
        setIsLoggedin(true);
        const userData = await getUserData();
        const {email, name, image} = result.data.user;
        const token = result.data.token;
        const obj = {email, name, token, image};
        localStorage.setItem('user-info', JSON.stringify(obj));

        toast.success(result.data.message);
        if (userData.isOnboardingComplete) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } else {
        throw new Error(authResult);
      }
    } catch (e) {
      toast.error("Google login failed");
      console.log('Error while Google Login...', e.message);
      setIsLoading(false); // Reset loading state
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  
  // Function to change chart type
  const changeChart = (chartType) => {
    setCurrentChart(chartType);
  };

  // Simple SVG Line Chart Component
  const SimpleLineChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
    const minValue = Math.min(...data.map(d => d.value)) * 0.9;
    const width = 320;
    const height = 200;
    const padding = 30;
    
    const xScale = (i) => padding + (i / (data.length - 1)) * (width - padding * 2);
    const yScale = (v) => height - padding - ((v - minValue) / (maxValue - minValue)) * (height - padding * 2);
    
    const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* X and Y axes */}
        <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#ccc" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#ccc" strokeWidth="1" />
        
        {/* Line path */}
        <polyline 
          fill="none"
          stroke="#5b9bd5"
          strokeWidth="2"
          points={points}
        />
        
        {/* Area under the curve */}
        <polyline 
          fill="rgba(91, 155, 213, 0.2)"
          stroke="none"
          points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`}
        />
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle 
            key={i}
            cx={xScale(i)} 
            cy={yScale(d.value)} 
            r="4"
            fill="#fff"
            stroke="#5b9bd5"
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  };
  
  // Simple SVG Bar Chart Component
  const SimpleBarChart = ({ data }) => {
    const width = 320;
    const height = 200;
    const padding = 30;
    const barWidth = (width - padding * 2) / data.length / 2.5;
    
    const maxValue = Math.max(...data.map(d => Math.max(d.savings, d.expenses)));
    const yScale = (value) => ((height - padding * 2) * value) / maxValue;
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* X axis */}
        <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#ccc" strokeWidth="1" />
        
        {/* Bars */}
        {data.map((d, i) => {
          const x = padding + i * ((width - padding * 2) / data.length);
          return (
            <g key={i}>
              {/* Savings bar */}
              <rect
                x={x}
                y={height - padding - yScale(d.savings)}
                width={barWidth}
                height={yScale(d.savings)}
                fill="#5b9bd5"
              />
              
              {/* Expenses bar */}
              <rect
                x={x + barWidth + 2}
                y={height - padding - yScale(d.expenses)}
                width={barWidth}
                height={yScale(d.expenses)}
                fill="#ed7d31"
              />
              
              {/* Month label */}
              <text
                x={x + barWidth + 1}
                y={height - padding + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#555"
              >
                {d.month}
              </text>
            </g>
          );
        })}
        
        {/* Legend */}
        <rect x={width - 100} y={20} width={10} height={10} fill="#5b9bd5" />
        <text x={width - 85} y={30} fontSize="10" fill="#555">Savings</text>
        <rect x={width - 100} y={40} width={10} height={10} fill="#ed7d31" />
        <text x={width - 85} y={50} fontSize="10" fill="#555">Expenses</text>
      </svg>
    );
  };
  
  // Simple SVG Pie Chart Component
  const SimplePieChart = ({ data }) => {
    const width = 200;
    const height = 200;
    const radius = 80;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate the total value
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Colors for pie segments
    const colors = ['#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#70ad47'];
    
    // Calculate pie segments
    let startAngle = 0;
    const segments = data.map((item, index) => {
      const angle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      
      // Calculate arc path
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      // Determine if the arc should be drawn as a large arc
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      // Create SVG path
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      // Store the middle angle for label positioning
      const midAngle = startAngle + angle / 2;
      const labelX = centerX + (radius * 0.7) * Math.cos(midAngle);
      const labelY = centerY + (radius * 0.7) * Math.sin(midAngle);
      
      // Update start angle for next segment
      const segment = {
        path,
        color: colors[index % colors.length],
        labelX,
        labelY,
        name: item.name,
        value: item.value
      };
      
      startAngle = endAngle;
      return segment;
    });
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Draw pie segments */}
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            stroke="#fff"
            strokeWidth="1"
          />
        ))}
        
        {/* Draw center circle for donut effect */}
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#fff" />
        
        {/* Legend */}
        <text x={centerX} y={centerY} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
          Budget
        </text>
        <text x={centerX} y={centerY + 15} textAnchor="middle" fontSize="10" fill="#777">
          Distribution
        </text>
      </svg>
    );
  };
  
  // Bills Table Component
  const BillsTable = ({ data }) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Bill</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Due Date</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((bill, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">{bill.name}</td>
                <td className="px-4 py-3 text-right">${bill.amount}</td>
                <td className="px-4 py-3 text-center">{bill.dueDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    bill.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                    bill.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {bill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
      <span className="ml-2">Logging in...</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {/* Background elements */}
      <div className="absolute top-20 -right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-40 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Home button */}
      
      {/* Main container with glass effect */}
      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col md:flex-row rounded-2xl shadow-2xl bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-2 mx-auto overflow-hidden">
        {/* Back button with arrow */}
          <div className="absolute top-6 left-5 z-10">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-md hover:bg-gray-100 transition duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              <span className="text-blue-600 font-medium">Back</span>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>  
            </button>
          </div>
        {/* Left side - Finance visualizations */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center items-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-900">Financial Freedom Starts Here</h2>
            <p className="text-indigo-700 mt-2">Track, manage, and grow your wealth</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut"  }}
            className="w-full flex flex-col gap-4"
          >
            {/* Chart Navigation */}
            <div className="flex justify-center mb-2 space-x-2">
              <button 
                onClick={() => changeChart('portfolio')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  currentChart === 'portfolio' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => changeChart('income')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  currentChart === 'income' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Income
              </button>
              <button 
                onClick={() => changeChart('budget')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  currentChart === 'budget' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Budget
              </button>
              <button 
                onClick={() => changeChart('bills')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  currentChart === 'bills' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Bills
              </button>
            </div>
            
            {/* Dynamic Chart Content */}
            <AnimatePresence mode="wait">
            <motion.div 
            key={currentChart}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="bg-white p-4 rounded-xl shadow-md"
          >
              {currentChart === 'portfolio' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Portfolio Growth</h3>
                  <SimpleLineChart data={lineChartData} />
                </>
              )}
              
              {currentChart === 'income' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Income vs Expenses</h3>
                  <SimpleBarChart data={barChartData} />
                </>
              )}
              
              {currentChart === 'budget' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Budget Allocation</h3>
                  <div className="flex justify-center">
                    <SimplePieChart data={pieChartData} />
                  </div>
                </>
              )}
              
              {currentChart === 'bills' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Upcoming Bills</h3>
                  <BillsTable data={billsData} />
                </>
              )}
            </motion.div>
            </AnimatePresence>
          </motion.div>
          
          {/* Chart navigation arrows */}
          <div className="flex justify-center mt-4 space-x-4">
            <button 
              onClick={() => {
                const charts = ['portfolio', 'income', 'budget', 'bills'];
                const currentIndex = charts.indexOf(currentChart);
                const prevIndex = (currentIndex - 1 + charts.length) % charts.length;
                setCurrentChart(charts[prevIndex]);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button 
              onClick={() => {
                const charts = ['portfolio', 'income', 'budget', 'bills'];
                const currentIndex = charts.indexOf(currentChart);
                const nextIndex = (currentIndex + 1) % charts.length;
                setCurrentChart(charts[nextIndex]);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Right side - Login/Signup form */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center items-center">
          <motion.div
            key={state}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-900 mb-2">
              {state === "Sign Up" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-center text-gray-500 mb-6">
              {state === "Sign Up" 
                ? "Join thousands of users managing their finances smarter" 
                : "Access your financial dashboard"
              }
            </p>
            
            <form onSubmit={onSubmitHandler} className="space-y-4">
              {state === "Sign Up" && (
                <motion.div
                  custom={0}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    type="text"
                    placeholder="Full Name"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
              )}
              
              <motion.div
                custom={state === "Sign Up" ? 1 : 0}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  placeholder="Email Address"
                  required
                  disabled={isLoading}
                />
              </motion.div>
              
              <motion.div
                custom={state === "Sign Up" ? 2 : 1}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-12 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </motion.div>
              
              {state === "Sign Up" && (
                <motion.div
                  custom={3}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    type="password"
                    placeholder="Confirm Password"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
              )}
              
              <motion.div
                custom={state === "Sign Up" ? 4 : 2}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    state === "Sign Up" ? "Create Account" : "Sign In"
                  )}
                </button>
              </motion.div>
            </form>
            
            <div className="my-4 flex items-center justify-between">
              <hr className="w-full border-gray-300" />
              <span className="px-2 text-gray-500 text-sm">OR</span>
              <hr className="w-full border-gray-300" />
            </div>
            
            <button
              onClick={googleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {state === "Sign Up" ? "Already have an account?" : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => toggleState(state === "Sign Up" ? "Sign In" : "Sign Up")}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                  disabled={isFlipping || isLoading}
                >
                  {state === "Sign Up" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContent } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import { GlobalContext } from "../context/GlobalContext";
// Lucide icons can be imported directly for a production app
// Here I'm using a simplified version for demonstration
const Icons = {
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  Warning: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Crown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M4 22h16" />
    </svg>
  ),
};

const TypeWriter = ({ text }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15); // Speed of typing effect

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="whitespace-pre-wrap">
      {displayText}
      {currentIndex < text.length && (
        <span className="inline-block w-2 h-4 bg-current animate-blink"></span>
      )}
    </div>
  );
};

const ChatPage = () => {
      const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userData } = useContext(AppContent); // Get user info from auth context
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatLimits, setChatLimits] = useState({
    hourlyCount: 0,
    hourlyLimit: 2,
    dailyCount: 0,
    dailyLimit: 5
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const chatContainerRef = useRef(null);
  const BASE_URL = import.meta.env?.VITE_BACKEND_URL;
  const{checkPremiumStatus}=useContext(GlobalContext);
  // Define message length limits - 500 characters per message
  const MESSAGE_CHAR_LIMIT = 500;

  useEffect(() => {
    fetchSuggestions();
    fetchChatLimits();
    // Add initial greeting on first load
    addInitialGreeting();
    checkPremiumStatus();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addInitialGreeting = () => {
    const greeting = `Hello ${userData?.name || "there"}! I'm your personal financial assistant. I'm here to help you with your financial data and provide personalized responses based on your specific financial situation. Ask me anything about your income, expenses, budget, or financial goals!`;
    
    setMessages([{ content: greeting, role: "assistant", typing: true }]);
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/userchat/suggestions`);
      
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      // Fallback suggestions
      setSuggestions([
        "How can I improve my budget?",
        "What's the best way to save for retirement?",
        "How can I reduce my monthly expenses?",
        "Should I invest in stocks or bonds?"
      ]);
    }
  };

  const fetchChatLimits = async () => {
    try {
      // In a real app, you'd fetch this from your server
      // For now, using mock data
      setChatLimits({
        hourlyCount: localStorage.getItem("hourlyCount") || 0,
        hourlyLimit: 2,
        dailyCount: localStorage.getItem("dailyCount") || 0,
        dailyLimit: 5
      });
    } catch (error) {
      console.error("Error fetching chat limits:", error);
    }
  };

  const updateChatCounts = () => {
    // Update hourly count
    const newHourlyCount = parseInt(chatLimits.hourlyCount) + 1;
    localStorage.setItem("hourlyCount", newHourlyCount);
    
    // Update daily count
    const newDailyCount = parseInt(chatLimits.dailyCount) + 1;
    localStorage.setItem("dailyCount", newDailyCount);
    
    setChatLimits({
      ...chatLimits,
      hourlyCount: newHourlyCount,
      dailyCount: newDailyCount
    });
    
    // Reset hourly count after an hour
    setTimeout(() => {
      localStorage.setItem("hourlyCount", Math.max(0, newHourlyCount - 1));
      setChatLimits(prev => ({
        ...prev,
        hourlyCount: Math.max(0, prev.hourlyCount - 1)
      }));
    }, 60 * 60 * 1000); // 1 hour
  };

  const checkChatLimits = () => {
    if (chatLimits.hourlyCount >= chatLimits.hourlyLimit) {
      toast.error("You've reached your hourly chat limit. Please try again later.");
      return false;
    }
    
    if (chatLimits.dailyCount >= chatLimits.dailyLimit) {
      toast.error("You've reached your daily chat limit. Please try again tomorrow.");
      return false;
    }
    
    return true;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Check message length
    if (inputMessage.length > MESSAGE_CHAR_LIMIT) {
      toast.error(`Your message exceeds the ${MESSAGE_CHAR_LIMIT} character limit.`);
      return;
    }
    
    // Check if the user is premium
    if (!userData?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // Check if the user has exceeded chat limits
    if (!checkChatLimits()) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { content: userMessage, role: "user" }]);
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${BASE_URL}/api/userchat/chat`,
        { message: userMessage },
      );
      
      if (response.data.success) {
        setMessages(prev => [...prev, { 
          content: response.data.message, 
          role: "assistant",
          typing: true
        }]);
        updateChatCounts();
      } else {
        toast.error("Failed to get response from AI");
        setMessages(prev => [...prev, { 
          content: "I'm sorry, I couldn't process your request. Please try again.", 
          role: "assistant",
          typing: true
        }]);
      }
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error communicating with AI assistant");
      setMessages(prev => [...prev, { 
        content: "I'm sorry, there was an error processing your request. Please try again later.", 
        role: "assistant",
        typing: true
      }]);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    // Focus the input field
    document.getElementById("chat-input").focus();
  };

  const closeModal = () => {
    setShowPremiumModal(false);
  };

  const redirectToPremium = () => {
    // Redirect to premium signup page
    window.location.href = "/upgrade";
  };

  return (
    <>
        <Sidebar onToggle={setIsSidebarCollapsed} />
        <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icons.Bot />
              </div>
              <div>
                <h1 className="text-xl font-bold">Your Personal Financial Advisor</h1>
                <p className="text-sm text-blue-100">Ask me anything about your finances</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="bg-white/10 rounded px-3 py-1 mb-1 flex items-center justify-end">
                <span className={userData?.isPremium ? "text-green-300" : "text-yellow-300"}>
                  {userData?.isPremium ? "Premium User" : "Free User"}
                </span>
                {userData?.isPremium && <Icons.Crown className="h-4 w-4 ml-1 text-yellow-300" />}
              </div>
              <div className="bg-white/10 rounded px-3 py-1">
                <span className={chatLimits.hourlyCount >= chatLimits.hourlyLimit ? "text-red-300" : "text-blue-100"}>
                  {chatLimits.hourlyCount}/{chatLimits.hourlyLimit} chats this hour
                </span>
              </div>
              <div className="bg-white/10 rounded px-3 py-1 mt-1">
                <span className={chatLimits.dailyCount >= chatLimits.dailyLimit ? "text-red-300" : "text-blue-100"}>
                  {chatLimits.dailyCount}/{chatLimits.dailyLimit} chats today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-grow overflow-hidden">
          <div 
            ref={chatContainerRef}
            className="p-4 space-y-4 overflow-y-auto h-full"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] md:max-w-[70%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === "assistant" && (
                      <div className="p-1 bg-white rounded-full mr-2">
                        <Icons.Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <span className="font-medium">
                      {message.role === "user" ? (userData?.name || "You") : "AI Assistant"}
                    </span>
                    {message.role === "user" && (
                      <div className="p-1 bg-blue-500 rounded-full ml-2">
                        <Icons.User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  {message.typing && message.role === "assistant" ? (
                    <TypeWriter text={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] md:max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-white rounded-full">
                      <Icons.Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">AI Assistant</span>
                    <div className="flex space-x-1 ml-2">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {messages.length === 0 && !isLoading && (
              <div className="space-y-6 h-full flex flex-col justify-between">
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-800 p-4 rounded-lg inline-flex items-center mb-4">
                    <Icons.Sparkles />
                    <span className="ml-2">Welcome to your Financial Advisor!</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Try asking:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center justify-between text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <span className="text-gray-800">{suggestion}</span>
                        <Icons.ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Limit Warning */}
        {(chatLimits.hourlyCount >= chatLimits.hourlyLimit || chatLimits.dailyCount >= chatLimits.dailyLimit) && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-2">
            <div className="flex items-center text-yellow-800 text-sm">
              <Icons.Warning className="h-4 w-4 mr-2" />
              <span>
                {chatLimits.hourlyCount >= chatLimits.hourlyLimit 
                  ? "You've reached your hourly chat limit. Please try again later." 
                  : "You've reached your daily chat limit. Please try again tomorrow."}
              </span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4 bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex flex-col w-full space-y-2">
            <div className="flex w-full space-x-2">
              <input
                id="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about your finances..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || chatLimits.hourlyCount >= chatLimits.hourlyLimit || chatLimits.dailyCount >= chatLimits.dailyLimit}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || chatLimits.hourlyCount >= chatLimits.hourlyLimit || chatLimits.dailyCount >= chatLimits.dailyLimit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Icons.Loader className="h-5 w-5" />
                ) : (
                  <Icons.Send className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Character counter */}
            <div className="text-xs text-right">
              <span className={inputMessage.length > MESSAGE_CHAR_LIMIT ? "text-red-600" : "text-gray-500"}>
                {inputMessage.length}/{MESSAGE_CHAR_LIMIT} characters
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Premium Upsell Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-yellow-100 text-yellow-600 rounded-full mb-4">
                <Icons.Crown className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Premium Feature</h3>
              <p className="text-gray-600 mt-2">
                This AI assistant is available exclusively for premium users. Upgrade now to unlock unlimited AI chat assistance for your financial journey!
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={redirectToPremium}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={closeModal}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
    </div>
    </>
  );
};

export default ChatPage;
import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Sparkles, Brain, Activity, PieChart, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
const BASE_URL = import.meta.env.VITE_BACKEND_URL;
import { useGlobalContext } from '../context/GlobalContext';
import { toast } from 'react-toastify';

const UpgradePage = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    subscriptionType: 'none',
    trialEndDate: null,
    subscriptionEndDate: null,
    daysRemaining: 0
  });
  
  const { 
    isPremium,
    subscriptionData,
    checkPremiumStatus,
    addExpense
  } = useGlobalContext();

  useEffect(() => {
    fetchPremiumStatus();
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Clean up script when component unmounts
      document.body.removeChild(script);
    };
  }, []);
  
  const fetchPremiumStatus = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/check-premium-status`);
      if (response.data.success) {
        // Make sure we're properly interpreting the response
        const data = {
          ...response.data,
          // Ensure we have proper subscription type
          subscriptionType: response.data.subscriptionType || 'none'
        };
        setPremiumStatus(data);
        
        // Also update the global context if needed
        if (checkPremiumStatus) {
          checkPremiumStatus();
        }
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    }
  };

  const startFreeTrial = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${BASE_URL}/api/auth/start-free-trial`);
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchPremiumStatus(); // Refresh premium status after successful operation
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      
      // Get order details from backend
      const orderResponse = await axios.post(`${BASE_URL}/api/auth/create-order`, {
        plan: billingPeriod
      });
      
      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.message || 'Failed to create payment order');
        setIsLoading(false);
        return;
      }
      
      const { orderId, amount, currency } = orderResponse.data;
      
      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay Key ID from environment variables
        amount: amount, // Amount in smallest currency unit (paise for INR)
        currency: currency || 'INR',
        name: 'AI Finance Pro',
        description: `${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)} Subscription`,
        order_id: orderId,
        handler: async function(response) {
          try {
            // Verify payment with backend
            const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: billingPeriod
            });
            
            if (verifyResponse.data.success) {
              toast.success('Payment successful! Your subscription has been activated.');
              
              // Create expense record for the subscription purchase
              const amountValue = billingPeriod === 'monthly' ? 1 : 10;
              const expenseData = {
                title: `AI Finance Pro`,
                amount: amountValue,
                category: 'Subscription',
                description: `Premium ${billingPeriod} plan`,
                date: new Date().toISOString(),
                type: 'expense'
              };
              
              // Add expense to the system
              await addExpense(expenseData);
              
              // Refresh premium status after successful operation
              await fetchPremiumStatus();
            } else {
              toast.error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed: ' + (error.response?.data?.message || error.message));
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        notes: {
          plan: billingPeriod
        },
        theme: {
          color: '#2563EB' // Blue color that matches your UI
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };
      
      // Initialize Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const initiateCancel = () => {
    setShowCancelConfirm(true);
  };
  
  const confirmCancellation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${BASE_URL}/api/auth/cancel-subscription`);
      if (response.data.success) {
        toast.success(response.data.message || 'Subscription canceled successfully');
        setShowCancelConfirm(false);
        await fetchPremiumStatus(); // Refresh premium status after successful operation
      } else {
        toast.error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred while canceling subscription');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Updated logic to determine user subscription status
  // Check if user has any paid subscription (monthly or annually)
  const isPremiumUser = premiumStatus.subscriptionType === 'premium' || 
                         premiumStatus.subscriptionType === 'monthly' || 
                         premiumStatus.subscriptionType === 'annually';
  const isTrialUser = premiumStatus.subscriptionType === 'trial';
  const isBasicUser = premiumStatus.subscriptionType === 'none' || !premiumStatus.subscriptionType;
 
  return (
    <>
    <Sidebar onToggle={setIsSidebarCollapsed} />
    {message && (
        <div className="fixed top-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md">
          {message}
        </div>
    )}
    <div   className={`
      flex-1 mt-10
      overflow-y-auto 
      transition-all 
      duration-300 
      ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}
      max-w-full
    `}>
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-3">Upgrade Your Financial Experience</h1>
        <p className="text-gray-600 md:text-lg">Get advanced tools and AI insights to manage your money smarter</p>
      </div>
      
      {/* Billing Toggle - Only show if not premium user */}
      {!isPremiumUser ? (
        <div className="flex justify-center mb-9">
          <div className="bg-white rounded-full p-1 shadow-md inline-flex">
            <button 
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${billingPeriod === 'monthly' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`px-6 py-2 rounded-full text-sm font-medium transition flex items-center ${billingPeriod === 'annually' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              onClick={() => setBillingPeriod('annually')}
            >
              Annual <span className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">-15% Off</span>
            </button>
          </div>
        </div>
      ):
      <div className="flex justify-center mb-11">
          <div className="bg-white rounded-xl p-1 shadow-md inline-flex">
            <span 
              className={`px-6 py-2 rounded-xl text-sm font-small transition bg-blue-50 `}
        
            >
              Your current <span className='capitalize'>{premiumStatus.subscriptionType}</span> plan is expiring in <span className='font-medium'>{premiumStatus.daysRemaining}</span> days!
            </span>
            
          </div>
        </div>
      }
      
      {/* Plan Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-16 items-center ">
        {/* Basic Plan */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative max-h-fit  ">
          {isBasicUser && (
            <div className="absolute top-4 right-4 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              Current Plan
            </div>
          )}
          <div className="p-6 pb-0">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <Activity className="text-gray-700" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Basic</h2>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>
              <p className="text-gray-500 mt-2">Free forever</p>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <CheckCircle className="text-gray-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-700">Basic expense tracking</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-gray-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-700">Monthly reports</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-gray-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-700">Up to 50 transactions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-gray-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-700">Export data to Excel</span>
              </li>
            </ul>
            
            <button className="w-full bg-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-300 transition">
              {isBasicUser ? 'Current Plan' : 'Basic Plan'}
            </button>
          </div>
        </div>
        
        {/* Premium Plan */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden relative transform md:scale-105">
          {(isPremiumUser || isTrialUser) ? (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Current Plan
            </div>
          ) : (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Recommended
            </div>
          )}
          <div className="p-6 pb-0">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Brain className="text-blue-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-blue-700">AI Finance Pro</h2>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-blue-700">
                  ₹{billingPeriod === 'monthly' ? '1.00' : '0.83'}
                </span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>
              {(isPremiumUser || isTrialUser) ? (
                <p className="text-gray-500 mt-2">
                  {isTrialUser ? `Trial ends on: ${formatDate(premiumStatus.trialEndDate)}` : 
                    `Subscription ends on: ${formatDate(premiumStatus.subscriptionEndDate)}`}
                </p>
              ) : (
                <p className="text-gray-500 mt-2">
                  {billingPeriod === 'monthly' ? 'Billed monthly' : 'Billed annually (₹10/year)'}
                  {billingPeriod === 'annually' && <span className="ml-2 text-green-600 font-medium">Save 15%</span>}
                </p>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-blue-50">
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <CheckCircle className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800">Everything in Basic, plus:</span>
              </li>
              <li className="flex items-start">
                <Sparkles className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800"><strong>AI-powered financial insights</strong></span>
              </li>
              <li className="flex items-start">
                <PieChart className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800">Comprehensive budget & expense management</span>
              </li>
              <li className="flex items-start">
                <Calendar className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800">Automated bill tracking & reminders</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800">Unlimited transactions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-800">Advanced custom reports</span>
              </li>
            </ul>
            
            <div className="space-y-3">
              {isPremiumUser ? (
                <>
                <div className="flex items-center justify-center gap-4">
                <button 
                  className="w-full bg-green-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center"
                >
                  Active Subscription
                </button>
                <button 
                    onClick={initiateCancel} 
                    className="w-full bg-transparent border border-red-600 text-red-600 font-medium py-3 rounded-lg hover:bg-blue-50 transition flex items-center justify-center"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                  </div>
                </>
              ) : isTrialUser ? (
                <button 
                  onClick={() => handleUpgrade()}
                  className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Upgrade Now'} <ArrowRight className="ml-2" size={18} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleUpgrade()}
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Pay with Razorpay'} <ArrowRight className="ml-2" size={18} />
                  </button>
                    
                  <button 
                    onClick={() => startFreeTrial()} 
                    className="w-full bg-transparent border border-blue-600 text-blue-600 font-medium py-3 rounded-lg hover:bg-blue-50 transition flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Start 7-Day Free Trial'} 
                  </button>
                  <p className="text-xs text-center text-gray-500">No credit card required</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-blue-700 mb-8 text-center">What You Get With AI Finance Pro</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalized AI Recommendations</h3>
            <p className="text-gray-600">Get tailored financial advice based on your spending patterns, income, and financial goals.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <PieChart className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Comprehensive Budget Tools</h3>
            <p className="text-gray-600">Create and manage budgets across multiple categories with visual analytics and tracking.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill Management System</h3>
            <p className="text-gray-600">Never miss a payment with automated bill tracking, reminders, and payment scheduling.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Activity className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Advanced Expense Analysis</h3>
            <p className="text-gray-600">Gain deeper insights into where your money goes with detailed categorization and trend analysis.</p>
          </div>
        </div>
      </div>
      
      {/* Testimonial/Social Proof */}
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-6 md:mb-0 md:mr-8">
            <div className="w-16 h-16 bg-blue-200 rounded-full mb-2 flex items-center justify-center mx-auto">
              <span className="text-blue-700 font-bold text-lg">SM</span>
            </div>
            <div className="text-center md:text-left">
              <p className="font-medium text-blue-700">Sophia M.</p>
              <p className="text-sm text-blue-600">Premium user since 2023</p>
            </div>
          </div>
          <div>
            <p className="text-blue-800 italic mb-3">"The AI insights have completely changed how I manage my finances. I've saved over ₹15,000 in the last 3 months just by following the personalized recommendations."</p>
            <div className="flex justify-center md:justify-start">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ/Questions */}
      <div className="max-w-3xl mx-auto mt-16 mb-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-8 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800">Can I switch back to the Basic plan?</h3>
            <p className="text-gray-600 mt-2">Yes, you can downgrade at any time. Your premium features will remain active until the end of your billing period.</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800">How does the AI recommendation system work?</h3>
            <p className="text-gray-600 mt-2">Our AI analyzes your spending patterns, income streams, and financial goals to provide personalized recommendations for improving your financial health.</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800">Is my financial data secure?</h3>
            <p className="text-gray-600 mt-2">Absolutely. We use bank-level encryption to protect your data and never share your personal information with third parties.</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800">What payment methods are accepted?</h3>
            <p className="text-gray-600 mt-2">We accept all major credit and debit cards, UPI, net banking, and wallets through our secure Razorpay payment gateway.</p>
          </div>
        </div>
      </div>
      
    {/* CTA */}
    <div className="max-w-4xl mx-auto text-center p-8 bg-blue-50 rounded-xl border border-blue-100">
    <h2 className="text-2xl font-bold text-blue-700 mb-4">Ready to Upgrade Your Financial Experience?</h2>
    <p className="text-gray-600 mb-6">Join thousands of users who are saving money and reaching their financial goals faster.</p>
    <button 
      onClick={() => handleUpgrade()}
      className="bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition"
      disabled={isLoading || isPremiumUser}
    >
        {isPremiumUser ? 'Already on Premium Plan' : 'Upgrade to AI Finance Pro Now'}
    </button>
    <p className="text-sm text-gray-500 mt-4">30-day money-back guarantee. No questions asked.</p>
    </div>
    </div>
    {/* Cancellation Confirmation Modal */}
  {showCancelConfirm && (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative border-2 border-red-200 shadow-xl">
        <div className="flex items-center mb-4 text-red-600">
          <AlertCircle className="mr-2" size={24} />
          <h2 className="text-xl font-bold">Cancel Subscription?</h2>
        </div>
        
        <div className="mb-6 space-y-4">
          <p className="text-gray-700">Are you sure you want to cancel your AI Finance Pro subscription?</p>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Subscription type:</span> <span className='capitalize' >{premiumStatus.subscriptionType}</span>
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Subscription ends on:</span> {formatDate(premiumStatus.subscriptionEndDate)}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Days remaining:</span> {premiumStatus.daysRemaining || 0} days
            </p>
            <p className="text-xs text-gray-500 italic">
              If eligible, refunds will be processed within 7 business days.
            </p>
          </div>
          
          <p className="text-sm text-gray-600">
            Your access to premium features will end now.
          </p>
        </div>
        
        <div className="flex space-x-4 justify-end">
          <button 
            onClick={() => setShowCancelConfirm(false)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            disabled={isLoading}
          >
            Keep Subscription
          </button>
          <button 
            onClick={confirmCancellation}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )}
    </>
    );
};

export default UpgradePage;
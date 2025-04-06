import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    employmentStatus: '',
    yearlyIncome: '',
    customIncomeCategories: [], // Changed to match backend
    customExpenseCategories: [], // Changed to match backend
    wantsMonthlyBudget: false,
    monthlyBudget: '',
    financialGoals: [], // Array of objects: [{ name: "Budgeting" }, ...]
    financialHabits: [], // Array of strings
    isCurrentlyInvesting: false,
    investmentTypes: [], // Array of strings
    wantsInvestmentRecommendations: false,
    riskLevel: 'Moderate',
    savingsGoal: '' // Changed to match backend
  });
  const { backendUrl } = useContext(AppContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomField, setShowCustomField] = useState({
    customIncomeCategories: false, // Updated key
    customExpenseCategories: false, // Updated key
    goals: false,
  });
  const [customInput, setCustomInput] = useState({
    incomeSource: '',
    expense: '',
    goal: '',
    savingsGoal: ''
  });

  const employmentOptions = ["Student", "Salaried", "Self-employed", "Business Owner", "Retired", "Unemployed"];
  const financialGoalOptions = ["Budgeting & Expense Tracking", "Saving & Investing", "Debt Management", "Income Tracking", "Retirement Planning", "Financial Education"];
  const financialHabitsOptions = ["Careful Planner", "Occasional Spender", "Impulsive Buyer", "Investor", "Saver", "Budget Follower"];
  const incomeSourceOptions = ["Salary", "Freelance", "Business", "Investments", "Rental", "Passive Income"];
  const expenseCategoryOptions = ["Rent/Mortgage", "Food", "Transportation", "Shopping", "Entertainment", "Health", "Trip", "Loans", "Insurance"];
  const investmentTypeOptions = ["Stocks", "Bonds", "Mutual Funds", "Real Estate", "Crypto", "Gold", "Fixed Deposits"];
  const riskLevelOptions = ["Low", "Moderate", "High"];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelectChange = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const fieldsWithObjects = ['customIncomeCategories', 'customExpenseCategories', 'financialGoals'];
      if (fieldsWithObjects.includes(field)) {
        const valueObj = { name: value };
        const exists = currentValues.some(item => item.name === value);
        return {
          ...prev,
          [field]: exists
            ? currentValues.filter(item => item.name !== value)
            : [...currentValues, valueObj]
        };
      } else {
        const exists = currentValues.includes(value);
        return {
          ...prev,
          [field]: exists
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value]
        };
      }
    });
  };

  const convertToWords = (amount) => {
    if (!amount) return "zero";
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const numToWord = (num) => {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' and ' + numToWord(num % 100) : '');
      if (num < 100000) return numToWord(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numToWord(num % 1000) : '');
      if (num < 10000000) return numToWord(Math.floor(num / 100000)) + ' lakh' + (num % 100000 ? ' ' + numToWord(num % 100000) : '');
      return numToWord(Math.floor(num / 10000000)) + ' crore' + (num % 10000000 ? ' ' + numToWord(num % 10000000) : '');
    };
    return numToWord(amount);
  };

  const handleCustomFieldToggle = (field) => {
    setShowCustomField(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCustomInputChange = (e) => {
    const { name, value } = e.target;
    setCustomInput(prev => ({ ...prev, [name]: value }));
  };

  const addCustomItem = (field, inputField) => {
    const newValue = customInput[inputField].trim();
    if (newValue && !formData[field].some(item => item.name === newValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], { name: newValue }]
      }));
      setCustomInput(prev => ({ ...prev, [inputField]: '' }));
    }
  };

  const nextStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prev => prev - 1);
  };

  const skipStep = () => {
    window.scrollTo(0, 0);
    if (currentStep < 7) {
      nextStep();
    } else {
      submitForm();
    }
  };

  const submitForm = async (e) => {
    if (e) e.preventDefault();
    const dataToSubmit = {
      onboardingData: {
        employmentStatus: formData.employmentStatus || "",
        yearlyIncome: formData.yearlyIncome !== undefined ? Number(formData.yearlyIncome) : 0,
        customIncomeCategories: formData.customIncomeCategories || [], // Ensure not undefined
        customExpenseCategories: formData.customExpenseCategories || [], // Ensure not undefined
        wantsMonthlyBudget: Boolean(formData.wantsMonthlyBudget),
        monthlyBudget: formData.monthlyBudget !== undefined ? Number(formData.monthlyBudget) : 0,
        financialGoals: formData.financialGoals || [], // Send as objects, backend extracts names
        financialHabits: formData.financialHabits || [],
        isCurrentlyInvesting: Boolean(formData.isCurrentlyInvesting),
        investmentTypes: formData.investmentTypes || [],
        wantsInvestmentRecommendations: Boolean(formData.wantsInvestmentRecommendations),
        riskLevel: formData.riskLevel || "Moderate",
        savingsGoal: formData.savingsGoal !== undefined ? Number(formData.savingsGoal) : 0
      }
    };
  
    console.log("Data being sent to backend:", JSON.stringify(dataToSubmit, null, 2)); // Debug log
  
    setIsLoading(true);
    axios.defaults.withCredentials = true;
  
    try {
      const response = await axios.put(`${backendUrl}/api/auth/update-onboarding`, dataToSubmit);
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/dashboard');
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Error details:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save preferences";
      setError(`${errorMessage}. Please try again.`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="mb-8 mt-3">
      <div className="flex justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">Progress</p>
        <p className="text-sm font-medium text-blue-600">{currentStep} of 7</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${(currentStep / 7) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-20 -right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" />
      <div className="absolute top-40 -left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-10 left-40 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000" />

      <div className="absolute top-6 left-5 z-10">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-md hover:bg-gray-100 transition duration-200"
        >
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-blue-600 font-medium">Home</span>
        </button>
      </div>

      <div className="mt-16 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-indigo-900 text-center">Set Up Your Financial Profile</h2>
            <ProgressBar />
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3" 
                onClick={() => setError('')}
              >
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {employmentOptions.map(option => (
                      <div
                        key={option}
                        onClick={() => setFormData(prev => ({ ...prev, employmentStatus: option }))}
                        className={`cursor-pointer p-4 border-2 rounded-xl ${
                          formData.employmentStatus === option 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-center">{option}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Financial Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approximate Yearly Income (₹)
                    </label>
                    <input
                      type="number"
                      name="yearlyIncome"
                      value={formData.yearlyIncome}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600 text-m">Yearly Income in words :
                    <span className="text-gray-700 italic">
                    {formData.yearlyIncome ? `   Rupees ${convertToWords(formData.yearlyIncome)} only` : "  No income entered"}
                    </span></p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saving Goal Monthly (₹)
                    </label>
                    <input
                      type="number"
                      name="savingsGoal" // Updated to match backend
                      value={formData.savingsGoal}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-600 text-m">Saving Goal in words :
                    <span className="text-gray-700 italic">
                    {formData.savingsGoal ? `   Rupees ${convertToWords(formData.savingsGoal)} only` : "  No amount entered"}
                    </span></p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-700">
                      Set Monthly Budget
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        name="wantsMonthlyBudget"
                        id="wantsMonthlyBudget"
                        checked={formData.wantsMonthlyBudget}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div 
                        onClick={() => handleCheckboxChange({target: {name: 'wantsMonthlyBudget', checked: !formData.wantsMonthlyBudget}})}
                        className={`block w-14 h-8 rounded-full ${formData.wantsMonthlyBudget ? 'bg-blue-600' : 'bg-gray-300'} cursor-pointer`}
                      ></div>
                      <div 
                        onClick={() => handleCheckboxChange({target: {name: 'wantsMonthlyBudget', checked: !formData.wantsMonthlyBudget}})}
                        className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${formData.wantsMonthlyBudget ? 'transform translate-x-6' : ''}`}
                      ></div>
                    </div>
                  </div>
                  {formData.wantsMonthlyBudget && (
                    <input
                      type="number"
                      name="monthlyBudget"
                      value={formData.monthlyBudget}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Monthly budget amount"
                    />
                  )}

                  <div className="mb-4">
                    <p className="text-gray-600 text-m">Monthly Budget in words :
                    <span className="text-gray-700 italic">
                    {formData.monthlyBudget ? `   Rupees ${convertToWords(formData.monthlyBudget)} only` : " Monthly Budget not set"}
                    </span></p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">How would you describe your financial habits?</h3>
                  <div className="mt-6">
                    <label className="block text-base font-medium text-gray-700 mb-3">
                      Select all that apply
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {financialHabitsOptions.map((habit) => (
                        <div 
                          key={habit} 
                          onClick={() => handleMultiSelectChange('financialHabits', habit)}
                          className={`cursor-pointer p-3 border-2 rounded-xl flex justify-between items-center ${
                            formData.financialHabits.includes(habit) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{habit}</span>
                          {formData.financialHabits.includes(habit) && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Income Sources</h3>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor="hasMultipleIncomeSources" className="block text-base font-medium text-gray-700">
                        Do you have multiple income sources?
                      </label>
                    </div>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {[...new Set([...incomeSourceOptions, ...formData.customIncomeCategories.map(item => item.name).filter(source => !incomeSourceOptions.includes(source))])].map((source) => (
                          <div 
                            key={source} 
                            onClick={() => handleMultiSelectChange('customIncomeCategories', source)}
                            className={`cursor-pointer p-3 border-2 rounded-xl flex justify-between items-center ${
                              formData.customIncomeCategories.some(item => item.name === source) 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="font-medium">{source}</span>
                            {formData.customIncomeCategories.some(item => item.name === source) && (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleCustomFieldToggle('customIncomeCategories')} // Updated key
                          className="inline-flex items-center px-4 py-2.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 ease-in-out hover:shadow"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                          Customize Income Source
                        </button>
                        {showCustomField.customIncomeCategories && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-100">
                              <div className="flex">
                                <input
                                  type="text"
                                  name="incomeSource"
                                  value={customInput.incomeSource}
                                  onChange={handleCustomInputChange}
                                  className="flex-1 rounded-l-lg border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                  placeholder="    Enter custom income source"
                                />
                                <button
                                  type="button"
                                  onClick={() => addCustomItem('customIncomeCategories', 'incomeSource')} // Updated field
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 hover:shadow"
                                >
                                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                  </svg>
                                  Add
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Monthly Expenses</h3>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-3">
                      What are your major monthly expenses?
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[...new Set([...expenseCategoryOptions, ...formData.customExpenseCategories.map(item => item.name).filter(expense => !expenseCategoryOptions.includes(expense))])].map((expense) => (
                        <div 
                          key={expense} 
                          onClick={() => handleMultiSelectChange('customExpenseCategories', expense)}
                          className={`cursor-pointer p-3 border-2 rounded-xl flex justify-between items-center ${
                            formData.customExpenseCategories.some(item => item.name === expense) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{expense}</span>
                          {formData.customExpenseCategories.some(item => item.name === expense) && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => handleCustomFieldToggle('customExpenseCategories')} // Updated key
                        className="inline-flex items-center px-4 py-2.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 ease-in-out hover:shadow"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Customize Expense
                      </button>
                      {showCustomField.customExpenseCategories && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-100">
                            <div className="flex">
                              <input
                                type="text"
                                name="expense"
                                value={customInput.expense}
                                onChange={handleCustomInputChange}
                                className="flex-1 rounded-l-lg border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="     Enter custom expense"
                              />
                              <button
                                type="button"
                                onClick={() => addCustomItem('customExpenseCategories', 'expense')} // Updated field
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 hover:shadow"
                              >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Financial Goals & Preferences</h3>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-3">
                      What are your primary financial goals? (Select all that apply)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...new Set([...financialGoalOptions, ...formData.financialGoals.map(item => item.name).filter(goal => !financialGoalOptions.includes(goal))])].map((goal) => (
                        <div 
                          key={goal} 
                          onClick={() => handleMultiSelectChange('financialGoals', goal)}
                          className={`cursor-pointer p-3 border-2 rounded-xl flex justify-between items-center ${
                            formData.financialGoals.some(item => item.name === goal) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{goal}</span>
                          {formData.financialGoals.some(item => item.name === goal) && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleCustomFieldToggle('goals')}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Customize Goal
                      </button>
                      {showCustomField.goals && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 flex"
                        >
                          <input
                            type="text"
                            name="goal"
                            value={customInput.goal}
                            onChange={handleCustomInputChange}
                            className="flex-1 rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter custom goal"
                          />
                          <button
                            type="button"
                            onClick={() => addCustomItem('financialGoals', 'goal')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">Investment Preferences</h3>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor="isCurrentlyInvesting" className="block text-base font-medium text-gray-700">
                        Are you currently investing?
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          name="isCurrentlyInvesting"
                          id="isCurrentlyInvesting"
                          checked={formData.isCurrentlyInvesting}
                          onChange={handleCheckboxChange}
                          className="sr-only"
                        />
                        <div 
                          onClick={() => handleCheckboxChange({target: {name: 'isCurrentlyInvesting', checked: !formData.isCurrentlyInvesting}})}
                          className={`block w-14 h-8 rounded-full ${formData.isCurrentlyInvesting ? 'bg-blue-600' : 'bg-gray-300'} cursor-pointer`}
                        ></div>
                        <div 
                          onClick={() => handleCheckboxChange({target: {name: 'isCurrentlyInvesting', checked: !formData.isCurrentlyInvesting}})}
                          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${formData.isCurrentlyInvesting ? 'transform translate-x-6' : ''}`}
                        ></div>
                      </div>
                    </div>
                    {formData.isCurrentlyInvesting && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          What types of investments do you currently have?
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {investmentTypeOptions.map((type) => (
                            <div 
                              key={type} 
                              onClick={() => handleMultiSelectChange('investmentTypes', type)}
                              className={`cursor-pointer p-3 border-2 rounded-xl flex justify-between items-center ${
                                formData.investmentTypes.includes(type) 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="font-medium">{type}</span>
                              {formData.investmentTypes.includes(type) && (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor="wantsInvestmentRecommendations" className="block text-base font-medium text-gray-700">
                        Would you like investment recommendations?
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          name="wantsInvestmentRecommendations"
                          id="wantsInvestmentRecommendations"
                          checked={formData.wantsInvestmentRecommendations}
                          onChange={handleCheckboxChange}
                          className="sr-only"
                        />
                        <div 
                          onClick={() => handleCheckboxChange({target: {name: 'wantsInvestmentRecommendations', checked: !formData.wantsInvestmentRecommendations}})}
                          className={`block w-14 h-8 rounded-full ${formData.wantsInvestmentRecommendations ? 'bg-blue-600' : 'bg-gray-300'} cursor-pointer`}
                        ></div>
                        <div 
                          onClick={() => handleCheckboxChange({target: {name: 'wantsInvestmentRecommendations', checked: !formData.wantsInvestmentRecommendations}})}
                          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${formData.wantsInvestmentRecommendations ? 'transform translate-x-6' : ''}`}
                        ></div>
                      </div>
                    </div>
                    {formData.wantsInvestmentRecommendations && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          What is your risk tolerance level?
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {riskLevelOptions.map((level) => (
                            <div 
                              key={level} 
                              onClick={() => setFormData({...formData, riskLevel: level})}
                              className={`cursor-pointer p-4 border-2 rounded-xl ${
                                formData.riskLevel === level 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className="font-medium text-center">{level}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                {isLoading ? 'Processing...' : 'Skip all for now'}
              </button>
            )}
            
            <div className="flex space-x-3">
              {currentStep < 7 &&
              <button
                type="button"
                onClick={skipStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                Skip this step
              </button>}
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitForm}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
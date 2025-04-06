import React, { useState, useContext, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import { AppContent } from '../context/AppContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  Receipt, 
  Crown,
  TrendingUp,
  AlertCircle,
  Plus,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../context/GlobalContext";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FooterContainer } from '../components/Footer';
import ChartsContainer from '../components/Chart';
import { ToastContainer, toast } from 'react-toastify';
import DetailedChartsContainer from '../components/DetailedChart';
import moment from 'moment';

const Dashboard = () => {
  const { userData } = useContext(AppContent);
  const { 
    incomes, 
    expenses, 
    getIncomes, 
    getExpenses, 
    deleteExpense, 
    deleteIncome, 
    totalIncome, 
    totalExpenses, 
    totalBalance,
    budgets,
    getBudgets 
  } = useContext(GlobalContext);
  
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [latestTransactions, setLatestTransactions] = useState({ incomes: [], expenses: [] });
  const [monthlyBudget, setMonthlyBudget] = useState([]);
  
  useEffect(() => {
    const fetchAllData = async () => {
      await getIncomes();
      await getExpenses();
      await getBudgets();
    };
    
    fetchAllData();
  }, []);
  
  useEffect(() => {
    // Calculate trend data for the last 6 months
    calculateTrendData();
    
    // Get latest transactions
    getLatestTransactions();
    
    // Process budgets
    processBudgets();
  }, [incomes, expenses, budgets]);
  
  const calculateTrendData = () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(sixMonthsAgo.getMonth() + i);
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        income: 0,
        expense: 0,
        balance: 0
      });
    }
    
    // Calculate income by month
    incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      const monthIndex = months.findIndex(m => 
        m.month === incomeDate.toLocaleString('default', { month: 'short' }) && 
        m.year === incomeDate.getFullYear()
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].income += income.amount;
      }
    });
    
    // Calculate expense by month
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const monthIndex = months.findIndex(m => 
        m.month === expenseDate.toLocaleString('default', { month: 'short' }) && 
        m.year === expenseDate.getFullYear()
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].expense += expense.amount;
      }
    });
    
    // Calculate balance
    months.forEach(month => {
      month.balance = month.income - month.expense;
    });
    
    setTrendData(months);
  };
  
  const getLatestTransactions = () => {
    // Get 5 most recent incomes
    const latestIncomes = [...incomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
      
    // Get 5 most recent expenses
    const latestExpenses = [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
      
    setLatestTransactions({ incomes: latestIncomes, expenses: latestExpenses });
  };
  
  const processBudgets = () => {
    // Calculate monthly budget usage
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyBudgets = budgets.filter(budget => {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);
      return (
        startDate.getMonth() <= currentMonth && 
        endDate.getMonth() >= currentMonth &&
        startDate.getFullYear() <= currentYear &&
        endDate.getFullYear() >= currentYear
      );
    });
    
    // Calculate spent amount for each budget
    monthlyBudgets.forEach(budget => {
      const budgetExpenses = expenses.filter(expense => 
        expense.category === budget.category &&
        new Date(expense.date).getMonth() === currentMonth &&
        new Date(expense.date).getFullYear() === currentYear
      );
      
      budget.spent = budgetExpenses.reduce((total, expense) => total + expense.amount, 0);
      budget.remaining = budget.amount - budget.spent;
      budget.percentage = (budget.spent / budget.amount) * 100;
    });
    
    setMonthlyBudget(monthlyBudgets);
  };
  
  // Calculate trends for overview cards
  const calculateTrend = (type) => {
    if (trendData.length < 2) return '0%';
    
    const currentMonth = trendData[trendData.length - 1];
    const previousMonth = trendData[trendData.length - 2];
    
    if (!currentMonth || !previousMonth) return '0%';
    
    let current, previous;
    
    if (type === 'income') {
      current = currentMonth.income;
      previous = previousMonth.income;
    } else if (type === 'expense') {
      current = currentMonth.expense;
      previous = previousMonth.expense;
    } else {
      current = currentMonth.balance;
      previous = previousMonth.balance;
    }
    
    if (previous === 0) return previous < current ? '+∞%' : '0%';
    
    const trendPercentage = ((current - previous) / previous) * 100;
    return `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`;
  };
  
  // Format date for display
  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  return (
    <>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar onToggle={setIsSidebarCollapsed} />
      
      {/* Main Content Container */}
      <div className={`
        flex-1 
        overflow-y-auto 
        transition-all 
        duration-300 
        ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        max-w-full
        bg-gray-50
      `}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center mb-2">
              <Sparkles className="mr-2 text-yellow-500" size={24} />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Hi, {userData ? userData.name : 'Developer'} 👋
              </h1>
            </div>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Here's what's happening with your money. Let's manage your finances wisely.
            </p>
          </motion.div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {[
              { 
                title: 'Total Balance', 
                amount: totalBalance(), 
                trend: calculateTrend('balance'),
                icon: <Wallet className="text-blue-500" size={24} />
              },
              { 
                title: 'Total Income', 
                amount: totalIncome, 
                trend: calculateTrend('income'),
                icon: <ArrowUpRight className="text-green-500" size={24} />
              },
              { 
                title: 'Total Expense', 
                amount: totalExpenses, 
                trend: calculateTrend('expense'),
                icon: <ArrowDownRight className="text-red-500" size={24} />
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      {card.icon}
                    </div>
                    <h3 className="text-gray-500 text-xs md:text-sm font-medium">{card.title}</h3>
                  </div>
                  <span className={`text-xs md:text-sm font-medium px-2 py-1 rounded-full ${
                    card.trend.startsWith('+') ? 'bg-green-100 text-green-600' : 
                    card.trend.startsWith('-') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>{card.trend}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xl md:text-2xl font-bold text-gray-800">${card.amount}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Financial Trend Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Financial Trends</h2>
              </div>
              <div className="text-sm text-gray-500">Last 6 months</div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="balance" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Financial AI Insight */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 md:p-6 rounded-2xl mb-6"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="text-white" size={20} />
              </div>
              <h3 className="font-bold text-blue-900 text-sm md:text-base">AI Financial Insights</h3>
            </div>
            <p className="text-blue-800 leading-relaxed text-xs md:text-sm">
              Based on your current financial data, it's essential to begin finding ways to generate income, 
              which could include finding employment or establishing a small business. Consider reducing unnecessary 
              expenses to maximize your remaining budget of ${totalBalance()} and think about creating an emergency fund, 
              investing or saving with a proper plan to secure your financial future.
            </p>
          </motion.div>

          {/* Latest Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Latest Incomes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 md:p-6 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <ArrowUpRight className="text-green-600" size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Latest Incomes</h2>
                </div>
                <button 
                  onClick={() => navigate('/incomes')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              {latestTransactions.incomes.length > 0 ? (
                <div className="space-y-3">
                  {latestTransactions.incomes.map((income, idx) => (
                    <div 
                      key={income._id || idx} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <PiggyBank className="text-green-600" size={18} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{income.title || income.category}</h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={12} className="mr-1" />
                            <span>{formatDate(income.date)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">+${income.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No income transactions found</div>
              )}
            </motion.div>
            
            {/* Latest Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-4 md:p-6 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <ArrowDownRight className="text-red-600" size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Latest Expenses</h2>
                </div>
                <button 
                  onClick={() => navigate('/expenses')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              
              {latestTransactions.expenses.length > 0 ? (
                <div className="space-y-3">
                  {latestTransactions.expenses.map((expense, idx) => (
                    <div 
                      key={expense._id || idx} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Receipt className="text-red-600" size={18} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{expense.title || expense.category}</h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={12} className="mr-1" />
                            <span>{formatDate(expense.date)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-red-600">-${expense.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No expense transactions found</div>
              )}
            </motion.div>
          </div>

          {/* Main Charts Section */}
          

          {/* Monthly Budgets */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm mb-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Monthly Budgets</h2>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/budgets/new')}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-purple-700 transition-colors duration-200"
              >
                <Plus size={18} />
                <span>New Budget</span>
              </motion.button>
            </div>

            {monthlyBudget.length > 0 ? (
              <div className="space-y-4">
                {monthlyBudget.map((budget, index) => (
                  <motion.div 
                    key={budget._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
                      <span className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-2xl shadow-sm mr-4">
                        {budget.icon || '💰'}
                      </span>
                      <div className="flex-1 md:flex-auto">
                        <p className="font-semibold text-gray-800">{budget.title || budget.category}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>${budget.spent || 0} Spent</span>
                          <span>•</span>
                          <span>${budget.remaining || budget.amount} Remaining</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center md:text-right w-full md:w-auto">
                      <p className="font-bold text-gray-800">${budget.amount}</p>
                      <div className="w-full md:w-32 h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`h-full rounded-full ${budget.percentage > 90 ? 'bg-red-500' : budget.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((budget.spent / budget.amount) * 100 || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PiggyBank size={40} className="mx-auto mb-3 text-gray-400" />
                <p className="mb-4">No monthly budgets found</p>
                <button 
                  onClick={() => navigate('/budgets/new')}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  Create your first budget
                </button>
              </div>
            )}
          </motion.div>
          
          <FooterContainer />
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
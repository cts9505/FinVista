import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PlusCircle,FolderIcon, FileText, Calendar  ,CheckCircle, X, Clock, Edit2, Trash2, DollarSign, PieChart, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';



// Emoji picker component
const EmojiPicker = ({ onSelect }) => {
    const emojis = [
        '💰', '💵', '🏠', '🚗', '🍔', '👕', '💻', '🎮', '🎬', '🎓', 
        '🏥', '✈️', '🎁', '🛒', '📱', '🐶', '🍎', '👶', '💄', '🛠️'
    ];

    return (
        <div className="grid grid-cols-5 gap-2 p-2 bg-white border rounded">
            {emojis.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="text-2xl hover:bg-gray-100 rounded p-1"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const BudgetPage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const { 
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgets,
        budgets,
        expenses,
        getExpenses
    } = useGlobalContext();

    // Current date info
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeftInMonth = daysInMonth - currentDate.getDate();
    const monthsLeftInYear = 11 - currentMonth;

    // States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMonthlyIncomeFormOpen, setIsMonthlyIncomeFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentEditBudget, setCurrentEditBudget] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(true);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyIncomeSet, setMonthlyIncomeSet] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [hasPromptedMonthlyBudget, setHasPromptedMonthlyBudget] = useState(false);
    const [startFromMonthBeginning, setStartFromMonthBeginning] = useState(true);
    const currYear = new Date().getFullYear();
    const minDate = `${currYear}-01-01`; // January 1st of the current year
    const maxDate = `${currYear}-12-31`; // December 31st of the current year
    
    // Form inputs
    const [inputState, setInputState] = useState({
        title: '',
        amount: '',
        category: '',
        emoji: '💰',
        period: 'monthly',
        autoRenew: true,
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: '',
        isCustomDate: false
    });

    const { title, amount, category, emoji, period, autoRenew, startDate, endDate, isCustomDate } = inputState;
    
    // Calculate months for dropdown
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    
    useEffect(() => {
        if (startFromMonthBeginning && period !== 'custom') {
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            console.log(firstDayOfMonth);
            setInputState(prev => ({
                ...prev,
                startDate: firstDayOfMonth
            }));
        }
    }, [startFromMonthBeginning, currentYear, currentMonth, period]);
    useEffect(() => {
        if (budgets && !isMonthlyBudgetSet()) {
            setIsMonthlyIncomeFormOpen(true);
        }
    }, [budgets, selectedMonth, selectedYear]);
    // Budget period options - dynamically generated based on current date
    const generatePeriodOptions = () => {
        // Calculate months left in year
        const currentDate = new Date(startDate);
        const currentMonth = currentDate.getMonth();
        const monthsLeftInYear = 11 - currentMonth;
        const dayOfMonth = currentDate.getDate();
        
        const options = [
          { value: 'monthly', label: 'Monthly (Till end of till of this month)' }
        ];
        
        // Only add quarterly if there are at least 3 months left in the year
        if (monthsLeftInYear >= 3) {
          options.push({ value: 'quarterly', label: 'Quarterly (for next 3 months)' });
        }
        
        // Only add biannual if there are at least 6 months left in the year
        if (monthsLeftInYear >= 6) {
          options.push({ value: 'biannual', label: 'Half Yearly (for next 6 months)' });
        }
        
        // For annual, check if start date is the first day of the year or there are 12 months ahead
        if (dayOfMonth === 1 && currentMonth === 0) {
          options.push({ value: 'annual', label: 'Yearly (for next 12 months)' });
        }
        
        options.push({ value: 'custom', label: 'Custom Date Range' });
        
        return options;
      };

// Add this effect to adjust period if it's not available anymore (add after your other useEffects)

    
    const periodOptions = generatePeriodOptions();

    // Category options
    const categoryOptions = [
        { value: 'Essentials & Living', label: 'Essentials & Living' },
        { value: 'Entertainment', label: 'Lifestyle & Entertainment' },
        { value: 'Loans & EMI', label: 'Loans & EMI\'s' },
        { value: 'Transportation', label: 'Transportation & Mobility' },
        
        { value: 'Other', label: 'Miscellaneous / Others' }
    ];

    // Calculate total monthly income
    const getMonthlyBudget = () => {
        if (!budgets) return null;
        
        const monthlyBudget = budgets.find(budget => 
            budget.title === 'Monthly Income' && 
            new Date(budget.startDate).getMonth() === selectedMonth &&
            new Date(budget.startDate).getFullYear() === selectedYear
        );
        
        return monthlyBudget;
    };
    
    // Check if monthly budget exists for the selected month
    const monthlyBudget = getMonthlyBudget();
    
   // Line ~136-177: Update this function
// Update the calculateDateRange function (around line 136-177)
const calculateDateRange = (periodType, startDateStr = null) => {
    let startDate, endDate;
    
    // If startDateStr is provided, use it as the base
    if (startDateStr) {
        startDate = new Date(startDateStr);
    } else {
        // Otherwise use current date
        startDate = new Date(currentYear, currentMonth, 1);
    }
    
    // Extract the month and year from startDate
    const month = startDate.getMonth();
    const year = startDate.getFullYear();

    switch(periodType) {
        case 'monthly':
            // Start from the 1st of the month
            startDate = new Date(year, month, 1);
            // End on the last day of the month
            endDate = new Date(year, month + 1, 0);
            break;
        case 'quarterly':
            // Start from the 1st of the current quarter
            const quarterStartMonth = Math.floor(month / 3) * 3;
            startDate = new Date(year, quarterStartMonth, 1);
            // End on the last day of the quarter
            endDate = new Date(year, quarterStartMonth + 3, 0);
            break;
        case 'biannual':
            // Start from 1st of the half-year
            const halfStartMonth = Math.floor(month / 6) * 6;
            startDate = new Date(year, halfStartMonth, 1);
            // End on the last day of the half-year
            endDate = new Date(year, halfStartMonth + 6, 0);
            break;
        case 'annual':
            // Start from 1st of the year
            startDate = new Date(year, 0, 1);
            // End on the last day of the year
            endDate = new Date(year, 11, 31);
            break;
        case 'custom':
            // For custom period, use the provided startDate and endDate from the form
            // endDate will be handled separately
            break;
        default:
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 0);
    }

    return { startDate, endDate };
};

    // Update end date when period changes
    useEffect(() => {
        if (period !== 'custom' && startDate) {
            const { endDate: calculatedEndDate } = calculateDateRange(period, startDate);
            
            if (calculatedEndDate) {
                setInputState(prev => ({
                    ...prev,
                    endDate: calculatedEndDate.toISOString().split('T')[0]
                }));
            }
        }
    }, [period, startDate]);

    // Get active period label based on selected month and year
    const getActivePeriodLabel = () => {
        switch(period) {
            case 'quarterly':
                const quarter = Math.floor(selectedMonth / 3) + 1;
                return `Q${quarter} ${selectedYear}`;
            case 'biannual':
                return selectedMonth < 6 ? `H1 ${selectedYear}` : `H2 ${selectedYear}`;
            case 'annual':
                return `${selectedYear}`;
            default:
                return `${months[selectedMonth]} ${selectedYear}`;
        }
    };
    
    // Check if there's at least one budget created
    const hasBudgets = budgets && budgets.length > 0;
    
    // Check if monthly budget is set for the current month
    const isMonthlyBudgetSet = () => {
        if (!budgets) return false;
        
        const budgetExists = budgets.some(budget => {
          // Extract date parts directly from the startDate string, which should be YYYY-MM-DD
          const dateStr = budget.startDate;
          if (!dateStr || typeof dateStr !== 'string') return false;
          
          const [year, month] = dateStr.split('-').map(num => parseInt(num, 10));
          
          // Month in the date string is 1-indexed, while selectedMonth is 0-indexed
          return budget.title === 'Monthly Income' && 
                 month === selectedMonth + 1 && 
                 year === selectedYear;
        });
        
        console.log(`Checking if monthly budget exists for ${months[selectedMonth]} ${selectedYear}: ${budgetExists}`);
        
        return budgetExists;
      };

    // Prompt user to set monthly budget if not set
    // Replace the duplicate useEffects with a single, clear one
useEffect(() => {
    // Only run this effect when budgets are loaded and when month/year selection changes
    if (budgets) {
        // First check if there's already a monthly budget for the selected month/year
        const monthlyBudgetExists = isMonthlyBudgetSet();
        
        // Only show the prompt if no monthly budget exists
        if (!monthlyBudgetExists) {
            setIsMonthlyIncomeFormOpen(true);
            setHasPromptedMonthlyBudget(true);
        } else {
            // Make sure the form is closed if a budget exists
            setIsMonthlyIncomeFormOpen(false);
        }
    }
}, [budgets, selectedMonth, selectedYear]);

// Add this effect to reset the state when changing months
useEffect(() => {
    // This will force a re-check when the selected month/year changes
    if (budgets) {
        // Check if there's a budget for the newly selected month
        const monthlyBudgetExists = isMonthlyBudgetSet();
        if (!monthlyBudgetExists) {
            // Only reset the prompt state if there's no budget
            setHasPromptedMonthlyBudget(false);
        }
    }
}, [selectedMonth, selectedYear]);
    // Filter budgets by selected month and year
    const filteredBudgets = budgets ? budgets.filter(budget => {
        // Skip if budget doesn't have proper dates
        if (!budget.startDate || !budget.endDate) return false;
        
        const budgetStartDate = new Date(budget.startDate);
        const budgetEndDate = new Date(budget.endDate);
        
        // Monthly income budget is special and should be filtered exactly by month
        if (budget.title === 'Monthly Income') {
            return budgetStartDate.getMonth() === selectedMonth && 
                   budgetStartDate.getFullYear() === selectedYear;
        }
        
        // For other budgets, check if the selected month/year falls within the budget period
        const currentDate = new Date(selectedYear, selectedMonth, 15); // Middle of selected month
        
        // If showing only active budgets, filter out expired ones
        if (showActiveOnly) {
            const now = new Date();
            if (budgetEndDate < now) {
                return false;
            }
        }
        
        // Check if the selected month/year falls within the budget period
        return currentDate >= budgetStartDate && currentDate <= budgetEndDate;
    }) : [];

    // Calculate how much of the monthly budget has been spent
    const getMonthlyBudgetRemaining = () => {
        if (!monthlyBudget || !expenses) return 0;
        
        const startDate = new Date(monthlyBudget.startDate);
        const endDate = new Date(monthlyBudget.endDate);
        
        // Calculate total expenses for the month
        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
        
        const totalExpenses = monthlyExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
        
        return monthlyBudget.amount - totalExpenses;
    };

    // Calculate spent amount for each budget based on matching expenses
    const getBudgetSpent = (budgetId, budgetCategory, startDate, endDate) => {
        // Early return if expenses is undefined or empty
        if (!expenses || expenses.length === 0) return 0;
        
        // Early return if budget parameters are invalid
        if (!budgetCategory || !startDate || !endDate) return 0;
        
        // Make sure startDate and endDate are Date objects
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        
        // Filter expenses by category and date range
        const relevantExpenses = expenses.filter(expense => {
            // Skip invalid expenses
            if (!expense || !expense.category || !expense.date || !expense.amount) return false;
            
            // Convert expense date to Date object
            let expenseDate = expense.date;
            if (!(expenseDate instanceof Date)) {
                try {
                    expenseDate = new Date(expense.date);
                } catch (e) {
                    return false;
                }
            }
            
            // Category match is case-insensitive
            const categoryMatch = expense.category.toLowerCase() === budgetCategory.toLowerCase();
            
            // Date range check
            const dateInRange = expenseDate >= start && expenseDate <= end;
            
            return categoryMatch && dateInRange;
        });
        
        // Sum up the amounts
        const total = relevantExpenses.reduce((total, expense) => {
            const amount = parseFloat(expense.amount);
            return isNaN(amount) ? total : total + amount;
        }, 0);
        
        return total;
    };

    // Calculate remaining amount for a budget
    const getBudgetRemaining = (budget) => {
        if (!budget || !budget.startDate || !budget.endDate) return 0;
        
        const { startDate, endDate, amount, category } = budget;
        const spent = getBudgetSpent(budget._id, category, new Date(startDate), new Date(endDate));
        return amount - spent;
    };

    // Check if a budget is about to expire
    const isBudgetExpiringSoon = (budget) => {
        if (!budget || !budget.endDate) return false;
        
        const endDate = new Date(budget.endDate);
        const now = new Date();
        const daysUntilExpiry = Math.round((endDate - now) / (1000 * 60 * 60 * 24));
        
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    };

    // Check if a budget is expired
    const isBudgetExpired = (budget) => {
        if (!budget || !budget.endDate) return false;
        
        const endDate = new Date(budget.endDate);
        const now = new Date();
        return endDate < now;
    };

    // Renew a budget based on its period
    const renewBudget = (budget) => {
        if (!budget || !budget.period) return;
        
        const { startDate, endDate, period, ...rest } = budget;
        
        // Calculate new date range based on the previous end date
        const oldEndDate = new Date(endDate);
        const newStartDate = new Date(oldEndDate);
        newStartDate.setDate(newStartDate.getDate() + 1); // Start from the day after the old end date
        
        const { startDate: calculatedStart, endDate: calculatedEnd } = calculateDateRange(period, newStartDate.toISOString());
        
        // Create a new budget with the updated date range
        const newBudget = {
            ...rest,
            startDate: calculatedStart.toISOString().split('T')[0],
            endDate: calculatedEnd.toISOString().split('T')[0],
            period
        };
        
        // Add the new budget
        addBudget(newBudget);
        
        // Add notification
        setNotifications(prev => [
            ...prev,
            {
                id: Date.now(),
                message: `Budget "${budget.title}" has been automatically renewed`,
                type: 'success'
            }
        ]);
    };
    
    // Check for budgets that need renewal
    useEffect(() => {
        if (!budgets || !autoRenewalEnabled) return;
        
        // Find budgets that have expired
        const expiredBudgets = budgets.filter(budget => 
            budget.autoRenew && 
            isBudgetExpired(budget) && 
            budget.title !== 'Monthly Income' // Don't auto-renew income budgets
        );
        
        expiredBudgets.forEach(budget => {
            renewBudget(budget);
            // Delete old expired budget
            deleteBudget(budget._id);
        });
    }, [budgets, autoRenewalEnabled]);
    
    // Load budgets and expenses when component mounts
    useEffect(() => {
        getBudgets();
        getExpenses();
    }, []);

    const handleMonthChange = (event) => {
        const newMonth = parseInt(event.target.value);
        setSelectedMonth(newMonth);
        // Important: Reset the hasPromptedMonthlyBudget when month changes
        setHasPromptedMonthlyBudget(false);
      };
    
    // Prepare chart data for budget visualization
    // Prepare chart data for budget visualization
const prepareChartData = () => {
    if (!filteredBudgets || filteredBudgets.length === 0) return [];
    
    return filteredBudgets
        .filter(budget => budget.title !== 'Monthly Income') // Exclude monthly income from chart
        .map(budget => {
            const spent = getBudgetSpent(budget._id, budget.category, new Date(budget.startDate), new Date(budget.endDate));
            const remaining = budget.amount - spent;
            
            return {
                name: budget.title,
                category: budget.category,
                Spent: spent,
                Remaining: remaining,
                Total: budget.amount
            };
        });
};
const getCategoryLabel = (category) => {
    switch(category) {
      case 'Essentials & Living':
        return 'Essentials & Living';
      case 'Loans & EMI':
        return 'Loans & EMI\'s';
      case 'Transportation':
        return 'Transportation & Mobility';
      case 'Entertainment':
        return 'Lifestyle & Entertainment';
      case 'Other':
        return 'Gifts, Donations & Miscellaneous';
      default:
        return 'Unknown';
    }
  };
  const getPeriodLabel = () => {
    switch(period) {
      case 'quarterly':
        const quarter = Math.floor(selectedMonth / 3) + 1;
        return `Q${quarter} ${selectedYear}`;
      case 'biannual':
        return selectedMonth < 6 ? `H1 ${selectedYear}` : `H2 ${selectedYear}`;
      case 'annual':
        return `${selectedYear}`;
      default:
        return `${months[selectedMonth]} ${selectedYear}`;
    }
  };

  const handleMonthlyIncomeSubmit = (e) => {
    e.preventDefault();
    
    // Create date strings directly without timezone conversion
    // For first day of month: YYYY-MM-01
    const formattedStartDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    
    // Calculate last day of month
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // For last day of month: YYYY-MM-DD
    const formattedEndDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    console.log('Start date (fixed):', formattedStartDate);
    console.log('End date (fixed):', formattedEndDate);
    
    // Create monthly income budget with timezone-safe dates
    const monthlyIncomeBudget = {
      title: 'Monthly Income',
      amount: parseFloat(monthlyIncome),
      category: 'Income',
      emoji: '💰',
      period: 'monthly',
      autoRenew: false,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    };
    
    console.log('Monthly income budget object (fixed):', monthlyIncomeBudget);
    
    // Add the budget
    addBudget(monthlyIncomeBudget);
    setIsMonthlyIncomeFormOpen(false);
    setMonthlyIncomeSet(true);
    
    // Add notification
    setNotifications(prev => [
      ...prev,
      {
        id: Date.now(),
        message: `Monthly income for ${months[selectedMonth]} ${selectedYear} has been set`,
        type: 'success'
      }
    ]);
  };
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setInputState(prev => ({ ...prev, [name]: checked }));
        } else {
            setInputState(prev => ({ ...prev, [name]: value }));
            
            // Special handling for period changes
            if (name === 'period' && value !== 'custom') {
                const { startDate: newStartDate, endDate: newEndDate } = calculateDateRange(value, startDate);
                
                setInputState(prev => ({
                    ...prev,
                    startDate: newStartDate.toISOString().split('T')[0],
                    endDate: newEndDate ? newEndDate.toISOString().split('T')[0] : '',
                    isCustomDate: value === 'custom'
                }));
            }
            
            if (name === 'period' && value === 'custom') {
                setInputState(prev => ({
                    ...prev,
                    isCustomDate: true
                }));
            }
        }
    };
    
    // Handle emoji selection
    const handleEmojiSelect = (selectedEmoji) => {
        setInputState(prev => ({ ...prev, emoji: selectedEmoji }));
        setIsEmojiPickerOpen(false);
    };
    // Define recentExpenses - filter to get only the most recent expenses
const recentExpenses = expenses ? expenses
.sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
.slice(0, 5) // Get the 5 most recent expenses
: [];
const allExpenses = expenses || [];
const recentExpensesLimit = 5; // Set this to the number of recent expenses you want to show
    // Reset form state
    const resetForm = () => {
        setInputState({
                 title: '',
                amount: '',
                category: '',
                emoji: '💰',
                period: 'monthly',
                autoRenew: true,
                startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
                endDate: '',
                isCustomDate: false
        });
        setIsEditMode(false);
        setCurrentEditBudget(null);
    };
    
    // Close form
    const closeForm = () => {
        setIsFormOpen(false);
        resetForm();
    };
    
    // Handle budget form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate form
        if (!title || !amount || !category || !startDate || !endDate) {
            // Add notification
            setNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    message: 'Please fill in all required fields',
                    type: 'error'
                }
            ]);
            return;
        }
        
        // Create budget object
        const budgetData = {
            title,
            amount: parseFloat(amount),
            category,
            emoji,
            period,
            autoRenew,
            startDate,
            endDate
        };
        
        // If in edit mode, update existing budget
        if (isEditMode && currentEditBudget) {
            updateBudget({
                _id: currentEditBudget._id,
                ...budgetData
            });
            
            // Add notification
            setNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    message: `Budget "${title}" has been updated`,
                    type: 'success'
                }
            ]);
        } else {
            // Otherwise, add new budget
            addBudget(budgetData);
            
            // Add notification
            setNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    message: `Budget "${title}" has been created`,
                    type: 'success'
                }
            ]);
        }
        
        // Close form and reset state
        closeForm();
    };
    
    // Edit a budget
    const editBudget = (budget) => {
        // Set current edit budget
        setCurrentEditBudget(budget);
        
        // Set form state with budget data
        setInputState({
            title: budget.title,
            amount: budget.amount.toString(),
            category: budget.category,
            emoji: budget.emoji || '💰',
            period: budget.period,
            autoRenew: budget.autoRenew,
            startDate: budget.startDate,
            endDate: budget.endDate,
            isCustomDate: budget.period === 'custom'
        });
        
        // Set edit mode and open form
        setIsEditMode(true);
        setIsFormOpen(true);
    };
    
    // Handle budget deletion
    const handleDeleteBudget = (budgetId, budgetTitle) => {
        if (window.confirm(`Are you sure you want to delete "${budgetTitle}" budget?`)) {
            deleteBudget(budgetId);
            
            // Add notification
            setNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    message: `Budget "${budgetTitle}" has been deleted`,
                    type: 'success'
                }
            ]);
        }
    };
    
    // Dismiss a notification
    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };
    
    // Get budget status color based on spent percentage
    const getBudgetStatusColor = (budget) => {
        if (!budget) return 'bg-gray-200';
        
        const remaining = getBudgetRemaining(budget);
        const spentPercentage = ((budget.amount - remaining) / budget.amount) * 100;
        
        if (spentPercentage >= 90) return 'bg-red-500';
        if (spentPercentage >= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };
    const paginatedBudgets = filteredBudgets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    // Check if there are any budgets with low balance
    const hasLowBalanceBudgets = filteredBudgets && filteredBudgets.some(budget => {
        if (budget.title === 'Monthly Income') return false;
        
        const remaining = getBudgetRemaining(budget);
        return (remaining / budget.amount) * 100 < 25;
    });
    
    // Check if there are any budgets expiring soon
    const hasExpiringBudgets = filteredBudgets && filteredBudgets.some(budget => 
        isBudgetExpiringSoon(budget) && !isBudgetExpired(budget)
    );
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    
    // Calculate percentage
    const calculatePercentage = (part, total) => {
        if (!total) return 0;
        return Math.round((part / total) * 100);
    };
    useEffect(() => {
    // Check if the current period is still valid based on months left
    if (period === 'quarterly' && monthsLeftInYear < 2) {
        setInputState(prev => ({ ...prev, period: 'monthly' }));
    }
    if (period === 'biannual' && monthsLeftInYear < 5) {
        setInputState(prev => ({ ...prev, period: 'monthly' }));
    }
}, [period, monthsLeftInYear]);
    // Budget chart data
    const chartData = prepareChartData();
    
    // Redirect to add expense if no budgets yet but monthly income is set
    const handleAddExpense = () => {
        // Usually would use router to navigate
        window.location.href = '/expenses/add';
    };
    
    // Monthly budget remaining percentage
    const monthlyBudgetRemainingPercentage = monthlyBudget 
        ? calculatePercentage(getMonthlyBudgetRemaining(), monthlyBudget.amount)
        : 0;


// Display message if no budgets exist at all
const showNoBudgetsMessage = !budgets || budgets.length === 0;
    

        return (
            <>
            <Sidebar onToggle={setIsSidebarCollapsed} />
  <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>
    {/* Sidebar */}
    
    
    {/* Main Content */}
    <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 `}>
      {/* Header */}
      <header className="bg-white shadow-sm p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Budget Management</h1>
          
          <div className="bg-blue-100 p-2 rounded mb-4 text-center mt-2 text-base">
  Currently working with budget for: <strong>{months[selectedMonth]} {selectedYear}</strong> • {daysLeftInMonth} days left in month
</div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <select 
              className="border rounded px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select 
              className="border rounded px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={currentYear - 2 + i}>
                  {currentYear - 2 + i}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center text-sm hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto justify-center sm:justify-start"
          >
            <PlusCircle size={16} className="mr-2" /> New Budget
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-600 flex items-center">
              <AlertTriangle className="mr-2" size={18} /> 
              Notifications ({notifications.length})
            </h2>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-center justify-between p-4 mb-2 rounded-lg shadow-sm border ${
                    notification.type === 'error' 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : notification.type === 'warning' 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                        : 'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  <div className="flex items-center">
                    {notification.type === 'error' && <X size={18} className="mr-2" />}
                    {notification.type === 'warning' && <AlertTriangle size={18} className="mr-2" />}
                    {notification.type === 'success' && <CheckCircle size={18} className="mr-2" />}
                    {notification.message}
                  </div>
                  <button 
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Budget Set Form (if not set) */}
        {isMonthlyIncomeFormOpen && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-600">Set Monthly Income</h2>
                <button 
                  onClick={() => setIsMonthlyIncomeFormOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleMonthlyIncomeSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Income for {months[selectedMonth]} {currentYear}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={monthlyIncome} 
                      onChange={(e) => setMonthlyIncome(e.target.value)} 
                      className="border rounded-lg w-full py-2 px-8 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Enter your monthly income" 
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Set Monthly Income
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Budget Form */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-90vh overflow-y-auto m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-600">
                  {isEditMode ? 'Edit Budget' : 'Create New Budget'}
                </h2>
                <button 
                  onClick={closeForm} 
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} 
                        className="border rounded-lg p-2 text-2xl mr-2 ml-2 w-15 hover:bg-gray-50"
                      >
                        {emoji}
                      </button>
                      <span className="text-sm text-gray-500">
                        Click to select an icon
                      </span>
                    </div>
                    {isEmojiPickerOpen && (
                      <div className="mt-2 z-10 relative">
                        <EmojiPicker onSelect={handleEmojiSelect} />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Title</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <FileText size={16} className="text-gray-400" />
                      </span>
                      <input 
                        type="text" 
                        name="title" 
                        value={title} 
                        onChange={handleChange} 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="e.g. Groceries, Rent, etc." 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <FolderIcon size={16} className="text-gray-400" />
                      </span>
                      <select 
                        name="category" 
                        value={category} 
                        onChange={handleChange} 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none" 
                        required
                      >
                        <option value="">Select a category</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <DollarSign size={16} className="text-gray-400" />
                      </span>
                      <input 
                        type="number" 
                        name="amount" 
                        value={amount} 
                        onChange={handleChange} 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="0.00" 
                        step="0.01" 
                        min="0" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <Clock size={16} className="text-gray-400" />
                      </span>
                      <select 
                        name="period" 
                        value={period} 
                        onChange={handleChange} 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none" 
                        required
                      >
                        {periodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <div className="relative mt-4">
                    <div className="mb-4 ">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={startFromMonthBeginning}
                                    onChange={(e) => setStartFromMonthBeginning(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" 
                                />
                                <span className="text-gray-900">Start from beginning of month</span>
                            </label>
                        </div>
                      
                    </div>
                    
                  </div>
                </div>
                    {!startFromMonthBeginning && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <Calendar size={16} className="text-gray-400" />
                        </span>
                        <input 
                            type="date" 
                            name="startDate" 
                            value={startDate} 
                            onChange={handleChange} 
                            className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            required 
                            min={minDate} 
                            max={maxDate} 
                        />
                        </div>
                    </div>
                    )}
                {(isCustomDate || period === 'custom') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <Calendar size={16} className="text-gray-400" />
                      </span>
                      <input 
                        type="date" 
                        name="endDate" 
                        value={endDate} 
                        onChange={handleChange} 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        required 
                        min={minDate} 
                        max={maxDate} 
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="autoRenew" 
                    name="autoRenew" 
                    checked={autoRenew} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" 
                  />
                  <label htmlFor="autoRenew" className="text-gray-700">
                    Auto-renew when expired
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={closeForm} 
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!title || !amount || !category || !startDate || !endDate || startDate >= endDate }
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
                  >
                    {isEditMode ? <Edit2 size={16} /> : <PlusCircle size={16} />}
                    {isEditMode ? 'Update Budget' : 'Create Budget'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* No Budgets Yet State */}
        {!hasBudgets && monthlyIncomeSet && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <div className="mb-4">
              <FileText size={48} className="mx-auto text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Budgets Created Yet</h2>
            <p className="text-gray-600 mb-6">
              Start by creating your first budget category to track your expenses.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsFormOpen(true)} 
                className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
              >
                <PlusCircle size={16} className="mr-2" /> Create Budget
              </button>
              <button 
                onClick={handleAddExpense} 
                className="border border-blue-600 text-blue-600 rounded-lg px-4 py-2 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
              >
                <DollarSign size={16} className="mr-2" /> Add Expense
              </button>
            </div>
          </div>
        )}

        {/* Budget Dashboard */}
        {hasBudgets && (
          <div className="grid grid-cols-1 gap-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">Total Budgets</h3>
                <p className="text-2xl font-bold">{paginatedBudgets.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500">Monthly Budget</h3>
                <p className="text-2xl font-bold">{monthlyBudget ? formatCurrency(monthlyBudget.amount) : '$0.00'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
                <h3 className="text-sm font-medium text-gray-500">Budget Remaining</h3>
                <p className="text-2xl font-bold">{monthlyBudget ? formatCurrency(getMonthlyBudgetRemaining()) : '$0.00'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500">Critical Budgets</h3>
                <p className="text-2xl font-bold">
                  {filteredBudgets.filter(budget => {
                    if (budget.title === 'Monthly Income') return false;
                    const remaining = getBudgetRemaining(budget);
                    return (remaining / budget.amount) * 100 < 25;
                  }).length}
                </p>
              </div>
            </div>
            
            {/* Monthly Overview */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                  <Calendar className="mr-2" size={18} /> {getActivePeriodLabel()} Overview
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      checked={showActiveOnly} 
                      onChange={() => setShowActiveOnly(!showActiveOnly)} 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" 
                    />
                    Active Budgets Only
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      checked={autoRenewalEnabled} 
                      onChange={() => setAutoRenewalEnabled(!autoRenewalEnabled)} 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" 
                    />
                    Auto Renewal
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Overall Budget Progress */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Overall Budget</h3>
                    <div className="text-sm text-gray-500">
                      {monthlyBudget ? formatCurrency(monthlyBudget.amount) : '$0.00'}
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        monthlyBudgetRemainingPercentage > 75 
                          ? 'bg-green-500' 
                          : monthlyBudgetRemainingPercentage > 50 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`} 
                      style={{ width: `${monthlyBudgetRemainingPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">
                      {monthlyBudgetRemainingPercentage}% remaining
                    </span>
                    <span className="font-semibold">
                      {monthlyBudget ? formatCurrency(getMonthlyBudgetRemaining()) : '$0.00'} left
                    </span>
                  </div>
                </div>
                
                {/* Budget Status */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex flex-col h-full justify-between">
                    <h3 className="font-semibold mb-4">Budget Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Healthy</span>
                        </div>
                        <div className="text-sm font-semibold">
                          {filteredBudgets.filter(budget => {
                            if (budget.title === 'Monthly Income') return false;
                            const remaining = getBudgetRemaining(budget);
                            return (remaining / budget.amount) * 100 >= 50;
                          }).length}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span className="text-sm">Warning</span>
                        </div>
                        <div className="text-sm font-semibold">
                          {filteredBudgets.filter(budget => {
                            if (budget.title === 'Monthly Income') return false;
                            const remaining = getBudgetRemaining(budget);
                            const percentage = (remaining / budget.amount) * 100;
                            return percentage >= 25 && percentage < 50;
                          }).length}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm">Critical</span>
                        </div>
                        <div className="text-sm font-semibold">
                          {filteredBudgets.filter(budget => {
                            if (budget.title === 'Monthly Income') return false;
                            const remaining = getBudgetRemaining(budget);
                            return (remaining / budget.amount) * 100 < 25;
                          }).length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Budget Distribution Chart */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Budget Distribution</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData} 
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Spent" stackId="a" fill="#4299e1" />
                      <Bar dataKey="Remaining" stackId="a" fill="#c6f6d5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Budget Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                  <FileText className="mr-2" size={18} /> Budget Breakdown
                </h2>
                <button 
                  onClick={() => setIsFormOpen(true)} 
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <PlusCircle size={14} className="mr-1" /> Add New
                </button>
              </div>
              <div className="space-y-4">
  {filteredBudgets.filter(budget => budget.title !== 'Monthly Income').length === 0 ? (
    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-100">
      <FileText size={24} className="mx-auto text-gray-400 mb-2" />
      <p className="text-gray-500">No budgets found for the selected period</p>
      {showNoBudgetsMessage && (
    <div className="p-6 text-center bg-gray-50 rounded-lg shadow">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold">No Budgets Created</h3>
        <p className="mt-2 text-gray-600">Create your first budget to start tracking your expenses.</p>
        <button 
            onClick={() => setIsFormOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
            Create New Budget
        </button>
    </div>
)}
    </div>
  ) : (
    filteredBudgets
  .filter(budget => budget.title !== 'Monthly Income')
  .map((budget) => {
    const spent = getBudgetSpent(budget._id, budget.category, new Date(budget.startDate), new Date(budget.endDate));
    const remaining = budget.amount - spent;
    const percentage = Math.max(0, Math.min(100, (remaining / budget.amount) * 100));
    const isExpired = new Date(budget.endDate) < new Date();
    const statusColor = 
      percentage > 50 ? 'bg-green-500' : 
      percentage > 25 ? 'bg-yellow-500' : 
      'bg-red-500';
    
    return (
        
      <div 
        key={budget.id} 
        className={`p-4 rounded-lg shadow-sm border ${isExpired && !budget.autoRenew ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}
      >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-2xl mr-3">
                  {budget.emoji || '💰'}
                </div>
                <div>
                  <h3 className="font-medium">{budget.title}</h3>
                  <p className="text-sm text-gray-500">
                    {getCategoryLabel(budget.category)} • {getPeriodLabel(budget.period)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditBudget(budget)}
                  className="text-gray-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="text-gray-500 hover:text-red-600 p-1.5 rounded-full hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className={`${
                  isExpired && !budget.autoRenew ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {formatCurrency(remaining)} of {formatCurrency(budget.amount)} left
                </span>
                <span className={`${
                  isExpired && !budget.autoRenew ? 'text-gray-500' : 
                  percentage < 25 ? 'text-red-600' : 
                  percentage < 50 ? 'text-yellow-600' : 
                  'text-green-600'
                } font-medium`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${statusColor}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {isExpired && !budget.autoRenew ? (
                    <span className="flex items-center text-red-500">
                      <AlertTriangle size={14} className="mr-1" /> Expired
                    </span>
                  ) : (
                    <span>
                      {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleAddExpense(budget.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <DollarSign size={14} className="mr-1" /> Add Expense
                </button>
              </div>
            </div>
          </div>
        );
      })
  )}
</div>

{/* Pagination controls if needed */}
{paginatedBudgets.length > itemsPerPage && (
  <div className="flex justify-center mt-6">
    <div className="flex space-x-1">
      <button 
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Previous
      </button>
      {[...Array(Math.ceil(paginatedBudgets.length / itemsPerPage))].map((_, i) => (
        <button 
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-3 py-1 rounded ${
            currentPage === i + 1 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button 
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(paginatedBudgets.length / itemsPerPage)))}
        disabled={currentPage === Math.ceil(paginatedBudgets.length / itemsPerPage)}
        className={`px-3 py-1 rounded ${
          currentPage === Math.ceil(paginatedBudgets.length / itemsPerPage) 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Next
      </button>
    </div>
  </div>
)}
</div>

{/* Recent Expenses */}
{/* <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-6">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-lg font-semibold text-blue-600 flex items-center">
      <DollarSign className="mr-2" size={18} /> Recent Expenses
    </h2>
    <button 
      onClick={handleAddExpense}
      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center"
    >
      <PlusCircle size={14} className="mr-1" /> Add Expense
    </button>
  </div>
  
  {recentExpenses.length === 0 ? (
    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-100">
      <DollarSign size={24} className="mx-auto text-gray-400 mb-2" />
      <p className="text-gray-500">No recent expenses found</p>
    </div>
  ) : (
    <div className="space-y-3">
      {recentExpenses.map((expense) => {
        const budget = budgets.find(b => b.id === expense.budgetId);
        return (
          <div key={expense.id} className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-xl mr-3">
                {budget?.emoji || '💰'}
              </div>
              <div>
                <h4 className="font-medium">{expense.description}</h4>
                <p className="text-xs text-gray-500">
                  {budget?.title} • {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</div>
              <div className="text-xs text-gray-500">
                {expense.paymentMethod}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
  
  {allExpenses.length > recentExpensesLimit && (
    <div className="mt-4 text-center">
      <button 
        onClick={() => handleViewAllExpenses()}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        View All Expenses
      </button>
    </div>
  )}
</div> */}
     </div>
                    
                )}
            </main>
    </div>
        </div></>);
};

export default BudgetPage;
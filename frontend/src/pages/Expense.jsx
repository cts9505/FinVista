import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import { ArrowDown,ArrowUp,ArrowUpDown } from 'lucide-react';
import axios from 'axios';
// Custom emoji picker component
const EmojiPicker = ({ onSelect }) => {
    const emojis = [
        '🛒', '🍔', '🏠', '🚗', '💊', '✈️', '📉', '👕', '🎓', '🎮',
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

// Blue Color Palette
const COLORS = ['#00bfff', '#0099cc', '#006699', '#004466', '#002233'];

const ExpensePage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
      
    const { 
        addExpense, 
        getExpense,
        updateExpense,
        expenses, 
        deleteExpense,
        totalExpense 
    } = useGlobalContext();

    // State for form and filtering
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [currentEditExpense, setCurrentEditExpense] = useState(null);
    const [inputState, setInputState] = useState({
        title: '',
        amount: '',
        date:new Date().toISOString(),
        category: '',
        description: '',
        emoji: '🛒'
    });
    const [customCategories, setCustomCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const defaultCategories = [
        "Salary & Business",
        "Investments & Passive Income",
        "Freelance",
        "Gifts & Miscellaneous",
        "Other Income"
    ];
    // Extract unique years from expense history
    useEffect(() => {
        
        const years = [...new Set(
            expenses.map(expense => new Date(expense.date).getFullYear())
        )].sort((a, b) => b - a);
        
        setAvailableYears(years);
        
        // Set to most recent year if current selected year not in list
        if (!years.includes(selectedYear)) {
            setSelectedYear(years[0] || new Date().getFullYear());
        }
    }, [expenses]);
    

    const { title, amount, date, category, description, emoji } = inputState;

    // Filter expenses by selected year
    const filteredExpenses = expenses.filter(expense => 
        new Date(expense.date).getFullYear() === selectedYear
    );

    const [expenseSortField, setExpenseSortField] = useState("date"); // Default sorting by date
    const [expenseSortOrder, setExpenseSortOrder] = useState("desc"); // Default descending order

    const handleExpenseSort = (field) => {
        if (expenseSortField === field) {
            setExpenseSortOrder(expenseSortOrder === "asc" ? "desc" : "asc");
        } else {
            setExpenseSortField(field);
            setExpenseSortOrder("asc");
        }
    };


    const sortedFilteredExpenses = [...filteredExpenses].sort((a, b) => {
        if (expenseSortField === "amount") {
            return expenseSortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
        } else if (expenseSortField === "date") {
            return expenseSortOrder === "asc" 
                ? new Date(a.date) - new Date(b.date) 
                : new Date(b.date) - new Date(a.date);
        } else if (expenseSortField === "category") {
            return expenseSortOrder === "asc" 
                ? a.category.localeCompare(b.category) 
                : b.category.localeCompare(a.category);
        }
        return 0;
    });

    const formatDateWithOrdinal = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        // Add ordinal suffix
        const suffix = getOrdinalSuffix(day);
        
        return `${day}${suffix} ${month} ${year}`;
    };
    
    // Helper function to get ordinal suffix
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
        }
    };
    // Prepare data for bar chart
    const prepareBarChartData = () => {
        const monthlyData = filteredExpenses.reduce((acc, expense) => {
            const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
            const existingMonth = acc.find(item => item.month === month);
            
            if (existingMonth) {
                existingMonth.total += expense.amount;
            } else {
                acc.push({ month, total: expense.amount });
            }
            
            return acc;
        }, []);

        return monthlyData.sort((a, b) => {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });
    };

    // Prepare data for pie chart (expense by category)
    const preparePieChartData = () => {
        const categoryTotals = filteredExpenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {});

        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    };

    // Excel export function
    const exportToExcel = () => {
        const exportData = filteredExpenses.map(expense => ({
            Emoji: expense.emoji || '🛒',
            Title: expense.title,
            Amount: expense.amount,
            Date: new Date(expense.date).toLocaleDateString(),
            Category: expense.category,
            Description: expense.description
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Expense_${selectedYear}`);
        XLSX.writeFile(workbook, `Expense_${selectedYear}.xlsx`);
    };

    // Form handling functions
    const handleInput = (name) => (e) => {
        setInputState({...inputState, [name]: e.target.value});
    };
    const yearlyIncomeTotal = filteredExpenses.reduce((total, income) => 
        total + parseFloat(income.amount), 0
      );
    const monthlyAverage = yearlyIncomeTotal / 12;
    // const handleSubmit = (e) => {
    //     e.preventDefault();
        
    //     const expenseData = {
    //         ...inputState,
    //         date: new Date(inputState.date).toISOString(),
    //         amount: Number(inputState.amount),
    //     };

    //     if (isEditMode && currentEditExpense) {
    //         // Update existing expense
    //         updateExpense(currentEditExpense._id, expenseData);
    //     } else {
    //         // Add new expense
    //         addExpense(expenseData);
    //     }

    //     // Reset form state
    //     setInputState({
    //         title: '',
    //         amount: '',
    //         date: new Date().toISOString(),
    //         category: '',
    //         description: '',
    //         emoji: '🛒'
    //     });
    //     setIsFormOpen(false);
    //     setIsEditMode(false);
    //     setCurrentEditExpense(null);
    // };

    // Edit expense handler
    const handleEditExpense = (expense) => {
        setCurrentEditExpense(expense);
        setInputState({
            title: expense.title,
            amount: expense.amount.toString(),
            date: new Date(expense.date),
            category: expense.category,
            description: expense.description,
            emoji: expense.emoji || '🛒'
        });
        setIsFormOpen(true);
        setIsEditMode(true);
    };

    // Add these state variables at the beginning of your component where other states are defined
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Replace your existing delete button code with this
    const handleDeleteClick = (expenseId) => {
        console.log("Expense ID to delete:", expenseId);
        if (expenseId) {
            setItemToDelete({ _id: expenseId });
            setShowDeleteConfirm(true);
        } else {
            console.error("Invalid expense ID:", expenseId);
        }
    };

    // Add this function for handling the actual deletion
    const confirmDelete = () => {
        if (itemToDelete && itemToDelete._id) {
            deleteExpense(itemToDelete._id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } else {
            console.error("Cannot delete expense: Invalid expense ID");
            // Optionally show an error message to the user
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

// Modify your handleSubmit function to include confirmation for updates
const handleSubmit = (e) => {
    e.preventDefault();
    
    const expenseData = {
        ...inputState,
        date: new Date(inputState.date).toISOString(),
        amount: Number(inputState.amount),
    };

    if (isEditMode && currentEditExpense) {
        // Show update confirmation instead of updating immediately
        setShowUpdateConfirm(true);
    } else {
        // Add new expense (no confirmation needed)
        addExpense(expenseData);
        resetForm();
    }
};

// Add this function to handle confirmed updates
const confirmUpdate = () => {
    const expenseData = {
        ...inputState,
        date: new Date(inputState.date).toISOString(),
        amount: Number(inputState.amount),
    };
    
    updateExpense(currentEditExpense._id, expenseData);
    resetForm();
    setShowUpdateConfirm(false);
};

// Add this function to reset the form state (to avoid code duplication)
const resetForm = () => {
    setInputState({
        title: '',
        amount: '',
        date: new Date().toISOString(),
        category: '',
        description: '',
        emoji: '🛒'
    });
    setIsFormOpen(false);
    setIsEditMode(false);
    setCurrentEditExpense(null);
};

const fetchUserCustomCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const BASE_URL = import.meta.env.VITE_BACKEND_URL;
            const response = await axios.get(`${BASE_URL}/api/user/get-data`);
            
            if (response.data.success && 
                response.data.userData.onboardingData && 
                response.data.userData.onboardingData.customExpenseCategories &&
                response.data.userData.onboardingData.customExpenseCategories.length > 0) {
                
                const categories = response.data.userData.onboardingData.customExpenseCategories.map(
                    category => category.name
                );
                setCustomCategories(categories);
            }
        } catch (error) {
            console.error("Error fetching custom categories:", error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchUserCustomCategories();
    }, []);


// Add these confirmation modals right before the closing </> tag of your return statement
    return (
        <>
        <Sidebar onToggle={setIsSidebarCollapsed} />
        <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-blue-700">Expense Management</h1>
                    <p className="text-gray-500">Track, manage, and analyze your expense sources</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg shadow text-center border border-gray-200">
                    <p className="text-sm text-gray-600">Total Expense for {selectedYear}</p>
                    <span className="text-base font-bold pl-2 text-green-600">₹{yearlyIncomeTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow text-center border border-gray-200">
                    <p className="text-sm text-gray-600">Monthly Average</p>
                    <span className="text-base font-bold pl-2 text-blue-600">₹{(monthlyAverage).toFixed(2)}</span>
                    </div>
                </div>
                </div>


            {/* Year Selection and Add Expense */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <label className="text-lg font-semibold text-blue-600">Select Year:</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="p-2 border rounded bg-blue-50 text-blue-600"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={() => {
                        setIsFormOpen(true);
                        setIsEditMode(false);
                        setCurrentEditExpense(null);
                        setInputState({
                            title: '',
                            amount: '',
                            date: new Date(),
                            category: '',
                            description: '',
                            emoji: '🛒'
                        });
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                >
                    ➕ Add Expense
                </button>
            </div>

            {/* Charts Container */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly Expense Bar Chart */}
                <div className="bg-white shadow-md rounded-lg p-6 border-2 border-blue-200">
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">Monthly Expenses</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareBarChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="month" stroke="#0099cc" />
                            <YAxis stroke="#0099cc" />
                            <Tooltip />
                            <Bar dataKey="total" fill="#0099cc" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Expense by Category Pie Chart */}
                <div className="bg-white shadow-md rounded-lg p-6 border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-blue-600">Expense by Category</h2>
                        <button 
                            onClick={exportToExcel}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                        >
                            📥 Export to Excel
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={preparePieChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#00bfff"
                                dataKey="value"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {preparePieChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense History Table */}
            <div className="bg-white shadow-md rounded-lg p-6 mt-6 border-2 border-blue-200">
                <h2 className="text-2xl font-bold mb-4 text-blue-600">Expense History</h2>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                    <thead>
                    <tr className="bg-blue-200">
                        <th className="p-2 text-left">Title</th>
                        
                        <th className="p-2 text-left cursor-pointer" onClick={() => handleExpenseSort("amount")}>
                            <div className="flex flex-row items-center">
                                Amount <span className="ml-2">{expenseSortField === "amount" ? (expenseSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                            </div>
                        </th>

                        <th className="p-2 text-left cursor-pointer" onClick={() => handleExpenseSort("date")}>
                            <div className="flex flex-row items-center">
                                Date <span className="ml-2">{expenseSortField === "date" ? (expenseSortOrder === "asc" ? <ArrowUp size={20} /> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                            </div>
                        </th>

                        <th className="p-2 text-left cursor-pointer" onClick={() => handleExpenseSort("category")}>
                            <div className="flex flex-row items-center">
                                Category <span className="ml-2">{expenseSortField === "category" ? (expenseSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                            </div>
                        </th>

                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-right">Actions</th>
                    </tr>

                    </thead>
                        <tbody>
                        {sortedFilteredExpenses.map((expense) => (
                            <tr key={expense._id} className="border-b hover:bg-purple-50">
                                <td className="p-2 flex items-center">
                                <span className="mr-2 text-xl">{expense.emoji || '💼'}</span>
                                {expense.title}
                                </td>
                                <td className="p-2">₹{expense.amount.toFixed(2)}</td>
                                <td className="p-2">
                                {formatDateWithOrdinal(expense.date)}
                                </td>
                                <td className="p-2">
                                {expense.category}
                                </td>
                                <td className="p-2">
                                {expense.description}
                                </td>
                                <td className="p-2 text-right space-x-2">
                                <button 
                                    onClick={() => handleEditExpense(expense)}
                                    className="text-purple-500 hover:text-purple-700"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(expense._id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    🗑️
                                </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full relative border-2 border-blue-300">
                        <button 
                            onClick={() => {
                                setIsFormOpen(false);
                                setIsEditMode(false);
                                setCurrentEditExpense(null);
                            }}
                            className="absolute top-4 right-4 text-2xl"
                        >
                            ✖️
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-blue-600">
                            {isEditMode ? 'Edit Expense' : 'Add Expense'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('emoji-picker').classList.toggle('hidden')}
                                        className="text-3xl"
                                    >
                                        {emoji}
                                    </button>
                                    <input
                                        type="text"
                                        value={title}
                                        name="title"
                                        placeholder="(Pickup custom Emoji) Expense Title"
                                        onChange={handleInput('title')}
                                        className="flex-grow p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div id="emoji-picker" className="hidden">
                                    <EmojiPicker 
                                        onSelect={(selectedEmoji) => {
                                            setInputState({...inputState, emoji: selectedEmoji});
                                            document.getElementById('emoji-picker').classList.add('hidden');
                                        }}
                                    />
                                </div>
                                <input
                                    type="number"
                                    value={amount}
                                    name="amount"
                                    placeholder="Expense Amount"
                                    onChange={handleInput('amount')}
                                    className="w-full p-2 border rounded"
                                    required
                                    step="0.01"
                                />
                                <DatePicker
                                    selected={date}
                                    onChange={(selectedDate) => setInputState({...inputState, date: selectedDate})}
                                    className="w-full p-2 border rounded"
                                    dateFormat="dd/MM/yyyy"
                                />
                                <select 
                                    value={category}
                                    name="category"
                                    onChange={handleInput('category')}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="" disabled>Select Category </option>
                                    {/* {customCategories.length > 0 && (
                                        <option value="" disabled className='text-white'>(Custom Option's Selected at time of Onboarding)</option>
                                    )} */}
                                    {/* Display custom categories if available */}
                                    {customCategories.length > 0 ? (
                                        customCategories.map((cat, index) => (
                                            <option key={`custom-${index}`} value={cat}>{cat}</option>
                                        ))
                                    ) : (
                                        // Otherwise, display default categories
                                        defaultCategories.map((cat, index) => (
                                            <option key={`default-${index}`} value={cat}>{cat}</option>
                                        ))
                                    )}
                                </select>
                                <textarea
                                    value={description}
                                    name="description"
                                    placeholder="Description (if any)"
                                    onChange={handleInput('description')}
                                    className="w-full p-2 border rounded"
                                    
                                />
                                <button 
                                    type="submit" 
                                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full relative border-2 border-red-300">
                    <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete?</h2>
                    <p className="mb-6">Are you sure you want to delete this expense?</p>
                    <div className="flex space-x-4 justify-end">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

{/* Update Confirmation Modal */}
{showUpdateConfirm && (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full relative border-2 border-blue-300">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Confirm Update?</h2>
            <p className="mb-6">Are you sure you want to update this expense?</p>
            <div className="flex space-x-4 justify-end">
                <button 
                    onClick={() => setShowUpdateConfirm(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmUpdate}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Update
                </button>
            </div>
        </div>
    </div>
)}
    </>);
};

export default ExpensePage;
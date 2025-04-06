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
import axios from 'axios';
// Custom emoji picker component
const EmojiPicker = ({ onSelect }) => {
    const emojis = [
        '📈', '💼', '💰', '📊', '💻', '🏠', '🚀',  '🎨', '🎬', '💵'
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

// Pie Chart Colors - Purple Palette 
const COLORS = ['#793698', '#9744be', '#ac68cc', '#c18eda', '#d6b4e7'];

const IncomePage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
      
    const { 
        addIncome, 
        updateIncome,
        incomes, 
        deleteIncome,
    } = useGlobalContext();

    // State for form and filtering
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [currentEditIncome, setCurrentEditIncome] = useState(null);
    const [inputState, setInputState] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString(),
        category: '',
        description: '',
        emoji: '💵'
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

    // Extract unique years from income history
    useEffect(() => {
            
        const years = [...new Set(
            incomes.map(income => new Date(income.date).getFullYear())
        )].sort((a, b) => b - a);
        
        setAvailableYears(years);
        
        // Set to most recent year if current selected year not in list
        if (!years.includes(selectedYear)) {
            setSelectedYear(years[0] || new Date().getFullYear());
        }
    }, [incomes]);

    const { title, amount, date, category, description, emoji } = inputState;

    // Filter incomes by selected year
    const filteredIncomes = incomes.filter(income => 
        new Date(income.date).getFullYear() === selectedYear
    );

    // Sort filtered incomes by date (most recent first)
    const [sortField, setSortField] = useState("date"); // Default sorting by date
    const [sortOrder, setSortOrder] = useState("desc"); // Default descending order

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedFilteredIncomes = [...filteredIncomes].sort((a, b) => {
        if (sortField === "amount") {
            return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
        } else if (sortField === "date") {
            return sortOrder === "asc" 
                ? new Date(a.date) - new Date(b.date) 
                : new Date(b.date) - new Date(a.date);
        } else if (sortField === "category") {
            return sortOrder === "asc" 
                ? a.category.localeCompare(b.category) 
                : b.category.localeCompare(a.category);
        }
        return 0;
    });

// Format date with ordinal suffix
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
        const monthlyData = filteredIncomes.reduce((acc, income) => {
            const month = new Date(income.date).toLocaleString('default', { month: 'short' });
            const existingMonth = acc.find(item => item.month === month);
            
            if (existingMonth) {
                existingMonth.total += income.amount;
            } else {
                acc.push({ month, total: income.amount });
            }
            
            return acc;
        }, []);

        return monthlyData.sort((a, b) => {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });
    };

    // Prepare data for pie chart (income by category)
    const preparePieChartData = () => {
        const categoryTotals = filteredIncomes.reduce((acc, income) => {
            if (!acc[income.category]) {
                acc[income.category] = 0;
            }
            acc[income.category] += income.amount;
            return acc;
        }, {});

        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    };

    // Excel export function
    const exportToExcel = () => {
        const exportData = filteredIncomes.map(income => ({
            Emoji: income.emoji || '💵',
            Title: income.title,
            Amount: income.amount,
            Date: new Date(income.date).toLocaleDateString(),
            Category: income.category,
            Description: income.description
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Income_${selectedYear}`);
        XLSX.writeFile(workbook, `Income_${selectedYear}.xlsx`);
    };

    // Form handling functions
    const handleInput = (name) => (e) => {
        setInputState({...inputState, [name]: e.target.value});
    };

    const yearlyIncomeTotal = filteredIncomes.reduce((total, income) => 
        total + parseFloat(income.amount), 0
      );
    const monthlyAverage = yearlyIncomeTotal / 12;

    // const handleSubmit = (e) => {
    //     e.preventDefault();
        
    //     const incomeData = {
    //         ...inputState,
    //         date: new Date(inputState.date).toISOString(),
    //         amount: Number(inputState.amount),
    //     };
    //     if (isEditMode && currentEditIncome) {
    //         // Update existing income
    //         updateIncome(currentEditIncome._id, incomeData);

    //     } else {
    //         // Add new income
    //         addIncome(incomeData);
            
    //     }

    //     // Reset form state
    //     setInputState({
    //         title: '',
    //         amount: '',
    //         date: new Date().toISOString(),
    //         category: '',
    //         description: '',
    //         emoji: '💵'
    //     });
    //     setIsFormOpen(false);
    //     setIsEditMode(false);
    //     setCurrentEditIncome(null);
    // };

    // Edit income handler
    const handleEditIncome = (income) => {
        setCurrentEditIncome(income);
        setInputState({
            title: income.title,
            amount: income.amount.toString(),
            date: new Date(income.date),
            category: income.category,
            description: income.description,
            emoji: income.emoji || '💵'
        });
        setIsFormOpen(true);
        setIsEditMode(true);
    };

        // Add these state variables at the beginning of your IncomePage component where other states are defined
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Replace your existing delete button code with this
    const handleDeleteClick = (income) => {
        setItemToDelete(income);
        setShowDeleteConfirm(true);
    };

    // Add this function for handling the actual deletion
    const confirmDelete = () => {
        if (itemToDelete) {
            deleteIncome(itemToDelete._id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    // Modify your handleSubmit function to include confirmation for updates
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const incomeData = {
            ...inputState,
            date: new Date(inputState.date).toISOString(),
            amount: Number(inputState.amount),
        };

        if (isEditMode && currentEditIncome) {
            // Show update confirmation instead of updating immediately
            setShowUpdateConfirm(true);
        } else {
            // Add new income (no confirmation needed)
            addIncome(incomeData);
            resetForm();
        }
    };

    // Add this function to handle confirmed updates
    const confirmUpdate = () => {
        const incomeData = {
            ...inputState,
            date: new Date(inputState.date).toISOString(),
            amount: Number(inputState.amount),
        };
        
        updateIncome(currentEditIncome._id, incomeData);
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
            emoji: '💰'
        });
        setIsFormOpen(false);
        setIsEditMode(false);
        setCurrentEditIncome(null);
    };

    const fetchUserCustomCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const BASE_URL = import.meta.env.VITE_BACKEND_URL;
            const response = await axios.get(`${BASE_URL}/api/user/get-data`);
            
            if (response.data.success && 
                response.data.userData.onboardingData && 
                response.data.userData.onboardingData.customIncomeCategories &&
                response.data.userData.onboardingData.customIncomeCategories.length > 0) {
                
                const categories = response.data.userData.onboardingData.customIncomeCategories.map(
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


    return (
        <>
        <Sidebar onToggle={setIsSidebarCollapsed} />
        <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-purple-700">Income Management</h1>
                    <p className="text-gray-500">Track, manage, and analyze your income sources</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg shadow text-center border border-gray-200">
                    <p className="text-sm text-gray-600">Total Income for {selectedYear}</p>
                    <span className="text-base font-bold pl-2 text-green-600">₹{yearlyIncomeTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow text-center border border-gray-200">
                    <p className="text-sm text-gray-600">Monthly Average</p>
                    <span className="text-base font-bold pl-2 text-blue-600">₹{(monthlyAverage).toFixed(2)}</span>
                    </div>
                </div>
                </div>
            {/* Year Selection and Add Income */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <label className="text-lg font-semibold text-purple-700">Select Year:</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="p-2 border rounded bg-purple-50 text-purple-500"
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
                        setCurrentEditIncome(null);
                        setInputState({
                            title: '',
                            amount: '',
                            date: new Date(),
                            category: '',
                            description: '',
                            emoji: '💼'
                        });
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
                >
                    ➕ Add Income
                </button>
            </div>

            {/* Charts Container */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly Income Bar Chart */}
                <div className="bg-white shadow-md rounded-lg p-6 border-2 border-purple-200">
                    <h2 className="text-2xl font-bold mb-4 text-purple-700">Monthly Income</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareBarChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="month" stroke="#9744be" />
                            <YAxis stroke="#9744be" />
                            <Tooltip />
                            <Bar dataKey="total" fill="#ac59cc" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Income by Category Pie Chart */}
                <div className="bg-white shadow-md rounded-lg p-6 border-2 border-purple-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-purple-700">Income by Category</h2>
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
                                fill="#8884d8"
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

            {/* Income History Table */}
            <div className="bg-white shadow-md rounded-lg p-6 mt-6 border-2 border-purple-200">
                <h2 className="text-2xl font-bold mb-4 text-purple-800">Income History</h2>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="bg-purple-200">
                            <th className="p-2 text-left">Title</th>
                            <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("amount")}>
                                Amount {sortField === "amount" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : "↕️"}
                            </th>
                            <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("date")}>
                                Date {sortField === "date" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : "↕️"}
                            </th>
                            <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("category")}>
                                Category {sortField === "category" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : "↕️"}
                            </th>
                            <th className="p-2 text-left">Description</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>

                        <tbody>
                            {sortedFilteredIncomes.map((income) => (
                            <tr key={income._id} className="border-b hover:bg-purple-50">
                                <td className="p-2 flex items-center">
                                <span className="mr-2 text-xl">{income.emoji || '💵'}</span>
                                {income.title}
                                </td>
                                <td className="p-2">₹{income.amount.toFixed(2)}</td>
                                <td className="p-2">
                                {formatDateWithOrdinal(income.date)}
                                </td>
                                <td className="p-2">
                                {income.category}
                                </td>
                                <td className="p-2">
                                {income.description}
                                </td>
                                <td className="p-2 text-right space-x-2">
                                <button 
                                    onClick={() => handleEditIncome(income)}
                                    className="text-purple-500 hover:text-purple-700"
                                >
                                    ✏️
                                </button>
                                <button 
                                        onClick={() => handleDeleteClick(income)}
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

            {/* Income Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full relative border-2 border-purple-300">
                        <button 
                            onClick={() => {
                                setIsFormOpen(false);
                                setIsEditMode(false);
                                setCurrentEditIncome(null);
                            }}
                            className="absolute top-4 right-4 text-2xl"
                        >
                            ✖️
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-purple-600">
                            {isEditMode ? 'Edit Income' : 'Add Income'}
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
                                        placeholder="(Pickup custom Emoji) Income Title"
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
                                    placeholder="Income Amount"
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
                                    <option value="" disabled>Select Category</option>
                                    
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
                                    className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center justify-center"
                                >
                                    Add Income
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
                        <p className="mb-6">Are you sure you want to delete this income record?</p>
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
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full relative border-2 border-green-300">
                        <h2 className="text-xl font-bold mb-4 text-green-600">Confirm Update?</h2>
                        <p className="mb-6">Are you sure you want to update this income record?</p>
                        <div className="flex space-x-4 justify-end">
                            <button 
                                onClick={() => setShowUpdateConfirm(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmUpdate}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </>);
};

export default IncomePage;
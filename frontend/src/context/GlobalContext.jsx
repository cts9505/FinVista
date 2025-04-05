import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, Mail, ShieldCheck, Key } from 'lucide-react'
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const GlobalContext = createContext();  // ✅ Named export

export const GlobalContextProvider = ({ children }) => {
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [bills, setBills] = useState([]);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [error, setError] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [userData, setUserData] = useState(null);
    const addIncome = async (income) => {
        try {
        const response = await axios.post(`${BASE_URL}/api/auth/add-income`, income);

        if (response && response.data) {
            getIncomes(); 
            // console.log("Respnose:", response);
            toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
            return response.data;
           
        } else {
            throw new Error("Invalid response from server");
        }
    } catch (err) {
        console.error("Error adding income:", err);

        // Handle cases where err.response is undefined
        toast.error(err.response?.data?.message || "An unexpected error occurred.");
        setError(err.response?.data?.message || "An unexpected error occurred.");
    }
    };

    const getIncomes = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/auth/get-incomes`);
            if (response?.data?.incomes) {
                const processedIncomes = response.data.incomes.map(income => ({
                    ...income,
                    date: new Date(income.date),  // Ensure date is a Date object
                    type: 'income'
                }));
                setIncomes(processedIncomes);
                setTotalIncome(processedIncomes.reduce((sum, income) => sum + (income.amount || 0), 0));
            } else {
                console.error("Invalid response format:", response);
                toast.error("Invalid API response format for incomes.");
                setError("Invalid API response format for incomes.");
            }
        } catch (err) {
            console.error("Error fetching incomes:", err);
            // toast.error(err.response?.data?.message || "Failed to fetch incomes.");
            setError(err.response?.data?.message || "Failed to fetch incomes.");
            
        }
    };

    const updateIncome = async (incomeId, updatedIncome) => {
        try {
            const response = await axios.put(`${BASE_URL}/api/auth/update-income/${incomeId}`, updatedIncome);
    
            if (response && response.data) {
                console.log(response.data.message);
                getIncomes(); // Refresh incomes list after updating
                // console.log("Response:", response);
                toast.success(response.data.message, {
                    icon: <CheckCircle2 className="text-green-500" />
                  })
                return response.data;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error updating income:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };
    
    // Similar modification for getExpenses
   
    const deleteIncome = async (id) => {
        try{
            const response= await axios.delete(`${BASE_URL}/api/auth/delete-income/${id}`);
        getIncomes();
        toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
    }
        catch(err){
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const addExpense = async (expense) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/add-expense`, expense);
    
            if (response && response.data) {
                getExpenses(); 
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                // console.log("Respnose:", response);
                return response.data;
               
            } else {
                throw new Error("Invalid response from server");
            }
            
        } catch (err) {
            console.error("Error adding income:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            // Handle cases where err.response is undefined
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const getExpenses = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/auth/get-expenses`);
            if (response?.data?.expenses) {
                const processedExpenses = response.data.expenses.map(expense => ({
                    ...expense,
                    date: new Date(expense.date),  // Ensure date is a Date object
                    type: 'expense'
                }));
                setExpenses(processedExpenses);
                setTotalExpenses(processedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0));
                
                // Add this line to return the processed expenses
                return processedExpenses;
            } else {
                console.error("Invalid response format:", response);
                toast.error("Invalid API response format for expenses.");
                setError("Invalid API response format for expenses.");
                return []; // Return empty array instead of undefined
            }
        } catch (err) {
            console.error("Error fetching expenses:", err);
            // toast.error(err.response?.data?.message || "Failed to fetch expenses.");
            setError(err.response?.data?.message || "Failed to fetch expenses.");
            return []; // Return empty array instead of undefined
        }
    };

    const updateExpense= async (expenseId, updatedExpense) => {
        try {
            const response = await axios.put(`${BASE_URL}/api/auth/update-expense/${expenseId}`, updatedExpense);

            if (response && response.data) {
                getExpenses(); // Refresh incomes list after updating
                // console.log("Response:", response);
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                return response.data;
            } else {
                toast.error(response.message);
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error updating expense:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };


// Similar modification for getExpenses
    const deleteExpense = async (id) => {
        try{const response = await axios.delete(`${BASE_URL}/api/auth/delete-expense/${id}`);
        getExpenses();
        console.log(response.message);
        toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
    }
        catch(err){
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const addBill = async (bill) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/add-bill`, bill);
            if (response && response.data) {
                getBills();
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                return response.data;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error adding bill:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const getBills = async () => {
        try {
            
            const response = await axios.get(`${BASE_URL}/api/auth/get-bills`);
            if (response?.data?.bills) {
                setBills(response.data.bills);
            } else {
                console.error("Invalid response format:", response);
                toast.error("Invalid API response format for bills.");
                setError("Invalid API response format for bills.");
            }
        } catch (err) {
            console.error("Error fetching bills:", err);
            setError(err.response?.data?.message || "Failed to fetch bills.");
        }
    };

    const updateBill = async (billId, updatedBill) => {
        try {
            const response = await axios.put(`${BASE_URL}/api/auth/update-bill/${billId}`, updatedBill);
            if (response && response.data) {
                getBills(); 
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                return response.data;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error updating bill:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const deleteBill = async (id) => {
        try {
            const response = await axios.delete(`${BASE_URL}/api/auth/delete-bill/${id}`);
            getBills();
            toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
        } catch (err) {
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
        }
    };


    const addBudget = async (budget) => {
        try {
            
            const response = await axios.post(`${BASE_URL}/api/auth/add-budget`, budget);
            
            if (response && response.data) {
                getBudgets();
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                return response.data;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error adding budget:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    // In AppContext.jsx
    const getBudgets = async () => {
        try {
        const response = await axios.get(`${BASE_URL}/api/auth/get-budgets`);
        if (response.data.success) {
            // Make sure you're setting the state with the budgets array
            setBudgets(response.data.budgets);
            return response.data.budgets;
        } else {
            console.error("Failed to fetch budgets:", response.data.message);
            return [];
        }
        } catch (error) {
        console.error("Error fetching budgets:", error);
        return [];
        }
    };

    const updateBudget = async (budgetId, updatedBudget) => {
        try {
            const response = await axios.put(`${BASE_URL}/api/auth/update-budget/${budgetId}`, updatedBudget);

            if (response && response.data) {
                getBudgets();
                toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
                return response.data;
            } else {
                toast.error(response.message);
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Error updating budget:", err);
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
            setError(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    const deleteBudget = async (id) => {
        try {
            const response = await axios.delete(`${BASE_URL}/api/auth/delete-budget/${id}`);
            getBudgets();
            toast.success(response.data.message, {
                icon: <CheckCircle2 className="text-green-500" />
              })
        } catch (err) {
            toast.error(err.response?.data?.message || "An unexpected error occurred.");
        }
    };

    // Helper function to update budget tracking when new expenses are added
    const updateBudgetTracking = (expense) => {
        // Find all budgets that match this expense's category and date range
        const matchingBudgets = budgets.filter(budget => {
            const budgetStartDate = new Date(budget.startDate);
            const budgetEndDate = new Date(budget.endDate);
            const expenseDate = new Date(expense.date);
            
            return budget.category === expense.category && 
                   expenseDate >= budgetStartDate && 
                   expenseDate <= budgetEndDate;
        });
    };

    const checkPremiumStatus = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/auth/check-premium-status`);
          if (response.data.success) {
            setIsPremium(response.data.isPremium);
            setSubscriptionData({
              type: response.data.subscriptionType,
              endDate: response.data.subscriptionType === 'trial' ? 
                response.data.trialEndDate : response.data.subscriptionEndDate,
              daysRemaining: response.data.daysRemaining
            });
          }
        } catch (err) {
          console.error("Error checking premium status:", err);
        }
      };

    const totalBalance = () => totalIncome - totalExpenses;

    const transactionHistory = () => {
        return [...incomes, ...expenses]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
    };

    const getUserData = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/user/get-data`);
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

    useEffect(() => {
        getUserData();
        getIncomes();
        getExpenses();
        getBudgets();
        getBills();
        checkPremiumStatus();
    }, []); // Fetch data on component mount

    return (
        <GlobalContext.Provider
            value={{
                getUserData,
                userData,
                addIncome,
                getIncomes,
                updateIncome,
                addBudget,
                getBudgets,
                setBudgets,
                budgets,
                updateBudget,
                deleteBudget,
                updateBudgetTracking,
                incomes,
                deleteIncome,
                expenses,
                totalIncome,
                addExpense,
                getExpenses,
                updateExpense,
                deleteExpense,
                totalExpenses,
                bills,  // ✅ Expose bills state
                addBill,  // ✅ Expose bill functions
                getBills,
                updateBill,
                deleteBill,
                totalBalance,
                transactionHistory,
                error,
                setError,
                isPremium,
                subscriptionData,
                checkPremiumStatus,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

// ✅ Custom Hook for Using Context
export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error("useGlobalContext must be used within a GlobalProvider");
    }
    return context;
};

import ExpenseModel from "../models/ExpenseModel.js";
import mongoose from "mongoose";
// Add Expense
export const addExpense = async (req, res) => {
    try {
        const { title,emoji, amount, category, description, date } = req.body;
        const userId = req.userId; // Extracted from middleware
        
        if (!userId) {
            return res.json({ success: false, message: "User ID Required! Please Login" });
        }

        // Validations
        if (!title ) {
            return res.json({ success: false, message: 'Title is required!' });
        }
        if(!date){
            return res.json({ success: false, message: 'Date is required!' });
        }
        if(!category){
            return res.json({ success: false, message: 'Category is required!' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.json({ success: false, message: "Enter a valid amount!" });
        }

        const expense = new ExpenseModel({
            userId, 
            title,
            emoji,
            amount,
            category,
            description,
            date
        });

        await expense.save();
        res.json({ success: true, message: "Expense Added Successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Expenses for Logged-in User
export const getExpense = async (req, res) => {
    try {
        const userId = req.userId; // Extracted from middleware
        if (!userId) {
            return res.json({ success: false, message: "User ID Required! Please Login" });
        }

        const expenses = await ExpenseModel.find({ userId }).sort({ createdAt: -1 }); // Fetch user-specific expenses
        res.json({ success: true, expenses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete Expense by ID
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedExpense = await ExpenseModel.findByIdAndDelete(id);

        if (!deletedExpense) {
            return res.json({ success: false, message: "Expense Not Found!" });
        }

        res.json({ success: true, message: "Expense Deleted Sucessfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const updateExpenseController = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ message: "Invalid expense ID" });
        }

        const updatedExpense = await ExpenseModel.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedExpense) {
            return res.json({ message: "Expense not found" });
        }

        res.json({
            success: true,
            message: "Expense Updated Successfully",
            updatedExpense,
        });
    } catch (error) {
        console.error("Error updating expense:", error.message);
        res.json({ message: "Server error", error: error.message });
    }
};
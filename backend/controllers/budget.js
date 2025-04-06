import BudgetModel from "../models/BudgetModel.js";
import mongoose from 'mongoose';

export const addBudget = async (req, res) => {
    try {
        const { title, emoji, amount, category, period,autoRenew ,startDate,endDate} = req.body;
        const userId = req.userId; // Extracted from middleware
        
        if (!userId) {
            return res.json({ success: false, message: 'User ID Required! Please Login' });
        }
        
        // Validations
        if (!title) {
            return res.json({ success: false, message: 'Title is required!' });
        }
        if (!period) {
            return res.json({ success: false, message: 'Period range is required!' });
        }
        if (!category) {
            return res.json({ success: false, message: 'Category is required!' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.json({ success: false, message: 'Amount must be a positive number!' });
        }

        const budget = new BudgetModel({
            userId,
            title,
            emoji,
            amount,
            category,
            period,
            autoRenew,
            startDate,
            endDate
        });

        await budget.save();
        res.json({ success: true, message: 'Budget Created Successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Budgets for Logged-in User
export const getBudgets = async (req, res) => {
    try {
        const userId = req.userId; // Extracted from middleware
        
        if (!userId) {
            return res.json({ success: false, message: 'User ID Required! Please Login' });
        }

        const budgets = await BudgetModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, budgets });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete Budget by ID
export const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBudget = await BudgetModel.findByIdAndDelete(id);

        if (!deletedBudget) {
            return res.json({ success: false, message: 'Budget Not Found!' });
        }

        res.json({ success: true, message: 'Budget Deleted Successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update Budget by ID
export const updateBudget = async (req, res) => {
    try {
        const { id } = req.body;
        const updatedData = req.body;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid budget ID" });
        }

        const updatedBudget = await BudgetModel.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedBudget) {
            return res.json({ success: false, message: "Budget not found" });
        }

        res.json({
            success: true,
            message: "Budget Updated Successfully",
            updatedBudget
        });
    } catch (error) {
        console.error("Error updating budget:", error.message);
        res.json({ success: false, message: "Server error", error: error.message });
    }
};

// Get Budget Spending (In a real app, this would calculate actual spending from expenses)
export const getBudgetSpending = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid budget ID" });
        }
        
        // First verify the budget exists and belongs to the user
        const budget = await BudgetModel.findOne({ _id: id, userId });
        
        if (!budget) {
            return res.json({ success: false, message: "Budget not found" });
        }
        
        // In a real implementation, you would:
        // 1. Get all expenses within the budget date range and category
        // 2. Sum up the total spent
        // For demo purposes, we'll return a mock calculation
        
        // This is a placeholder - you'd replace this with actual query logic
        const totalSpent = Math.random() * budget.amount; // Random amount for demo
        
        res.json({
            success: true,
            budget: {
                _id: budget._id,
                title: budget.title,
                amount: budget.amount,
                spent: totalSpent,
                remaining: budget.amount - totalSpent
            }
        });
    } catch (error) {
        console.error("Error getting budget spending:", error.message);
        res.json({ success: false, message: "Server error", error: error.message });
    }
};
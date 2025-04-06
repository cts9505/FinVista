import IncomeModel from "../models/IncomeModel.js"
import mongoose from 'mongoose';

export const addIncome = async (req, res) => {
    try {
        const { title,emoji, amount, category, description, date } = req.body;
        const userId = req.userId; // Extracted from middleware
        if (!userId) {
            return res.json({ success: false, message: 'User ID Required! Please Login' });
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
            return res.json({ success: false, message: 'Amount must be a positive number!' });
        }

        const income = new IncomeModel({
            userId, // Store userId instead of email
            title,
            emoji,
            amount,
            category,
            description,
            date
        });

        await income.save();
        res.json({ success: true, message: 'Income Added Successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Incomes for Logged-in User
export const getIncomes = async (req, res) => {
    try {
        const userId = req.userId; // Extracted from middleware
        if (!userId) {
            return res.json({ success: false, message: 'User ID Required! Please Login' });
        }

        const incomes = await IncomeModel.find({ userId }).sort({ createdAt: -1 }); // Fetch user-specific incomes
        res.json({ success: true, incomes });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete Income by ID
export const deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedIncome = await IncomeModel.findByIdAndDelete(id);

        if (!deletedIncome) {
            return res.json({ success: false, message: 'Income Not Found!' });
        }

        res.json({ success: true, message: 'Income Deleted Sucessfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const updateIncomeController = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ message: "Invalid income ID" });
        }

        const updatedIncome = await IncomeModel.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedIncome) {
            return res.json({ message: "Income not found" });
        }

        res.json({
            success: true,
            message: "Income Updated Successfully",
            updatedIncome
        });
    } catch (error) {
        console.error("Error updating income:", error.message);
        res.json({ message: "Server error", error: error.message });
    }
};

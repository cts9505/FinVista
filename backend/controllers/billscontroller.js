import BillModel from "../models/BillModel.js";
import mongoose from "mongoose";

// Add Bill
export const addBill = async (req, res) => {

    try {
        const { name, emoji, amount, description, reminderDays, recurrence, dueDate, type } = req.body;  // ✅ Extract all fields
        const userId = req.userId; // Extracted from middleware
        
        if (!userId) {
            return res.json({ success: false, message: "User ID Required! Please Login" });
        }

        // Validations
        if (!name) {
            return res.json({ success: false, message: "Title is required!" });
        }
    
        if (typeof amount !== "number" || amount <= 0) {
            return res.json({ success: false, message: "Enter a valid amount!" });
        }
        if (typeof reminderDays !== "number" || reminderDays < 1 || reminderDays > 30) {
            return res.json({ success: false, message: "Reminder days must be between 1 and 30!" });
        }
        if (!recurrence) {
            return res.json({ success: false, message: "Recurrence is required!" });
        }
        if (!dueDate) {
            return res.json({ success: false, message: "Due date is required!" });
        }
        if (!type) {
            return res.json({ success: false, message: "Type is required!" });
        }

        const bill = new BillModel({
            userId, // Store userId instead of email
            name,
            emoji,
            amount,
            description,
            reminderDays,  
            recurrence,   // ✅ Now included
            dueDate,      // ✅ Now included
            type          // ✅ Now included
        });

        await bill.save();
        res.json({ success: true, message: "Bill Added Successfully", bill });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Server Error: " + error.message });
    }
};

// Get Bills for Logged-in User
export const getBill = async (req, res) => {
    try {
        const userId = req.userId; // Extracted from middleware
        if (!userId) {
            return res.json({ success: false, message: "User ID Required! Please Login" });
        }

        const bills = await BillModel.find({ userId }).sort({ createdAt: -1 }); // Fetch user-specific Bills
        res.json({ success: true, bills });
    } catch (error) {
        res.json({ success: false, message: "Server Error", error: error.message });
    }
};

// Delete Bill by ID
export const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid Bill ID" });
        }

        const deletedBill = await BillModel.findByIdAndDelete(id);

        if (!deletedBill) {
            return res.json({ success: false, message: "Bill Not Found!" });
        }

        res.json({ success: true, message: "Bill Deleted Successfully" });
    } catch (error) {
        res.json({ success: false, message: "Server Error", error: error.message });
    }
};

// Update Bill
export const updateBillController = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid Bill ID" });
        }

        const updatedBill = await BillModel.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedBill) {
            return res.json({ success: false, message: "Bill not found" });
        }

        res.json({ success: true, message: "Bill Updated Successfully", updatedBill });
    } catch (error) {
        res.json({ success: false, message: "Server Error", error: error.message });
    }
};

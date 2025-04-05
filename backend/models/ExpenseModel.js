import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true
    },
    emoji:{
        type:String
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    amount: {
        type: Number,
        required: true,
        maxLength: 20,
        trim: true
    },
    type: {
        type: String,
        default:"expense"
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        maxLength: 50,
        trim: true
    },
}, {timestamps: true})

const ExpenseModel = mongoose.model('Expense', ExpenseSchema)

export default ExpenseModel;
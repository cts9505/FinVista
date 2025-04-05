import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    emoji: {
        type: String,
        default: '💰'
    },
    period:{
        type: String,
        required: true
    },
    autoRenew:{
        type: Boolean,
        default: false
    },
    startDate: { 
        type: Date, 
        required: true },
    endDate: { 
        type: Date, 
        required: true 
    }
}, { timestamps: true });

const BudgetModel = mongoose.model('Budget', BudgetSchema);

export default BudgetModel;
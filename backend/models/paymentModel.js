import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
        default: 'created'
    },
    plan: {
        type: String,
        enum: ['monthly', 'annually'],
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'razorpay'
    },
    subscriptionStartDate: {
        type: Date,
        required: true
    },
    subscriptionEndDate: {
        type: Date,
        required: true
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundId: {
        type: String,
        default: null
    },
    refundDate: {
        type: Date,
        default: null
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { 
    timestamps: true
});

const paymentModel = mongoose.model('Payments', paymentSchema);

export default paymentModel;
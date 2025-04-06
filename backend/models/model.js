import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
    loginAt: {
        type: Date,
        default: Date.now
    },
    loginMethod:{
        type:String
    },
    ipAddress: {
        type: String,
        required: true
    },
    device: {
        type: String
    },
    browser: {
        type: String
    },
    operatingSystem: {
        type: String
    },
    location: {
        country: {
            type: String
        },
        city: {
            type: String
        },
        region: {
            type: String
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    isSuccessful: {
        type: Boolean,
        default: true
    }
}, { _id: false }); // Disable automatic _id generation for subdocuments

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    phone:{
        type: String,
        unique: true,
        default:null
    },
    address:{
        type: String,
        trim:true,
        default:null
    },
    age:{
        type : Number,
        default:0
    },
    password:{
        type: String,
        required: function() {
            return this.isNew; // only required for new documents
          }
    },
    lastPasswordChange:{
        type:Date,
        default:Date.now
    },
    verifyOtp:{
        type: String,
        default: '',
    },
    verifyOtpExpiresAt:{
        type: Number,
        default: 0,
    },
    resetOtp:{
        type: String,
        default: '',
    },
    resetOtpExpiresAt:{
        type: Number,
        default: 0,
    },
    isAccountVerified:{
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: ''
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    trialEndDate: {
        type: Date,
        default: null
    },
    subscriptionEndDate: {
        type: Date,
        default: null
    },
    subscriptionType: {
        type: String,
        enum: ['none', 'trial', 'monthly', 'annually'],
        default: 'none'
    },
    // New onboarding fields
    isOnboardingComplete: {
        type: Boolean,
        default: false
    },
    isFirstLogin:{
        type:Boolean,
        default:false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    onboardingData: {
        employmentStatus: {
            type: String,
        },
        yearlyIncome: {
            type: Number,
            default: 0
        },
        customIncomeCategories: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            name: String,
        }],
        customExpenseCategories: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            name: String,
        }],
        wantsMonthlyBudget: {
            type: Boolean,
            default: false
        },
        monthlyBudget: {
            type: Number,
            default: 0
        },
        savingsGoal: { 
            type: Number, 
            default: 0 
        },
        financialGoals: [{
            type: String,
        }],
        financialHabits: [{
            type: String,
        }],
        isCurrentlyInvesting: {
            type: Boolean,
            default: false
        },
        investmentTypes: [{
            type: String,
        }],
        wantsInvestmentRecommendations: {
            type: Boolean,
            default: false
        },
        riskLevel: {
            type: String,
            enum: ["Low", "Moderate", "High"],
            default: "Moderate"
        },
    },
    loginHistory: {
        type: [loginHistorySchema],
        validate: {
            validator: function(v) {
                return v.length <= 3;
            },
            message: 'Login history can have a maximum of 3 entries'
        }
    },
    deviceTokens: [{
        token: {
            type: String,
            unique: true
        },
        device: {
            type: String
        },
        lastUsed: {
            type: Date,
            default: Date.now
        }
    }]
}, { 
    timestamps: true  // Add this option to enable createdAt and updatedAt
});

userSchema.pre('save', function(next) {
    if (this.loginHistory.length > 3) {
        this.loginHistory = this.loginHistory.slice(-3);
    }
    next();
});

const userModel = mongoose.model('Users', userSchema);

export default userModel;
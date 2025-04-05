import express from "express";
import { register, login, logout ,sendVerifyOtp,
    verifyOtp, sendResetOtp,resetPassword, 
    isAuthenticated, sendMessage, checkPremiumStatus,
    updateOnboardingData,updateProfile,
    checkPasswordResetCooldown,changePassword,
    updateCategoryOrder,addCategory,editCategory,deleteCategory} from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";
import { premiumFeatureAuth } from "../middleware/premiumAuth.js";
import { googleAuth } from '../controllers/authController.js';
import  { addIncome, getIncomes, deleteIncome ,updateIncomeController } from '../controllers/income.js';
import { addExpense, getExpense, deleteExpense, updateExpenseController } from '../controllers/expense.js';
import { getBudgetSpending, updateBudget,addBudget,deleteBudget, getBudgets } from "../controllers/budget.js";
import { addBill,getBill,deleteBill,updateBillController } from "../controllers/billscontroller.js";
import { getPaymentHistory,createOrder, verifyPayment, startFreeTrial, cancelSubscription } from '../controllers/paymentController.js';

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/send-verify-otp",userAuth, sendVerifyOtp);
router.post("/verify-otp",userAuth, verifyOtp);
router.post("/send-reset-otp",sendResetOtp);
router.post("/reset-password",resetPassword);
router.post("/is-auth",userAuth,isAuthenticated);
router.post("/send-message",sendMessage)
router.get("/google", googleAuth);
router.put("/update-profile",userAuth,updateProfile)
router.post('/add-income', userAuth,addIncome);
router.get('/get-incomes', userAuth,getIncomes);
router.delete('/delete-income/:id', deleteIncome);
router.post('/add-expense', userAuth,addExpense);
router.get('/get-expenses', userAuth,getExpense);
router.delete('/delete-expense/:id', deleteExpense);
router.put("/update-income/:id", updateIncomeController);
router.put("/update-expense/:id", updateExpenseController);
router.put("/update-budget/:id", updateBudget);
router.get("/get-budgets",userAuth ,getBudgets);
router.post("/add-budget", userAuth, addBudget);
router.delete("/delete-budget/:id", deleteBudget);
router.post("/add-bill", userAuth, addBill); 
router.get("/get-bills", userAuth, getBill);
router.delete("/delete-bill/:id", userAuth, deleteBill);
router.put("/update-bill/:id", userAuth, updateBillController);
router.post('/create-order', userAuth, createOrder);
router.post('/verify-payment', userAuth, verifyPayment);
router.post('/start-free-trial', userAuth, startFreeTrial);
router.get('/get-payment', userAuth, getPaymentHistory);
router.post('/cancel-subscription', userAuth, cancelSubscription);
router.get("/check-premium-status", userAuth, checkPremiumStatus);
router.put("/update-onboarding", userAuth, updateOnboardingData);
router.put('/change-password',userAuth,checkPasswordResetCooldown,changePassword);
router.put('/update-category-order', userAuth, updateCategoryOrder);
router.post('/add-category', userAuth, addCategory);
router.delete('/delete-category', userAuth, deleteCategory);
router.put('/edit-category', userAuth, editCategory);
// router.put('/update-financial-profile',userAuth,updateFinance);

export default router;
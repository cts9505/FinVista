import Razorpay from 'razorpay';
import crypto from 'crypto';
import userModel from '../models/model.js';
import paymentModel from '../models/paymentModel.js';

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create a new order for subscription purchase
export const createOrder = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { plan } = req.body; // 'monthly' or 'annually'
    
    if (!plan || (plan !== 'monthly' && plan !== 'annually')) {
      return res.json({ success: false, message: 'Invalid plan type!' });
    }
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found!' });
    }
    
    // Set amount based on plan
    let amount;
    if (plan === 'monthly') {
      amount = 100; 
    } else {
      amount = 1000; 
    }
    
    // Create order in Razorpay
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `order_receipt_${userId}`,
      notes: {
        userId: userId,
        plan: plan
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create payment order' 
    });
  }
};


// Updated verifyPayment function with payment record storage
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan 
    } = req.body;
    
    const userId = req.userId; // From auth middleware
    
    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
      
    const isSignatureValid = expectedSignature === razorpay_signature;
    
    if (!isSignatureValid) {
      return res.json({ 
        success: false, 
        message: 'Payment verification failed: Invalid signature' 
      });
    }
    
    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Update user subscription details
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found!' });
    }
    
    // Set subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    
    if (plan === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    }
    if (payment.status !== 'captured') {

        user.isPremium = false;
        user.subscriptionType = plan;
        user.subscriptionEndDate = subscriptionEndDate;
    
    }
    else{
        // Update user with premium info
        user.isPremium = true;
        user.subscriptionType = plan;
        user.subscriptionEndDate = subscriptionEndDate;
    }
    // Create and save payment record
    const paymentRecord = new paymentModel({
      userId: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      plan: plan,
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      metadata: {
        description: `${plan} subscription payment`,
        razorpay_data: {
          method: payment.method,
          bank: payment.bank,
          card_id: payment.card_id,
          wallet: payment.wallet,
          vpa: payment.vpa,
          email: payment.email,
          contact: payment.contact,
          fee: payment.fee,
          tax: payment.tax
        }
      }
    });
    
    // Save both user and payment record
    await Promise.all([
      user.save(),
      paymentRecord.save()
    ]);

    if(payment.status !== 'captured'){
        return res.json({ 
            success: false, 
            message: 'Payment verification failed: Payment not captured' 
          });
    }
    
    return res.json({ 
      success: true, 
      message: 'Payment verified successfully!',
      subscriptionEndDate: subscriptionEndDate,
      plan: plan,
      paymentId: razorpay_payment_id
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Payment verification failed' 
    });
  }
};

// Start free trial
export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found!' });
    }
    
    // Check if user already had a trial
    if (user.subscriptionType === 'trial' || 
        (user.trialEndDate && new Date(user.trialEndDate) > new Date())) {
      return res.json({ 
        success: false, 
        message: 'You already have an active trial!' 
      });
    }
    
    // Check if user previously had a trial that expired
    if (user.trialEndDate && new Date(user.trialEndDate) <= new Date()) {
      return res.json({ 
        success: false, 
        message: 'Your free trial period has been used!' 
      });
    }
    
    // Set trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    // Update user with trial info
    user.isPremium = true;
    user.subscriptionType = 'trial';
    user.trialEndDate = trialEndDate;
    
    await user.save();
    
    return res.json({ 
      success: true, 
      message: 'Free trial activated successfully!', 
      trialEndDate: trialEndDate
    });
  } catch (error) {
    console.error('Trial activation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to activate free trial' 
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found!' });
    }
    
    // Check if user has an active subscription
    if (!user.isPremium) {
      return res.json({ 
        success: false, 
        message: 'You don\'t have an active subscription to cancel!' 
      });
    }
    
    // Update user record
    user.isPremium = false;
    
    // If it's a trial, mark it as used by keeping the trialEndDate
    // If it's a paid subscription, we could implement a partial refund logic here if needed
    
    // Update subscription type to none
    user.subscriptionType = 'none';
    
    await user.save();
    
    return res.json({ 
      success: true, 
      message: 'Subscription canceled successfully!' 
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to cancel subscription' 
    });
  }
};

// Get payment history for a user
export const getPaymentHistory = async (req, res) => {
    try {
      const userId = req.userId; // From auth middleware
      
      // Find all payments for this user, sorted by date (newest first)
      const payments = await paymentModel
        .find({ userId: userId })
        .sort({ createdAt: -1 });
      
      // Format payments for frontend display
      const formattedPayments = payments.map(payment => {
        // Determine status label
        let statusLabel;
        switch (payment.status) {
          case 'captured':
            statusLabel = 'Paid';
            break;
          case 'refunded':
            statusLabel = 'Refunded';
            break;
          case 'failed':
            statusLabel = 'Failed';
            break;
          default:
            statusLabel = 'Processing';
        }
        
        // Format payment record
        return {
          id: payment._id,
          date: payment.createdAt,
          amount: (payment.amount / 100).toFixed(2), // Convert paisa to rupees with 2 decimal places
          status: statusLabel,
          plan: payment.plan,
          paymentMethod: payment.metadata?.razorpay_data?.method || payment.paymentMethod,
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          currency: payment.currency,
          subscriptionPeriod: {
            start: payment.subscriptionStartDate,
            end: payment.subscriptionEndDate
          },
          fee: payment.metadata?.razorpay_data?.fee || 0,
          tax: payment.metadata?.razorpay_data?.tax || 0,
        };
      });
      
      return res.json({
        success: true,
        payments: formattedPayments
      });
      
    } catch (error) {
      console.error('Payment history fetch error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment history'
      });
    }
  };
  
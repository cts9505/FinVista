import userModel from "../models/model.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found!' });

    // Ensure onboardingData exists with defaults if not present
    const onboardingData = user.onboardingData || {};

    return res.status(200).json({
      success: true,
      userData: {
        // Basic User Information
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        age: user.age,
        image: user.image,

        // Account Status Fields
        isAccountVerified: user.isAccountVerified,
        isPremium: user.isPremium,
        isOnboardingComplete: user.isOnboardingComplete,
        lastPasswordChange: user.lastPasswordChange,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        // Subscription and Trial Information
        subscriptionType: user.subscriptionType,
        trialEndDate: user.trialEndDate,
        subscriptionEndDate: user.subscriptionEndDate,

        // Login and Device Information
        lastLogin: user.lastLogin,
        loginHistory: (user.loginHistory || []).map(login => ({
          isSuccessful: login.isSuccessful,
          loginAt: login.loginAt,
          device: login.device,
          browser: login.browser,
          ipAddress: login.ipAddress,
          loginMethod: login.loginMethod,
          operatingSystem: login.operatingSystem,
          location: login.location ? {
            country: login.location.country,
            city: login.location.city,
            region: login.location.region
          } : null
        })),
        deviceTokens: (user.deviceTokens || []).map(device => ({
          device: device.device,
          lastUsed: device.lastUsed
        })),

        // Onboarding Data (with robust fallback)
        isOnboardingComplete: user.isOnboardingComplete,
        onboardingData: {
          employmentStatus: onboardingData.employmentStatus || null,
          yearlyIncome: onboardingData.yearlyIncome || 0,
          customIncomeCategories: (onboardingData.customIncomeCategories || []).map(cat => ({
            _id: cat._id.toString(),
            name: cat.name
          })),
          customExpenseCategories: (onboardingData.customExpenseCategories || []).map(cat => ({
            _id: cat._id.toString(),
            name: cat.name
          })),
          wantsMonthlyBudget: onboardingData.wantsMonthlyBudget || false,
          monthlyBudget: onboardingData.monthlyBudget || 0,
          financialGoals: onboardingData.financialGoals || [],
          financialHabits: onboardingData.financialHabits || [],
          isCurrentlyInvesting: onboardingData.isCurrentlyInvesting || false,
          investmentTypes: onboardingData.investmentTypes || [],
          wantsInvestmentRecommendations: onboardingData.wantsInvestmentRecommendations || false,
          savingsGoal: user.savingsGoal || onboardingData.savingsGoal || 0, // Fallback to 0
          riskLevel: onboardingData.riskLevel || "Moderate"
        },

        // Additional version and internal fields
        __v: user.__v
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Create this middleware in middlewares/premiumAuth.js
export const premiumFeatureAuth = async (req, res, next) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.json({ success: false, message: 'User not found!' });
      }
      
      // Check if premium or trial is active
      const now = new Date();
      
      if (!user.isPremium) {
        return res.json({ 
          success: false, 
          premiumRequired: true,
          message: 'This feature requires a premium subscription.' 
        });
      }
      
      if (user.subscriptionType === 'trial' && user.trialEndDate < now) {
        user.isPremium = false;
        user.subscriptionType = 'none';
        await user.save();
        
        return res.json({ 
          success: false, 
          premiumExpired: true,
          message: 'Your free trial has expired!' 
        });
      } 
      
      if ((user.subscriptionType === 'monthly' || user.subscriptionType === 'annually') && 
          user.subscriptionEndDate < now) {
        user.isPremium = false;
        user.subscriptionType = 'none';
        await user.save();
        
        return res.json({ 
          success: false, 
          premiumExpired: true,
          message: 'Your premium subscription has expired!' 
        });
      }
      
      next();
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  };
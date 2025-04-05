import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import userModel from "../models/model.js";
import nodemailer from "nodemailer"
import dotenv from "dotenv"
import transporter from "../config/mailer.js"
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE,WELCOME_TEMPLATE,MESSAGE_TEMPLATE, GOOGLE_TEMPLATE,NEW_DEVICE_ALERT_TEMPLATE } from "../config/emailTemplates.js";
import axios from 'axios';
import { oauth2Client } from '../utils/googleClient.js';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import useragent from 'express-useragent';

// Location detection function with fallback
async function getLocationInfo(ipAddress, latitude = null, longitude = null) {
    // Default location object
    const defaultLocation = {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        latitude: null,
        longitude: null
    };

    try {
        // If user-provided location is available
        if (latitude !== null && longitude !== null) {
            try {
                // Use OpenStreetMap Nominatim API for reverse geocoding
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = response.data;

                return {
                    country: data.address?.country || "Unknown",
                    city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
                    region: data.address?.state || "Unknown",
                    latitude,
                    longitude
                };
            } catch (geoError) {
                console.error('Reverse geocoding error:', geoError);
                // Fallback to default location with provided coordinates
                return {
                    ...defaultLocation,
                    latitude,
                    longitude
                };
            }
        }

        // Skip geolocation for localhost
        if (ipAddress === '127.0.0.1') {
            return defaultLocation;
        }

        // Try IP-based geolocation
        const geo = geoip.lookup(ipAddress);
        
        if (geo) {
            return {
                country: geo.country || 'Unknown',
                city: geo.city || 'Unknown',
                region: geo.region || 'Unknown',
                latitude: geo.ll ? geo.ll[0] : null,
                longitude: geo.ll ? geo.ll[1] : null
            };
        }
    } catch (error) {
        console.error('Geolocation error:', error);
    }

    return defaultLocation;
}

// Enhanced device detection function
function detectDeviceInfo(userAgent = '') {
    const deviceInfo = {
        device: 'Unknown Device',
        os: 'Unknown OS',
        browser: 'Unknown Browser'
    };

    // Convert to lowercase for case-insensitive matching
    userAgent = userAgent.toLowerCase();

    // Specific Postman detection (multiple approaches)
    if (
        userAgent.includes('postmanruntime') || 
        userAgent.includes('postman') || 
        // Check for common Postman headers or signatures
        userAgent.includes('postman-token') ||
        userAgent.match(/postman\/\d+\.\d+/i)
    ) {
        deviceInfo.device = 'API Testing Tool';
        deviceInfo.os = 'Postman Environment';
        deviceInfo.browser = 'Postman';
        return deviceInfo;
    }

    // Regular device and browser detection (as in previous example)
    const deviceDetectors = [
        { type: 'Mobile', keywords: ['mobile', 'android', 'iphone', 'ios'] },
        { type: 'Desktop', keywords: ['windows', 'mac', 'linux', 'x11'] }
    ];

    const osDetectors = [
        { name: 'Android', keywords: ['android'] },
        { name: 'iOS', keywords: ['iphone', 'ipad', 'ipod'] },
        { name: 'Windows', keywords: ['windows', 'win32'] },
        { name: 'macOS', keywords: ['mac', 'darwin'] },
        { name: 'Linux', keywords: ['linux', 'x11'] }
    ];

    const browserDetectors = [
        { name: 'Chrome', keywords: ['chrome', 'chromium'] },
        { name: 'Firefox', keywords: ['firefox', 'mozilla'] },
        { name: 'Safari', keywords: ['safari'] },
        { name: 'Edge', keywords: ['edge', 'edg'] },
        { name: 'Opera', keywords: ['opera', 'opr'] },
        { name: 'Brave', keywords: ['brave'] },
        { name: 'Tor', keywords: ['tor browser'] },
        { name: 'Internet Explorer', keywords: ['msie', 'trident'] },
        { name: 'Vivaldi', keywords: ['vivaldi'] },
        { name: 'Yandex', keywords: ['yandex'] }
    ];

    // Detect Device
    const deviceMatch = deviceDetectors.find(detector => 
        detector.keywords.some(keyword => userAgent.includes(keyword))
    );
    deviceInfo.device = deviceMatch ? deviceMatch.type : 'Unknown Device';

    // Detect OS
    const osMatch = osDetectors.find(detector => 
        detector.keywords.some(keyword => userAgent.includes(keyword))
    );
    deviceInfo.os = osMatch ? osMatch.name : 'Unknown OS';

    // Detect Browser
    const browserMatch = browserDetectors.find(detector => 
        detector.keywords.some(keyword => userAgent.includes(keyword))
    );
    deviceInfo.browser = browserMatch ? browserMatch.name : 'Unknown Browser';

    return deviceInfo;
}

// Secure device token generation
const generateDeviceToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const register = async (req,res) => {
    const {name,email,password} = req.body;
    if(!name){
        return res.json({success :false ,message : 'Name is Required !'})
    }
    if(!email){
        return res.json({success :false ,message : 'Email is Required !'})
    }
    if(!password){
        return res.json({success :false ,message : 'Password is Required !'})
    }
    try {

        const existingUser = await userModel.findOne({email});
        if(existingUser) return res.json({success:false, message:'User already registered !'})

        const hashedPassword = await bcrypt.hash(password,7);
        const user = new userModel({name,email,password:hashedPassword});
        user.lastPasswordChange = new Date();
        
        await user.save();

        // const token = jwt.sign({id:user._id},process.env.JWT_KEY,{expiresIn:'24h'})
        
        // res.cookie('token',token,{
        //     httpOnly:true,
        //     secure :process.env.NODE_ENV === 'production',
        //     sameSite: 'Lax',
        //     maxAge:24*60*60*1000
        // }) 
        
        const mailOptions = { 
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Finance Management App',
            html: WELCOME_TEMPLATE.replace("{{name}}",user.name).replace("{{email}}",user.email)
            // text: `<p>Welcome ${name},</p> <p>Your account has been successfully credited with $10Million.</p> <p>If not then contact your executive Jhaat Buddhi</p><p>Yours OHH FACK!!</p>`
        }
        await transporter.sendMail(mailOptions);

        return res.json({success:true, message:'User registered successfully!',user})
    } catch (error) {
        return res.json({success:false,message: error.message})
    }
}

export const login = async (req, res) => {
    const { email, password, reclocation } = req.body;

    // Input validation
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is Required!' 
        });
    }
    if (!password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password is Required!' 
        });
    }

    try {
        // Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found!' 
            });
        }

        // Get IP and device information
        const ipAddress = req.headers['x-forwarded-for'] || 
            req.ip || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress || 
            req.connection.socket.remoteAddress || 
            '127.0.0.1';

        // Enhanced device and location detection
        const deviceInfo = detectDeviceInfo(req.headers['user-agent'] || 'Unknown');
        
        // Prepare location with fallback
        let location;
        if (reclocation && reclocation.latitude && reclocation.longitude) {
            location = await getLocationInfo(ipAddress, reclocation.latitude, reclocation.longitude);
        } else {
            location = await getLocationInfo(ipAddress);
        }

        // Prepare login entry
        const loginEntry = {
            loginAt: new Date(),
            ipAddress,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            operatingSystem: deviceInfo.os,
            location: location,
            isSuccessful: false,
            loginMethod: 'E-Mail'
        };

        // Generate device token
        const deviceToken = generateDeviceToken();

        // Prepare device token entry
        const deviceTokenEntry = {
            token: deviceToken,
            device: deviceInfo.device,
            lastUsed: new Date()
        };

        // Password verification
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            // Log failed login attempt
            loginEntry.isSuccessful = false;
            
            // Update user with failed login attempt
            await userModel.findByIdAndUpdate(
                user._id,
                {
                    $push: { 
                        loginHistory: loginEntry 
                    },
                    $set: { 
                        lastLogin: null 
                    }
                },
                { 
                    new: true,
                    runValidators: true 
                }
            );
            
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials!' 
            });
        }

        // Successful login flow
        loginEntry.isSuccessful = true;

        // Find and update user with new login details
        const updatedUser = await userModel.findById(user._id);

        // Add login history
        updatedUser.loginHistory.push(loginEntry);
        if (updatedUser.loginHistory.length > 3) {
            updatedUser.loginHistory = updatedUser.loginHistory.slice(-3);
        }

        // Manage device tokens
        const existingDeviceTokenIndex = updatedUser.deviceTokens.findIndex(
            token => token.device === deviceInfo.device
        );

        if (existingDeviceTokenIndex !== -1) {
            // Update existing device token
            updatedUser.deviceTokens[existingDeviceTokenIndex] = deviceTokenEntry;
        } else {
            // Add new device token
            const loginTime = new Date().toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
          });
          
          // Format location string
          const locationString = `${location.city}, ${location.country}`;

            // Create email content
            const emailHtml = NEW_DEVICE_ALERT_TEMPLATE
            .replace('{{name}}', user.name)
            .replace('{{loginTime}}', loginTime)
            .replace('{{device}}', deviceInfo.device)
            .replace('{{browser}}', deviceInfo.browser)
            .replace('{{ipAddress}}', ipAddress)
            .replace('{{location}}', locationString)
            .replace('{{operatingSystem}}', deviceInfo.os)
            .replace(/https:\/\/yourwebsite\.com\/change-password/g, `${process.env.FRONTEND_URL}/email=${encodeURIComponent(user.email)}`)
            .replace(/https:\/\/yourwebsite\.com\/report-unauthorized-access/g, `${process.env.FRONTEND_URL}/report-unauthorized?email=${encodeURIComponent(user.email)}`);
        
            // Set up email options
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'New Device Login !',
                html: emailHtml
            };
            
            // Send the email
            await transporter.sendMail(mailOptions);
            updatedUser.deviceTokens.push(deviceTokenEntry);
        }

        // Limit device tokens to last 3
        if (updatedUser.deviceTokens.length > 3) {
            updatedUser.deviceTokens = updatedUser.deviceTokens.slice(-3);
        }

        if(updatedUser.lastLogin === null) updatedUser.isFirstLogin=true;
        else updatedUser.isFirstLogin=false;
        // Update last login
        updatedUser.lastLogin = new Date();

        // Save the updated user
        await updatedUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_KEY, 
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true, 
            message: 'User logged in successfully!',
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                isAccountVerified:updatedUser.isAccountVerified,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const googleAuth = async (req, res) => {
    const { reclocation } = req.body;
    const code = req.query.code;
    
    try {
        // Input validation
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Google Authorization Code is Required!' 
            });
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user info from Google
        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`
        );
        
        const { email, name, picture } = userRes.data;

        // Find user
        let user = await userModel.findOne({ email });
        const isNewUser = !user;

        // Get IP and device information
        const ipAddress = req.headers['x-forwarded-for'] || 
            req.ip || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress || 
            req.connection.socket.remoteAddress || 
            '127.0.0.1';

        // Enhanced device and location detection
        const deviceInfo = detectDeviceInfo(req.headers['user-agent'] || 'Unknown');
        
        // Prepare location info with fallback
        const location = await getLocationInfo(
            ipAddress, 
            reclocation?.latitude, 
            reclocation?.longitude
        );

        // Prepare login entry
        const loginEntry = {
            loginAt: new Date(),
            ipAddress,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            operatingSystem: deviceInfo.os,
            location: location,
            isSuccessful: true,
            loginMethod: 'Google'
        };

        // Generate device token
        const deviceToken = generateDeviceToken();

        // Prepare device token entry
        const deviceTokenEntry = {
            token: deviceToken,
            device: deviceInfo.device,
            lastUsed: new Date()
        };

        if (!user) {
            // Create new user for first-time Google login
            user = await userModel.create({
                name,
                email,
                password: "none", // Google users don't have a traditional password
                isAccountVerified: true,
                image: picture,
                loginHistory: [loginEntry],
                deviceTokens: [deviceTokenEntry],
                lastLogin: new Date()
            });
        } else {
            // Find and update user with new login details
            const updatedUser = await userModel.findById(user._id);

            // Add login history
            updatedUser.loginHistory.push(loginEntry);
            if (updatedUser.loginHistory.length > 3) {
                updatedUser.loginHistory = updatedUser.loginHistory.slice(-3);
            }

            // Manage device tokens
            const existingDeviceTokenIndex = updatedUser.deviceTokens.findIndex(
                token => token.device === deviceInfo.device
            );

            if (existingDeviceTokenIndex !== -1) {
                // Update existing device token
                updatedUser.deviceTokens[existingDeviceTokenIndex] = deviceTokenEntry;
            } else {
                // Add new device token
                // Format login time
                const loginTime = new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
              });
              
              // Format location string
              const locationString = `${location.city}, ${location.country}`;
              
              // Create email content
              const emailHtml = NEW_DEVICE_ALERT_TEMPLATE
                  .replace('{{name}}', user.name)
                  .replace('{{loginTime}}', loginTime)
                  .replace('{{device}}', deviceInfo.device)
                  .replace('{{browser}}', deviceInfo.browser)
                  .replace('{{ipAddress}}', ipAddress)
                  .replace('{{location}}', locationString)
                  .replace('{{operatingSystem}}', deviceInfo.os)
                  .replace(/https:\/\/yourwebsite\.com\/change-password/g, `${process.env.FRONTEND_URL}/verify-device?tokenemail=${encodeURIComponent(user.email)}`)
                  .replace(/https:\/\/yourwebsite\.com\/report-unauthorized-access/g, `${process.env.FRONTEND_URL}/report-unauthorized?email=${encodeURIComponent(user.email)}`);
              
                // Set up email options
                const mailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: user.email,
                    subject: 'New Device Login !',
                    html: emailHtml
                };
                
                // Send the email
                await transporter.sendMail(mailOptions);

                updatedUser.deviceTokens.push(deviceTokenEntry);
            }

            // Limit device tokens to last 3
            if (updatedUser.deviceTokens.length > 3) {
                updatedUser.deviceTokens = updatedUser.deviceTokens.slice(-3);
            }

            // Update last login
            updatedUser.lastLogin = new Date();

            // Save the updated user
            await updatedUser.save();
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_KEY, 
            { expiresIn: '24h' }
        );

        // Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        // Send welcome email only for new users
        if (isNewUser) {
            const mailOptions = { 
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Welcome to Finance Management App',
                html: GOOGLE_TEMPLATE.replace("{{name}}", user.name).replace("{{email}}", user.email)
            }
            await transporter.sendMail(mailOptions);
        }

        return res.json({ 
            success: true, 
            message: 'User logged in successfully!', 
            user: {
                id: user._id,
                email: user.email,
                isAccountVerified: user.isAccountVerified,
            }
        });

    } catch (err) {
        console.error("Google Auth Error:", err.message);
        
        // If error occurs during Google authentication
        if (err.response && err.response.data) {
            return res.status(400).json({ 
                success: false, 
                message: "Google Authentication Failed",
                error: err.response.data 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: err.message 
        });
    }
};

export const logout = async (req,res) => {
    res.clearCookie('token');
    return res.json({success:true,message:'User logged out successfully !'})
}

export const sendVerifyOtp = async (req,res) => {
    try{
    const {userId} = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);
 
    const user = await userModel.findById(userId);

    if(!user) return res.json({success:false,message:'User not found !'})

    if(user.isAccountVerified) return res.json({success:false,message:'Account already verified !'})
    
    user.verifyOtp = otp;
    user.verifyOtpExpiresAt = Date.now() + 5*60*1000;
    await user.save(); 

    const mailOptions = { 
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Account Verification OTP',
        // text: `Hello ${user.name}, Your OTP for account verification is ${otp}.`
        html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    }
    await transporter.sendMail(mailOptions);

    res.json({success:true,message:'OTP sent successfully !',userId})
    }
    catch (error) {
        return res.json({success:false,message: error.message})  
    }
}        

export const verifyOtp = async (req,res) => {
    const {userId,otp} = req.body;
    const user = await
    userModel.findById(userId);
    if(!user) return res.json({success:false,message:'User not found !'})
    if(user.isAccountVerified) return res.json({success:false,message:'Account already verified !'})
    if(!user.verifyOtp || !userId || !otp) return res.json({success:false,message:'Invalid request !'})
    try {
        if(user.verifyOtp !== otp || user.verifyOtp ==='') return res.json({success:false,message:'Invalid OTP !'})
        if(user.verifyOtpExpiresAt < Date.now()) return res.json({success:false,message:'OTP expired !'})
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiresAt = 0;
        await user.save();
        return res.json({success:true,message:'Account verified successfully !'})
    }
    catch (error) {
        return res.json({success:false,message: error.message})
    }
}

export const sendResetOtp = async (req,res) => {
    const {email} = req.body;
    if(!email) return res.json({success:false,message:'Email is required !'})
    const otp = Math.floor(100000 + Math.random() * 900000);
    try {
    const user = await userModel.findOne({email});
    if(!user) return res.json({success:false,message:'User not found !'})
    user.resetOtp = otp;
    user.resetOtpExpiresAt = Date.now() + 5*60*1000;
    await user.save();

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Reset Password OTP',
        // text: `Hello ${user.name}, Your OTP for password reset is ${otp}.`
        html : PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    }
    await transporter.sendMail(mailOptions);

    return res.json({success:true,message:'OTP sent successfully !',email})
    }
    catch (error) {
        return res.json({success:false,message: error.message})
    }
}

export const resetPassword = async (req,res) => {
    const {email,newPassword,otp} = req.body;
    if(!email || !newPassword || !otp) return res.json({success:false,message:'Invalid request !'})
    try {
    const user = await userModel.findOne({email});

    if(!user) return res.json({success:false,message:'User not found !'})
    
    if(user.resetOtp !== otp || user.resetOtp === '') return res.json({success:false,message:'Invalid OTP !'})
    if(user.resetOtpExpiresAt < Date.now()) return res.json({success:false,message:'OTP expired !'})
    
    user.password = await bcrypt.hash(newPassword,7);
    user.resetOtp = '';
    user.resetOtpExpiresAt = 0;
    await user.save();
    
    return res.json({success:true,message:'Password reset successfully !'})
    }
    catch (error) {
        return res.json({success:false,message: error.message})
    }
}

export const isAuthenticated = async (req,res) => {
    try{
        return res.json({success:true,isAuthenticated:true,message:'Logged In'})
    }
    catch (error) {
        return res.json({success:false,message: error.message})
    }
}

export const sendMessage = async (req,res) => {
    const {email,message} = req.body;
    
    const mailist=[
        email,
        process.env.SENDER_EMAIL,
    ]
    try{
        const mailOptions = { 
            from: process.env.SENDER_EMAIL,
            to: mailist,
            subject: 'Message from '+ email,
            // text: `Hello ${user.name}, Your OTP for account verification is ${otp}.`
            html: MESSAGE_TEMPLATE.replace("{{message}}",message).replace("{{email}}",email)
        }
        await transporter.sendMail(mailOptions);
    
        res.json({success:true,message:'Message sent successfully !'})
        
    }
    catch (error) {
        return res.json({success:false,message: error.message})
    }
}

// Check premium status
export const checkPremiumStatus = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware
        
        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found!' });
        }
        
        // Check if trial or subscription has expired
        const now = new Date();
        
        if (user.subscriptionType === 'trial' && user.trialEndDate < now) {
            // Trial has expired
            user.isPremium = false;
            user.subscriptionType = 'none';
            await user.save();
            
            return res.json({ 
                success: true, 
                isPremium: false, 
                message: 'Your free trial has expired!' 
            });
        } else if ((user.subscriptionType === 'monthly' || user.subscriptionType === 'annual') && 
                   user.subscriptionEndDate < now) {
            // Paid subscription has expired
            user.isPremium = false;
            user.subscriptionType = 'none';
            await user.save();
            
            return res.json({ 
                success: true, 
                isPremium: false, 
                message: 'Your premium subscription has expired!' 
            });
        }
        
        // Return premium status
        return res.json({ 
            success: true, 
            isPremium: user.isPremium,
            subscriptionType: user.subscriptionType,
            trialEndDate: user.trialEndDate,
            subscriptionEndDate: user.subscriptionEndDate,
            daysRemaining: user.subscriptionType === 'trial' 
                ? Math.ceil((user.trialEndDate - now) / (1000 * 60 * 60 * 24))
                : Math.ceil((user.subscriptionEndDate - now) / (1000 * 60 * 60 * 24))
        });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Add these functions to your authController.js
export const updateOnboardingData = async (req, res) => {
    try {
      const { onboardingData } = req.body;
      const userId = req.userId; // From auth middleware
  
      // Check if user exists
      const user = await userModel.findById(userId);
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }
  
      // Validate incoming data
      if (!onboardingData || typeof onboardingData !== 'object') {
        return res.json({
          success: false,
          message: "Invalid onboarding data",
        });
      }
  
      // Format fields with fallbacks to existing values
      const formattedIncomeSources = Array.isArray(onboardingData.customIncomeCategories) // Fix: Use customIncomeCategories
        ? onboardingData.customIncomeCategories.map((source) =>
            typeof source === "string" ? { name: source } : source
          )
        : user.onboardingData?.customIncomeCategories || [];
  
      const formattedExpenses = Array.isArray(onboardingData.customExpenseCategories) // Fix: Use customExpenseCategories
        ? onboardingData.customExpenseCategories.map((expense) =>
            typeof expense === "string" ? { name: expense } : expense
          )
        : user.onboardingData?.customExpenseCategories || [];
  
      const formattedFinancialGoals = Array.isArray(onboardingData.financialGoals)
        ? onboardingData.financialGoals.map((goal) =>
            typeof goal === "object" && goal.name ? goal.name : goal
          )
        : user.onboardingData?.financialGoals || [];
  
      const formattedHabits = Array.isArray(onboardingData.financialHabits)
        ? onboardingData.financialHabits.map((habit) =>
            typeof habit === "object" && habit.name ? habit.name : habit
          )
        : user.onboardingData?.financialHabits || [];
  
      const formattedInvestmentTypes = Array.isArray(onboardingData.investmentTypes)
        ? onboardingData.investmentTypes.map((type) =>
            typeof type === "object" && type.name ? type.name : type
          )
        : user.onboardingData?.investmentTypes || [];
  
      // Update onboarding data with fallbacks
      user.onboardingData = {
        employmentStatus:
          onboardingData.employmentStatus !== undefined
            ? onboardingData.employmentStatus
            : user.onboardingData?.employmentStatus || null,
        yearlyIncome:
          onboardingData.yearlyIncome !== undefined
            ? Number(onboardingData.yearlyIncome)
            : user.onboardingData?.yearlyIncome || 0,
        customIncomeCategories: formattedIncomeSources, // Correct field
        customExpenseCategories: formattedExpenses, // Correct field
        wantsMonthlyBudget:
          onboardingData.wantsMonthlyBudget !== undefined
            ? onboardingData.wantsMonthlyBudget
            : user.onboardingData?.wantsMonthlyBudget || false,
        monthlyBudget:
          onboardingData.monthlyBudget !== undefined
            ? Number(onboardingData.monthlyBudget)
            : user.onboardingData?.monthlyBudget || 0,
        financialGoals: formattedFinancialGoals,
        financialHabits: formattedHabits,
        isCurrentlyInvesting:
          onboardingData.isCurrentlyInvesting !== undefined
            ? onboardingData.isCurrentlyInvesting
            : user.onboardingData?.isCurrentlyInvesting || false,
        investmentTypes: formattedInvestmentTypes,
        wantsInvestmentRecommendations:
          onboardingData.wantsInvestmentRecommendations !== undefined
            ? onboardingData.wantsInvestmentRecommendations
            : user.onboardingData?.wantsInvestmentRecommendations || false,
        savingsGoal:
          onboardingData.savingsGoal !== undefined
            ? Number(onboardingData.savingsGoal)
            : user.onboardingData?.savingsGoal || 0,
        riskLevel:
          onboardingData.riskLevel !== undefined
            ? onboardingData.riskLevel
            : user.onboardingData?.riskLevel || "Moderate",
      };
  
      // Only set isOnboardingComplete to true if it’s not already true and data is provided
      if (!user.isOnboardingComplete && Object.keys(onboardingData).length > 0) {
        user.isOnboardingComplete = true;
      }
  
      await user.save();
  
      return res.json({
        success: true,
        message: "Financial data updated successfully",
        user: {
          name: user.name,
          email: user.email,
          isOnboardingComplete: user.isOnboardingComplete,
          onboardingData: user.onboardingData,
        },
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.json({
        success: false,
        message: "Error updating financial data",
        error: error.message,
      });
    }
  };

export const updateProfile = async (req,res)=> {
    
    const userId = req.userId;
    const {email,name,age,phone,address} = req.body;

    try {
        const user = await userModel.findById(userId);
        if(!user) return res.json({success:false,message:'User not found !'})
        
        user.name = name;
        user.email=email;
        user.age=age;
        user.phone=phone;
        user.address=address;
        await user.save();

        return res.json({success:true, message:'User profile Updated successfully !',user})
    } catch (error) {
        return res.json({success:false,message: error.message})
    }
}

// Change Password API
export const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId; // Assuming you have middleware to extract user from token
  
      // Validation checks
      if (!currentPassword) {
        return res.json({
          success: false,
          message: 'Current password is required'
        });
      }
  
      if (!newPassword) {
        return res.json({
          success: false,
          message: 'New password is required'
        });
      }
  
      // Find the user
      const user = await userModel.findById(userId);
      if (!user) {
        return res.json({
          success: false,
          message: 'User not found'
        });
      }
  
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
  
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 7);
  
      // Update user password
      user.password = hashedNewPassword;
      user.lastPasswordChange = new Date();
      await user.save();
  
      // Send password change notification email
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <h2>Password Change Notification</h2>
          <p>Hello ${user.name},</p>
          <p>Your account password was recently changed. If this was not you, please contact support immediately.</p>
          <p>Date of Change: ${new Date().toLocaleString()}</p>
          <br>
          <p>Best regards,<br>Your Security Team</p>
        `
      };
      await transporter.sendMail(mailOptions);
  
      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.json({
        success: false,
        message: 'An error occurred while changing password',
        error: error.message,
        
      });
    }
  };
  
  // Middleware to check password reset cooldown
  export const checkPasswordResetCooldown = async (req, res, next) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
  
      // Check if last password change was less than 24 hours ago
      if (user.lastPasswordChange) {
        const lastChangeTime = new Date(user.lastPasswordChange);
        const currentTime = new Date();
        const hoursSinceLastChange = (currentTime - lastChangeTime) / (1000 * 60 * 60);
  
        if (hoursSinceLastChange < 24) {
          return res.json({
            success: false,
            message: `You can change your password again after ${Math.ceil(24 - hoursSinceLastChange)} hours`
          });
        }
      }
  
      next();
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error checking password reset cooldown',
        error: error.message
      });
    }
  };

  export const updateCategoryOrder = async (req, res) => {
    const userId = req.userId;
    const { categoryType, categories } = req.body;
  
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return res.json({ success: false, message: 'User not found!' });
      }
  
      if (!['income', 'expense'].includes(categoryType)) {
        return res.json({ success: false, message: 'Invalid category type.' });
      }
  
      const existingCategories = categoryType === 'income'
        ? user.onboardingData.customIncomeCategories
        : user.onboardingData.customExpenseCategories;

      if (!Array.isArray(categories) || categories.length !== existingCategories.length) {
        return res.json({ success: false, message: 'Number of categories mismatch.' });
      }
  
      // Validate and normalize categories
      const validatedCategories = categories.map((cat, index) => {
        if (!cat.name) {
          throw new Error(`Category at index ${index} missing name`);
        }
        return {
          _id: cat._id || existingCategories[index]?._id, // Use existing _id if missing
          name: cat.name
        };
      });
  
      const existingCategoryIds = existingCategories.map(cat => cat._id.toString());
      const inputCategoryIds = validatedCategories.map(cat => cat._id.toString());

      const allCategoriesExist = inputCategoryIds.every(id => id && existingCategoryIds.includes(id));
      if (!allCategoriesExist) {
        return res.json({ success: false, message: 'Some categories do not exist in the user\'s current categories.' });
      }
  
      if (categoryType === 'income') {
        user.onboardingData.customIncomeCategories = validatedCategories;
      } else {
        user.onboardingData.customExpenseCategories = validatedCategories;
      }
  
      await user.save();

      return res.json({
        success: true,
        message: `${categoryType} categories order updated successfully!`,
        user: user
      });
    } catch (error) {
      console.error('Error updating category order:', {
        message: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  export const addCategory = async (req, res) => {
    const userId = req.userId;
    const { categoryType, categoryName } = req.body;
  
    try {
      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found!' });
  
      const newCategory = { name: categoryName }; // _id will be auto-generated by MongoDB
      if (categoryType === 'income') {
        user.onboardingData.customIncomeCategories.push(newCategory);
      } else {
        user.onboardingData.customExpenseCategories.push(newCategory);
      }
  
      await user.save();
  
      const updatedCategories = categoryType === 'income'
        ? user.onboardingData.customIncomeCategories
        : user.onboardingData.customExpenseCategories;
      const addedCategory = updatedCategories[updatedCategories.length - 1];
  
      return res.status(201).json({
        success: true,
        message: `${categoryType} category added successfully!`,
        category: {
          _id: addedCategory._id.toString(), // Return _id as string
          name: addedCategory.name
        }
      });
    } catch (error) {
      console.error('Add category error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  export const editCategory = async (req, res) => {
    const userId = req.userId;
    const { categoryType, categoryId, newCategoryName } = req.body;
  
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found!' });
      }
  
      const categories = categoryType === 'income'
        ? user.onboardingData.customIncomeCategories
        : user.onboardingData.customExpenseCategories;
  
      const categoryToEdit = categories.find(cat => cat._id.toString() === categoryId.toString());
      if (!categoryToEdit) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }
  
      categoryToEdit.name = newCategoryName;
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: `${categoryType} category updated successfully!`
      });
    } catch (error) {
      console.error('Edit category error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  export const deleteCategory = async (req, res) => {
    const userId = req.userId;
    const { categoryType, categoryId } = req.body;
  
    try {
      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found!' });
  
      const categories = categoryType === 'income'
        ? user.onboardingData.customIncomeCategories
        : user.onboardingData.customExpenseCategories;
  
      const categoryIndex = categories.findIndex(cat => cat._id.toString() === categoryId);

      if (categoryIndex === -1) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }
  
      categories.splice(categoryIndex, 1);
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: `${categoryType} category deleted successfully!`
      });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
//   export const updateFinance = async (req, res) => {
//     try {
//       const { onboardingData } = req.body;
//       const userId = req.userId; // Adjust based on your auth setup (e.g., req.user.id from JWT)
  
//       if (!userId) {
//         return res.status(400).json({ success: false, message: 'User ID is required' });
//       }
  
//       // Validate incoming data (basic example, expand as needed)
//       if (!onboardingData || typeof onboardingData !== 'object') {
//         return res.status(400).json({ success: false, message: 'Invalid onboarding data' });
//       }
  
//       // Fields to update (only allow specific fields for security)
//       const allowedFields = {
//         employmentStatus: onboardingData.employmentStatus || null,
//         yearlyIncome: Number(onboardingData.yearlyIncome) || 0,
//         monthlyBudget: Number(onboardingData.monthlyBudget) || 0,
//         savingsGoal: Number(onboardingData.savingsGoal) || 0,
//         riskLevel: onboardingData.riskLevel || 'Moderate'
//       };
  
//       // Update the user document
//       const updatedUser = await userModel.findByIdAndUpdate(
//         userId,
//         { $set: { 'onboardingData': { ...allowedFields } } },
//         { new: true, runValidators: true }
//       );
  
//       if (!updatedUser) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//       }
  
//       return res.status(200).json({
//         success: true,
//         message: 'Financial profile updated successfully',
//         onboardingData: updatedUser.onboardingData
//       });
//     } catch (error) {
//       console.error('Error updating financial profile:', error);
//       return res.status(500).json({
//         success: false,
//         message: error.message || 'Server error'
//       });
//     }
// };
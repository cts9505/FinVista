import cron from 'node-cron';
import userModel from '../models/model.js';
import BillModel from '../models/BillModel.js';
import transporter from '../config/mailer.js';
import { PAYMENT_EXPIRY_TEMPLATE,BILL_REMINDER_TEMPLATE} from '../config/emailTemplates.js';

const checkExpiringPayments = cron.schedule('0 0 * * *', async () => {
    try {

        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        // Find payments expiring in the next 3 days
        const expiringPayments = await userModel.find({
            subscriptionEndDate: { $gte: today, $lte: threeDaysLater }
        });

        for (const user of expiringPayments) {
            try {
                const formattedDate = user.subscriptionEndDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                const mailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: user.email,
                    subject: "Your Subscription is Expiring Soon",
                    html: PAYMENT_EXPIRY_TEMPLATE.replace('{{name}}', user.name).replace('{{subscriptionType}}', user.subscriptionType).replace('{{subscriptionEndDate}}', formattedDate),
                }
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error(`Failed to send email to ${user.email}:`, emailError);
            }
        }
        
    } catch (error) {
        console.error("Error checking expiring payments:", error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

const checkUpcomingBills = cron.schedule('0 9 * * *', async () => {
    try {
        const today = new Date();
        
        // Find all bills and populate with reminder days
        const bills = await BillModel.find({ isPaid: false });
        
        for (const bill of bills) {
            try {
                // Calculate if it's time to send a reminder based on reminderDays
                const dueDate = new Date(bill.dueDate);
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(dueDate.getDate() - bill.reminderDays);
                
                // Send reminder if today is on or after the reminder date but before or on the due date
                if (today >= reminderDate && today <= dueDate) {
                    // Find the user to get their email
                    const user = await userModel.findById(bill.userId);
                    if (!user || !user.email) {
                        console.error(`User not found or email missing for bill ID: ${bill._id}`);
                        continue;
                    }
                    
                    // Format due date nicely
                    const formattedDueDate = dueDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    // Create email with bill details
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: `Reminder: Your ${bill.type} Bill is Due in ${Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))} Days`,
                        html: BILL_REMINDER_TEMPLATE
                            .replace('{{name}}', user.name || 'Valued Customer')
                            .replace(/{{billType}}/g, bill.type)
                            .replace('{{dueDate}}', formattedDueDate)
                            .replace('{{amount}}', bill.amount.toFixed(2))
                            .replace('{{description}}', bill.description || 'No description provided')
                            .replace('{{recurrence}}', bill.recurrence)
                            .replace('{{billId}}', bill._id.toString())
                    };
                    
                    await transporter.sendMail(mailOptions);
                    console.log(`Reminder email sent successfully for ${bill.type} bill to ${user.email}. Days until due: ${Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))}`);
                }
            } catch (emailError) {
                console.error(`Failed to process bill or send email for bill ID ${bill._id}:`, emailError);
            }
        }
        
    } catch (error) {
        console.error("Error checking upcoming bills:", error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

export const startBillReminderCronJob = () => {
    checkUpcomingBills.start();
};

export const startExpiringPaymentsCronJob = () => {
    checkExpiringPayments.start();
};

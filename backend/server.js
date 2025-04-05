import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import router from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import Chatrouter from "./routes/aiChatRoutes.js";
import Portfoliorouter from "./routes/portfolioRoutes.js";
import { startExpiringPaymentsCronJob,startBillReminderCronJob } from "./sender/cronJobs.js";

const app=express();
const allowedOrigins = ['http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

connectDB();
const PORT =process.env.PORT || 5000;

app.get("/",(req,res)=>{res.send("API Working")});

app.use("/api/auth",router);
app.use("/api/user",userRouter);
app.use("/api/userchat/",Chatrouter);
app.use("/api/portfolio",Portfoliorouter);

startExpiringPaymentsCronJob();
startBillReminderCronJob();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started at port ${PORT}`);
});

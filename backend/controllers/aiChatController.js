// server/controllers/aiChatController.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import userModel from "../models/model.js";
import incomeModel from "../models/IncomeModel.js";
import expenseModel from "../models/ExpenseModel.js";
import budgetModel from "../models/BudgetModel.js";
import billModel from "../models/BillModel.js";
import dotenv from "dotenv";
import { projectFutureWealth, analyzeSavingsOpportunities, generateInvestmentRecommendations } from "../utils/financialUtils.js";

dotenv.config();

// Get comprehensive financial data for a user
const getFinancialData = async (userId) => {
  try {
    // Get user profile
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get financial data
    const incomes = await incomeModel.find({ userId }).sort({ date: -1 });
    const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
    const budgets = await budgetModel.find({ userId });
    const bills = await billModel.find({ userId });

    // Calculate financial metrics
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate monthly totals
    const lastSixMonths = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0);
      
      const monthlyIncome = incomes
        .filter(income => {
          const incomeDate = new Date(income.date);
          return incomeDate >= monthStart && incomeDate <= monthEnd;
        })
        .reduce((sum, income) => sum + income.amount, 0);
      
      const monthlyExpense = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      lastSixMonths.unshift({
        month: `${month} ${year}`,
        income: monthlyIncome,
        expense: monthlyExpense,
        savings: monthlyIncome - monthlyExpense
      });
    }

    // Group expenses by category
    const expenseCategories = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {});

    // Sort categories by amount
    const sortedExpenseCategories = Object.entries(expenseCategories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Process budget utilization
    const budgetUtilization = budgets.map(budget => {
      const category = budget.category;
      const spent = expenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        category,
        budgeted: budget.amount,
        spent,
        percentage: percentage.toFixed(2)
      };
    });

    // Generate advanced financial analysis
    const futureWealth = projectFutureWealth({
      metrics: {
        totalIncome,
        totalExpenses,
        totalBalance
      }
    });

    const savingsOpportunities = analyzeSavingsOpportunities(expenses);
    
    const investmentRecommendations = generateInvestmentRecommendations(
      user, 
      {
        totalBalance,
        totalExpenses,
        savingsRate: parseFloat(savingsRate)
      }
    );

    return {
      profile: user,
      metrics: {
        totalIncome,
        totalExpenses,
        totalBalance,
        savingsRate: savingsRate.toFixed(2),
      },
      monthlySummary: lastSixMonths,
      expenseBreakdown: sortedExpenseCategories,
      budgetUtilization,
      incomes,
      expenses,
      budgets,
      bills,
      analysis: {
        futureWealth,
        savingsOpportunities,
        investmentRecommendations
      }
    };
  } catch (error) {
    console.error("Error getting financial data:", error);
    throw error;
  }
};

// Chat with AI
export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId; // From auth middleware

    // Get financial data
    const financialData = await getFinancialData(userId);

    // Create system prompt with financial context
    const systemPrompt = `
      You are a personal financial assistant with access to the user's financial data.
      
      USER PROFILE:
      Name: ${financialData.profile.name}
      Employment Status: ${financialData.profile.onboardingData?.employmentStatus || "Not specified"}
      Yearly Income: $${financialData.profile.onboardingData?.yearlyIncome || "Not specified"}
      Risk Level: ${financialData.profile.onboardingData?.riskLevel || "Moderate"}
      
      FINANCIAL METRICS:
      Total Income: $${financialData.metrics.totalIncome}
      Total Expenses: $${financialData.metrics.totalExpenses}
      Current Balance: $${financialData.metrics.totalBalance}
      Savings Rate: ${financialData.metrics.savingsRate}%
      
      MONTHLY SUMMARY (Last 6 months):
      ${financialData.monthlySummary.map(month => 
        `- ${month.month}: Income $${month.income}, Expenses $${month.expense}, Savings $${month.savings}`
      ).join("\n")}
      
      TOP EXPENSE CATEGORIES:
      ${financialData.expenseBreakdown.slice(0, 5).map(category => 
        `- ${category.category}: $${category.amount}`
      ).join("\n")}
      
      BUDGET UTILIZATION:
      ${financialData.budgetUtilization.map(budget => 
        `- ${budget.category}: $${budget.spent} spent of $${budget.budgeted} budgeted (${budget.percentage}%)`
      ).join("\n")}
      
      RECENT INCOME SOURCES:
      ${financialData.incomes.slice(0, 5).map(income => 
        `- ${income.title || income.category}: $${income.amount} (${new Date(income.date).toLocaleDateString()})`
      ).join("\n")}
      
      RECENT EXPENSES:
      ${financialData.expenses.slice(0, 5).map(expense => 
        `- ${expense.title || expense.category}: $${expense.amount} (${new Date(expense.date).toLocaleDateString()})`
      ).join("\n")}
      
      UPCOMING BILLS:
      ${financialData.bills
        .filter(bill => new Date(bill.dueDate) > new Date())
        .slice(0, 5)
        .map(bill => 
          `- ${bill.title}: $${bill.amount} (Due: ${new Date(bill.dueDate).toLocaleDateString()})`
        ).join("\n")}
      
      FINANCIAL PROJECTIONS:
      - Projected wealth in 5 years: $${financialData.analysis.futureWealth.projectedWealth}
      - Annual savings: $${financialData.analysis.futureWealth.assumptions.annualSavings}
      - Total potential monthly savings: $${financialData.analysis.savingsOpportunities.totalPotentialSavings}
      
      INVESTMENT RECOMMENDATIONS:
      - Risk profile: ${financialData.analysis.investmentRecommendations.riskProfile}
      - Emergency fund recommendation: $${financialData.analysis.investmentRecommendations.recommendedEmergencyFund}
      - Investable amount: $${financialData.analysis.investmentRecommendations.investableAmount}
      - Allocation: ${Object.entries(financialData.analysis.investmentRecommendations.recommendedAllocation)
        .filter(([key]) => key !== 'description')
        .map(([key, value]) => `${key}: ${value}%`)
        .join(', ')}
      
      FINANCIAL GOALS:
      ${financialData.profile.onboardingData?.financialGoals?.map(goal => `- ${goal}`).join("\n") || "No goals specified"}
      
      Provide personalized financial advice based on this data. Be specific and reference the user's actual numbers.
      Focus on practical, actionable advice that addresses the user's question directly.
      When discussing investments, taxes, or complex financial matters, provide balanced information and clarify when 
      professional advice may be needed.
    `;

    // Set up LangChain with Gemini
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-1.5-flash",
      maxOutputTokens: 2048,
      temperature: 0.2, // Lower temperature for more factual responses
    });

    // Create a prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
      System: {system}
      
      User Question: {question}
      
      Provide a helpful, personalized response based on the user's financial data.
      
      Be very concise,short summary but thorough, and always reference specific details from their financial situation.
    `);

    // Create a chain
    const chain = RunnableSequence.from([
      {
        system: () => systemPrompt,
        question: (input) => input.question,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    // Generate response
    const response = await chain.invoke({
      question: message,
    });

    return res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later.",
    });
  }
};

// Get AI chat suggestions based on financial data
export const getAIChatSuggestions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get financial data
    const financialData = await getFinancialData(userId);
    
    // Generate personalized suggestions based on financial data
    const suggestions = [];
    
    // Check savings rate
    if (parseFloat(financialData.metrics.savingsRate) < 20) {
      suggestions.push("How can I improve my savings rate?");
    }
    
    // Check budget utilization
    const overBudget = financialData.budgetUtilization.filter(budget => 
      parseFloat(budget.percentage) > 100
    );
    
    if (overBudget.length > 0) {
      suggestions.push(`Why am I over budget in ${overBudget[0].category}?`);
    }
    
    // Check for upcoming bills
    const upcomingBills = financialData.bills.filter(bill => 
      new Date(bill.dueDate) > new Date() && 
      new Date(bill.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    
    if (upcomingBills.length > 0) {
      suggestions.push("What bills do I have coming up this week?");
    }
    
    // Check for investment opportunities
    if (financialData.analysis.investmentRecommendations.investableAmount > 1000) {
      suggestions.push("Where should I invest my excess cash?");
    }
    
    // Add general suggestions
    suggestions.push(
      "What will my wealth be after 5 years?",
      "How can I optimize my taxes?",
      "How can I save more money each month?",
      "Am I on track to meet my financial goals?"
    );
    
    return res.json({
      success: true,
      suggestions: suggestions.slice(0, 5) // Return top 5 suggestions
    });
  } catch (error) {
    console.error("Error getting AI chat suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate suggestions"
    });
  }
};


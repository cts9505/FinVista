// server/utils/financialUtils.js

/**
 * Project future wealth based on current financial data
 * @param {Object} financialData - User's financial data
 * @param {number} years - Number of years to project
 * @returns {Object} - Projected financial data
 */
export const projectFutureWealth = (financialData, years = 5) => {
    const { totalIncome, totalExpenses, totalBalance } = financialData.metrics;
    const monthlySavings = totalIncome - totalExpenses;
    const annualSavings = monthlySavings * 12;
  
    // Assume a conservative 5% annual return on investments
    const annualReturnRate = 0.05;
  
    let futureWealth = totalBalance;
    const yearlyProjections = [];
  
    for (let i = 1; i <= years; i++) {
      // Add annual savings
      futureWealth += annualSavings;
  
      // Apply investment returns
      futureWealth *= 1 + annualReturnRate;
  
      yearlyProjections.push({
        year: i,
        wealth: Math.round(futureWealth),
      });
    }
  
    return {
      initialBalance: totalBalance,
      projectedWealth: Math.round(futureWealth),
      yearlyProjections,
      assumptions: {
        annualSavings,
        annualReturnRate,
      },
    };
  };
  
  /**
   * Analyze spending patterns to identify savings opportunities
   * @param {Array} expenses - User's expense transactions
   * @returns {Object} - Savings opportunities
   */
  export const analyzeSavingsOpportunities = (expenses) => {
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expense);
      return acc;
    }, {});
  
    // Calculate total and average for each category
    const categoryAnalysis = Object.entries(expensesByCategory)
      .map(([category, expenses]) => {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const average = total / expenses.length;
  
        return {
          category,
          total,
          average,
          count: expenses.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  
    // Identify top spending categories
    const topCategories = categoryAnalysis.slice(0, 3);
  
    // Generate savings recommendations
    const savingsRecommendations = topCategories.map((category) => {
      const potentialSavings = Math.round(category.total * 0.1); // Assume 10% savings potential
  
      return {
        category: category.category,
        currentSpending: category.total,
        potentialSavings,
        recommendation: `Reducing your ${category.category} expenses by 10% could save you $${potentialSavings}.`,
      };
    });
  
    return {
      topSpendingCategories: topCategories,
      savingsRecommendations,
      totalPotentialSavings: savingsRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
    };
  };
  
  /**
   * Generate investment recommendations based on user profile
   * @param {Object} userProfile - User's profile data
   * @param {Object} financialMetrics - User's financial metrics
   * @returns {Object} - Investment recommendations
   */
  export const generateInvestmentRecommendations = (userProfile, financialMetrics) => {
    const { riskLevel = "Moderate" } = userProfile.onboardingData || {};
    const { totalBalance, totalExpenses } = financialMetrics;
  
    // Define investment allocations based on risk level
    const allocations = {
      Low: {
        stocks: 30,
        bonds: 50,
        cash: 20,
        description: "Conservative portfolio focused on capital preservation with moderate growth",
      },
      Moderate: {
        stocks: 60,
        bonds: 30,
        cash: 10,
        description: "Balanced portfolio aiming for growth while managing volatility",
      },
      High: {
        stocks: 80,
        bonds: 15,
        cash: 5,
        description: "Growth-oriented portfolio focused on maximizing long-term returns",
      },
    };
  
    const recommendedAllocation = allocations[riskLevel];
  
    // Calculate recommended emergency fund
    const monthlyExpenses = totalExpenses;
    const recommendedEmergencyFund = monthlyExpenses * 6;
  
    // Calculate investment amounts
    const investableAmount = Math.max(0, totalBalance - recommendedEmergencyFund);
  
    const investmentAmounts = {
      stocks: Math.round(investableAmount * (recommendedAllocation.stocks / 100)),
      bonds: Math.round(investableAmount * (recommendedAllocation.bonds / 100)),
      cash: Math.round(investableAmount * (recommendedAllocation.cash / 100)),
    };
  
    return {
      riskProfile: riskLevel,
      portfolioDescription: recommendedAllocation.description,
      recommendedAllocation: recommendedAllocation,
      recommendedEmergencyFund,
      investableAmount,
      investmentAmounts,
      additionalRecommendations: [
        financialMetrics.savingsRate < 10
          ? "Increase your savings rate to at least 10% before aggressive investing"
          : "Your current savings rate is healthy for investment growth",
        "Consider tax-advantaged accounts like 401(k) or IRA for retirement savings",
        "Diversify investments across different asset classes and sectors",
      ],
    };
  };
  
  
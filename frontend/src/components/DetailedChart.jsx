import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { useGlobalContext } from "../context/GlobalContext";
import moment from "moment";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Layer } from "recharts";
const DetailedChartsContainer = () => {
  const { incomes, expenses, getIncomes, getExpenses } = useGlobalContext();
  const [filter, setFilter] = useState("Monthly");
  const [yearFilter, setYearFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  
  // Add month range selection
  const [startMonth, setStartMonth] = useState(moment().startOf('month').format("YYYY-MM"));
  const [endMonth, setEndMonth] = useState(moment().endOf('month').format("YYYY-MM"));
  const [useMonthRange, setUseMonthRange] = useState(false);
  
  // State for toggling visibility of chart lines
  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showCumulativeIncome, setShowCumulativeIncome] = useState(true);
  const [showCumulativeExpense, setShowCumulativeExpense] = useState(true);
  const [showCrossovers, setShowCrossovers] = useState(true);
  const [showAccountBalance, setShowAccountBalance] = useState(true); // New state for account balance toggle

  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await getIncomes();
        await getExpenses();
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Get all available months from transaction data
  const availableMonths = useMemo(() => {
    if (incomes.length === 0 && expenses.length === 0) return [];
    
    const allTransactions = [
      ...incomes.map(inc => ({ ...inc, type: "income" })),
      ...expenses.map(exp => ({ ...exp, type: "expense" }))
    ];
    
    // Get unique months from transactions
    const months = new Set();
    allTransactions.forEach(transaction => {
      const date = moment(transaction.date);
      const monthYear = date.format("YYYY-MM");
      months.add(monthYear);
    });
    
    // Convert to array and sort (oldest first)
    return Array.from(months).sort();
  }, [incomes, expenses]);

  // Get all available financial years from transaction data
  const availableFinancialYears = useMemo(() => {
    if (incomes.length === 0 && expenses.length === 0) return ["All"];
    
    const allTransactions = [
      ...incomes.map(inc => ({ ...inc, type: "income" })),
      ...expenses.map(exp => ({ ...exp, type: "expense" }))
    ];
    
    // Get unique financial years from transactions
    const years = new Set();
    allTransactions.forEach(transaction => {
      const date = moment(transaction.date);
      const month = date.month(); // 0-11
      let fiscalYear;
      
      // If month is Jan-Mar (0-2), fiscal year is previous year to current year
      // If month is Apr-Dec (3-11), fiscal year is current year to next year
      if (month <= 2) { // Jan-Mar
        fiscalYear = `${date.year() - 1}-${date.year()}`;
      } else { // Apr-Dec
        fiscalYear = `${date.year()}-${date.year() + 1}`;
      }
      years.add(fiscalYear);
    });
    
    // Convert to array and sort (newest first)
    return ["All", ...Array.from(years).sort().reverse()];
  }, [incomes, expenses]);

  // Helper function to check if a date is within the selected date range
  const isWithinDateRange = (date) => {
    if (!useMonthRange) {
      // Check if within financial year (original logic)
      if (yearFilter === "All") return true;
      
      const [startYearStr, endYearStr] = yearFilter.split('-');
      const startYear = parseInt(startYearStr);
      const endYear = parseInt(endYearStr);
      const momentDate = moment(date);
      const month = momentDate.month(); // 0-11 where 0 is January
      const year = momentDate.year();
      
      // Financial year runs from April (month 3) of start year to March (month 2) of end year
      if (month >= 3 && year === startYear) return true; // April-December of start year
      if (month <= 2 && year === endYear) return true; // January-March of end year
      return false;
    } else {
      // Check if within month range
      const transactionDate = moment(date).format("YYYY-MM");
      return transactionDate >= startMonth && transactionDate <= endMonth;
    }
  };

  // Generate the title for the specific date range
  const getDateRangeTitle = () => {
    if (!useMonthRange) {
      if (yearFilter === "All") return "All Time";
      return `Financial Year: ${yearFilter}`;
    } else {
      const formattedStart = moment(startMonth).format("MMM YYYY");
      const formattedEnd = moment(endMonth).format("MMM YYYY");
      return `${formattedStart} to ${formattedEnd}`;
    }
  };

  // Format category label based on filter type
  const formatCategoryLabel = (category) => {
    switch (filter) {
      case "Daily":
        return moment(category).format("DD MMM YYYY");
      case "Weekly": {
        // Format: "W1-Mar-2024"
        const [year, week] = category.split('-W');
        const date = moment().year(year).week(week).day(1); // First day of week
        return `W${week}-${date.format("MMM-YYYY")}`;
      }
      case "Monthly": {
        // Format: "Mar-2024"
        const date = moment(category);
        return date.format("MMM-YYYY");
      }
      case "Yearly":
        return category;
      default:
        return category;
    }
  };

  // Enhanced version of the categorizeTransactions function with account balance calculation
  const categorizeTransactions = (transactions) => {
    const groupedData = {};
    
    // Filter transactions by date range for cumulative calculation
    const filteredTransactions = transactions.filter(transaction => 
      isWithinDateRange(transaction.date)
    );
    
    // All transactions (unfiltered) for account balance calculation
    const allTransactions = [...transactions];
    
    // Sort transactions by date (oldest first) for cumulative calculation
    filteredTransactions.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
    allTransactions.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
    
    // First, categorize and calculate per-period metrics
    filteredTransactions.forEach((transaction) => {
      const date = moment(transaction.date);
      let category;
      
      switch (filter) {
        case "Daily":
          category = date.format("YYYY-MM-DD");
          break;
        case "Weekly":
          category = `${date.year()}-W${date.week()}`;
          break;
        case "Monthly":
          category = date.format("YYYY-MM");
          break;
        case "Yearly":
          category = date.format("YYYY");
          break;
        default:
          category = date.format("YYYY-MM");
      }
      
      if (!groupedData[category]) {
        groupedData[category] = {
          category,
          displayCategory: formatCategoryLabel(category),
          income: 0,
          expense: 0,
          periodBalance: 0, // Balance for just this period
          cumulativeIncome: 0, // Running total of income
          cumulativeExpense: 0, // Running total of expenses
          cumulativeBalance: 0, // Running total of balance
          accountBalance: 0, // Total account balance (all time)
          positiveBalance: 0,
          negativeBalance: 0,
          crossoverPoint: null, // Will be set if balance crosses zero
          zeroCrossingSegment: null, // Will be used for the yellow line segment
        };
      }
      
      if (transaction.type === "income") {
        groupedData[category].income += parseFloat(transaction.amount);
      } else {
        groupedData[category].expense += parseFloat(transaction.amount);
      }
    });

    // Convert to array and sort by category (chronologically)
    let result = Object.values(groupedData)
      .sort((a, b) => a.category.localeCompare(b.category));
    
    // Calculate period balance for each time period
    result.forEach(item => {
      const incomeAmount = Number(item.income) || 0;
      const expenseAmount = Number(item.expense) || 0;
      item.periodBalance = incomeAmount - expenseAmount;
    });
    
    // Calculate cumulative totals
    let runningIncome = 0;
    let runningExpense = 0;
    let runningBalance = 0;
    let previousBalance = null;
    let previousItem = null;
    
    // Pre-calculate account balance for each category
    const accountBalances = {};
    
    // Calculate account balance up to each time period
    allTransactions.forEach(transaction => {
      const date = moment(transaction.date);
      let category;
      
      switch (filter) {
        case "Daily":
          category = date.format("YYYY-MM-DD");
          break;
        case "Weekly":
          category = `${date.year()}-W${date.week()}`;
          break;
        case "Monthly":
          category = date.format("YYYY-MM");
          break;
        case "Yearly":
          category = date.format("YYYY");
          break;
        default:
          category = date.format("YYYY-MM");
      }
      
      if (!accountBalances[category]) {
        accountBalances[category] = 0;
      }
      
      if (transaction.type === "income") {
        accountBalances[category] += parseFloat(transaction.amount);
      } else {
        accountBalances[category] -= parseFloat(transaction.amount);
      }
    });
    
    // Process each category to compute running account balance
    let categories = Object.keys(accountBalances).sort();
    let accumulatedBalance = 0;
    
    for (let i = 0; i < categories.length; i++) {
      accumulatedBalance += accountBalances[categories[i]];
      accountBalances[categories[i]] = accumulatedBalance;
    }
    
    // Now continue with calculating the rest of the metrics
    result.forEach(item => {
        const incomeAmount = Number(item.income) || 0;
        const expenseAmount = Number(item.expense) || 0;
        item.periodBalance = incomeAmount - expenseAmount;
      });
      
      // Calculate cumulative totals
    //   let runningIncome = 0;
    //   let runningExpense = 0;
    //   let runningBalance = 0;
    //   let previousBalance = null;
    //   let previousItem = null;
      
      // Now continue with calculating the rest of the metrics
      result.forEach((item, index) => {
        // Update running totals for cumulative calculations (within selected period)
        runningIncome += Number(item.income) || 0;
        runningExpense += Number(item.expense) || 0;
        runningBalance = runningIncome - runningExpense;
        
        // Assign cumulative values
        item.cumulativeIncome = runningIncome;
        item.cumulativeExpense = runningExpense;
        item.cumulativeBalance = runningBalance;
        
        // Assign account balance (all time balance up to this point)
        item.accountBalance = accountBalances[item.category] || 0;
        item.balanceColor = item.accountBalance >= 0 ? '#22c55e' : '#ef4444';
    item.balance = Number(item.accountBalance);
    item.positive = item.balance >= 0 ? item.balance : null;
    item.negative = item.balance < 0 ? item.balance : null; 
        
        // Improved handling for positive/negative balance values for visualization
        // These will be used for the colored line segments
        item.positiveBalance = runningBalance >= 0 ? runningBalance : null;
        item.negativeBalance = runningBalance < 0 ? runningBalance : null;
        
        // Check for zero crossovers
        if (index > 0 && previousBalance !== null) {
          // If previous balance was positive and current is negative, or vice versa
          if ((previousBalance >= 0 && runningBalance < 0) || (previousBalance < 0 && runningBalance >= 0)) {
            // Mark this point as a crossover point
            item.crossoverPoint = runningBalance;
            
            // Calculate the exact zero-crossing point (for visualization)
            if (previousItem) {
              item.prevCrossBalance = previousItem.cumulativeBalance;
              
              // Add information for the zero-crossing segment (yellow line)
              item.zeroCrossingSegment = true;
              
              // Store coordinates from the previous point to help draw the crossing line
              item.prevCategory = previousItem.category;
              
              // Calculate the interpolation factor to find the exact zero point
              // This is used to position the yellow line segment precisely at zero
              const ratio = Math.abs(previousBalance) / (Math.abs(previousBalance) + Math.abs(runningBalance));
              item.zeroCrossingRatio = ratio;
            }
          }
        }
        
        
        // Store current balance for next iteration
        previousBalance = runningBalance;
        previousItem = item;
      });
    
    // Set no data flag
    setNoData(result.length === 0);
    
    return result;
  };

  // Custom zero crossing line component
  const ZeroCrossingLine = (props) => {
    const { points } = props;
    if (!points || points.length < 2) return null;
    
    // Extract points data
    const [p1, p2] = points;
    
    // Create a path for the line segment
    const pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    
    return (
      <path 
        d={pathData} 
        stroke="#f59e0b" 
        strokeWidth={3} 
        strokeDasharray="3 2" 
        fill="none" 
      />
    );
  };

  // Memoized chart data
  const chartData = useMemo(() => {
    const allTransactions = [
      ...incomes.map(inc => ({ ...inc, type: "income" })),
      ...expenses.map(exp => ({ ...exp, type: "expense" }))
    ];
    
    return categorizeTransactions(allTransactions);
  }, [incomes, expenses, filter, yearFilter, useMonthRange, startMonth, endMonth]);

  // Enhanced tooltip to show both period and cumulative values
  // Enhanced tooltip to show both period and cumulative values
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find all visible metrics
      const visibleItems = payload.filter(item => {
        const name = item.name;
        if (name === 'income' && !showIncome) return false;
        if (name === 'expense' && !showExpense) return false;
        if (name === 'cumulativeIncome' && !showCumulativeIncome) return false;
        if (name === 'cumulativeExpense' && !showCumulativeExpense) return false;
        if (name === 'accountBalance' && !showAccountBalance) return false;
        if (['cumulativeBalance', 'positiveBalance', 'negativeBalance', 'positivePoint', 'negativePoint', 'crossoverPoint'].includes(name) && !showBalance) return false;
        if (['positiveBalance', 'negativeBalance', 'positivePoint', 'negativePoint', 'crossoverPoint'].includes(name)) return false;
        return true;
      });
      
      // Calculate period balance for tooltip
      const incomeValue = payload.find(p => p.name === 'income')?.value || 0;
      const expenseValue = payload.find(p => p.name === 'expense')?.value || 0;
      const periodBalance = incomeValue - expenseValue;
      
      // Get cumulative balance for tooltip color
      const balanceValue = payload.find(p => p.name === 'cumulativeBalance')?.value || 0;
      
      // Get account balance
      const accountBalanceValue = payload.find(p => p.name === 'accountBalance')?.value || 0;
      const accountBalanceColor = accountBalanceValue >= 0 ? '#22c55e' : '#ef4444';
      
      // Check if this point is a crossover point
      const crossoverPoint = payload.find(p => p.name === 'crossoverPoint')?.value;
      const hasCrossover = crossoverPoint !== null && crossoverPoint !== undefined;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          
          {/* Period Values */}
          <div className="tooltip-section">
            <h4>Period Values:</h4>
            {showIncome && (
              <p style={{ color: "#3B82F6" }}>
                Income: ${incomeValue.toFixed(2)}
              </p>
            )}
            {showExpense && (
              <p style={{ color: "#8b5cf6" }}>
                Expense: ${expenseValue.toFixed(2)}
              </p>
            )}
            {showIncome && showExpense && (
              <p style={{ color: periodBalance >= 0 ? '#22c55e' : '#ef4444' }}>
                Period Balance: ${periodBalance.toFixed(2)}
              </p>
            )}
          </div>
          
          {/* Cumulative Values */}
          <div className="tooltip-section">
            <h4>Cumulative Values:</h4>
            {showCumulativeIncome && (
              <p style={{ color: "#60a5fa" }}>
                Total Income: ${payload.find(p => p.name === 'cumulativeIncome')?.value.toFixed(2)}
              </p>
            )}
            {showCumulativeExpense && (
              <p style={{ color: "#a78bfa" }}>
                Total Expense: ${payload.find(p => p.name === 'cumulativeExpense')?.value.toFixed(2)}
              </p>
            )}
            {showBalance && (
              <p style={{ color: "#64748b" }}> {/* Changed to grey */}
                Cumulative Balance: ${balanceValue.toFixed(2)}
              </p>
            )}
            {showAccountBalance && (
              <p style={{ color: accountBalanceColor, fontWeight: "bold" }}>
                Account Balance: ${accountBalanceValue.toFixed(2)}
              </p>
            )}
          </div>
          
          {/* Crossover indicator */}
          {hasCrossover && showCrossovers && (
            <div className="crossover-indicator">
              <p style={{ color: "#f59e0b", fontWeight: "bold" }}>
                ⚠️ Balance crossed zero
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom line dot component for balance points
  const CustomBalanceDot = (props) => {
    const { cx, cy, value, dataKey } = props;
    if (cx === undefined || cy === undefined) return null;
    
    // Set color based on which line the dot belongs to
    const color = dataKey === "positivePoint" ? "#22c55e" : "#ef4444";
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={color} 
        stroke="#fff" 
        strokeWidth={1} 
      />
    );
  };

  // Custom dot for crossover points
  const CrossoverDot = (props) => {
    const { cx, cy, value } = props;
    if (cx === undefined || cy === undefined || value === null) return null;
    
    // Make the crossover point more prominent
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </g>
    );
  };

  // Custom dot for positive balance points
const PositiveDot = (props) => {
    const { cx, cy, value } = props;
    // Only render if it's a positive value and coordinates exist
    if (cx === undefined || cy === undefined || value === null) return null;
    // Check if this is truly a positive point
    if (value < 0) return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="#64748b" // Changed to grey to match line
        stroke="#fff" 
        strokeWidth={1} 
      />
    );
  };
  
  // Negative dots component 
  const NegativeDot = (props) => {
    const { cx, cy, value } = props;
    // Only render if it's a negative value and coordinates exist
    if (cx === undefined || cy === undefined || value === null) return null;
    // Check if this is truly a negative point
    if (value >= 0) return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="#64748b" // Changed to grey to match line
        stroke="#fff" 
        strokeWidth={1} 
      />
    );
  };
  
  // Updated Account Balance dot component
  const AccPositiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // Only render if it's a positive value and coordinates exist
    if (cx === undefined || cy === undefined || value === null) return null;
    
    // Check if this is truly a positive point (additional safety)
    if (value < 0) return null;
    
    return (
        <circle 
            cx={cx} 
            cy={cy} 
            r={4} 
            fill="#22c55e" 
            stroke="#fff" 
            strokeWidth={1} 
        />
    );
};

// Negative dots component (red dots)
const AccNegativeDot = (props) => {
    const { cx, cy, value } = props;
    
    // Only render if it's a negative value and coordinates exist
    if (cx === undefined || cy === undefined || value === null) return null;
    
    // Check if this is truly a negative point (additional safety)
    if (value >= 0) return null;
    
    return (
        <circle 
            cx={cx} 
            cy={cy} 
            r={4} 
            fill="#ef4444" 
            stroke="#fff" 
            strokeWidth={1} 
        />
    );
};


  // Determine if we should render chart
  const shouldRenderChart = !isLoading && !noData && chartData.length > 0;
  
  if (isLoading) {
    return <LoadingContainer>Loading transactions...</LoadingContainer>;
  }

  return (
    <Container>
      <FiltersContainer>
        <FilterGroup>
          <label htmlFor="filter">View By: </label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </FilterGroup>
        
        <FilterGroup>
          <label htmlFor="dateRangeToggle">Filter Type: </label>
          <select 
            id="dateRangeToggle" 
            value={useMonthRange ? "month" : "fiscal"} 
            onChange={(e) => setUseMonthRange(e.target.value === "month")}
          >
            <option value="fiscal">Financial Year</option>
            <option value="month">Month Range</option>
          </select>
        </FilterGroup>
        
        {useMonthRange ? (
          <>
            <FilterGroup>
              <label htmlFor="startMonth">From: </label>
              <select 
                id="startMonth" 
                value={startMonth} 
                onChange={(e) => setStartMonth(e.target.value)}
              >
                {availableMonths.map(month => (
                  <option key={`start-${month}`} value={month}>
                    {moment(month).format("MMM YYYY")}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup>
              <label htmlFor="endMonth">To: </label>
              <select 
                id="endMonth" 
                value={endMonth} 
                onChange={(e) => setEndMonth(e.target.value)}
              >
                {availableMonths.map(month => (
                  <option key={`end-${month}`} value={month}>
                    {moment(month).format("MMM YYYY")}
                  </option>
                ))}
              </select>
            </FilterGroup>
          </>
        ) : (
          <FilterGroup>
            <label htmlFor="yearFilter">Financial Year: </label>
            <select 
              id="yearFilter" 
              value={yearFilter} 
              onChange={(e) => setYearFilter(e.target.value)}
            >
              {availableFinancialYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </FilterGroup>
        )}
      </FiltersContainer>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="chart-box"
      >
        <HeaderContainer className="content-center">
          <div>
            <h2 className="chart-title">
              Financial Overview
            </h2>
            <p className="chart-subtitle">
              {getDateRangeTitle()} • Track your spending trends over time
            </p>
          </div>
        </HeaderContainer>
        
        <LegendWrapper>
  <LegendItem 
    onClick={() => setShowIncome(!showIncome)} 
    active={showIncome}
  >
    <LegendColor color="#3B82F6" />
    <span>Income</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowExpense(!showExpense)} 
    active={showExpense}
  >
    <LegendColor color="#8b5cf6" />
    <span>Expense</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowBalance(!showBalance)} 
    active={showBalance}
  >
    <LegendColor color="#64748b" /> {/* Changed to grey */}
    <span>Cumulative Balance</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowAccountBalance(!showAccountBalance)} 
    active={showAccountBalance}
  >
    <div style={{ display: 'flex', gap: '2px' }}>
      <LegendColor color="#22c55e" />
      <LegendColor color="#ef4444" />
    </div>
    <span>Account Balance</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowCumulativeIncome(!showCumulativeIncome)} 
    active={showCumulativeIncome}
  >
    <LegendColor color="#60a5fa" />
    <span>Cumulative Income</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowCumulativeExpense(!showCumulativeExpense)} 
    active={showCumulativeExpense}
  >
    <LegendColor color="#a78bfa" />
    <span>Cumulative Expense</span>
  </LegendItem>
  <LegendItem 
    onClick={() => setShowCrossovers(!showCrossovers)} 
    active={showCrossovers}
  >
    <LegendColor color="#f59e0b" />
    <span>Zero Crossovers</span>
  </LegendItem>
</LegendWrapper>
        
        {noData ? (
          <NoDataContainer>
            <p>No transactions found for the selected period.</p>
          </NoDataContainer>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
  </linearGradient>
  {/* Updated to use grey for cumulative balance */}
  <linearGradient id="colorPositiveBalance" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#64748b" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#64748b" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorNegativeBalance" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#64748b" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#64748b" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorCumulativeIncome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorCumulativeExpense" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorAccountBalanceNegative" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
  </linearGradient>
  <linearGradient id="colorAccountBalancePositive" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
  </linearGradient>
</defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="displayCategory" 
                tick={{ fontSize: 12 }} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `$${Math.abs(value)}`} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
              
              {/* Period Income and Expense (bars) */}
              {showIncome && (
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorIncome)"
                  fillOpacity={0.5}
                  isAnimationActive={true}
                />
              )}
              
              {showExpense && (
                <Area
                  type="monotone"
                  dataKey="expense"
                  stackId="2"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorExpense)"
                  fillOpacity={0.5}
                  isAnimationActive={true}
                />
              )}
              
              {/* Cumulative Income Line */}
              {showCumulativeIncome && (
                <Line
                  type="monotone"
                  dataKey="cumulativeIncome"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 1, fill: '#60a5fa' }}
                  isAnimationActive={true}
                />
              )}
              
              {/* Cumulative Expense Line */}
              {showCumulativeExpense && (
                <Line
                  type="monotone"
                  dataKey="cumulativeExpense"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 1, fill: '#a78bfa' }}
                  isAnimationActive={true}
                />
              )}
              
              {showBalance && (
  <Line
    type="monotone"
    dataKey="positiveBalance"
    stroke="#64748b" // Changed to grey
    strokeWidth={3}
    strokeDasharray="5 5"
    dot={<PositiveDot />}
    connectNulls={true}
    isAnimationActive={true}
  />
)}
{showBalance && (
  <Line
    type="monotone"
    dataKey="negativeBalance"
    stroke="#64748b" // Changed to grey
    strokeWidth={3}
    strokeDasharray="5 5"
    dot={<NegativeDot />}
    connectNulls={true}
    isAnimationActive={true}
  />
)}

{/* Create a custom render function for the account balance line */}
{/* {showAccountBalance && (
  <Line
    type="monotone"
    dataKey="accountBalance"
    strokeWidth={3}
    dot={<AccountBalanceDot />}
    isAnimationActive={true}
    // Use a render function to dynamically color the line segments
    stroke={(point) => (point.accountBalance >= 0 ? "#22c55e" : "#ef4444")}
  />
)} */}
{/* Balance visualization */}
{showAccountBalance && (
                                        <Line
                                            type="monotone"
                                            dataKey="accountBalance"
                                            stroke="#eab308"
                                            strokeWidth={3}
                                            dot={false}
                                            connectNulls={true}
                                            zIndex={3}
                                        />
                                )}
                            {showAccountBalance && (
                                        <Line
                                            type="monotone"
                                            dataKey="accountBalance"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            dot={<AccPositiveDot />}
                                            connectNulls={true}
                                            zIndex={4}
                                        />)}

                                        {showAccountBalance && (
                                        <Line
                                            type="monotone"
                                            dataKey="accountBalance"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            dot={<AccNegativeDot />}
                                            connectNulls={true}
                                            zIndex={4}
                                        />
                                )}

              
              {/* Zero Crossing Points */}
              {showCrossovers && (
                <Line
                  type="monotone"
                  dataKey="crossoverPoint"
                  stroke="none"
                  strokeWidth={0}
                  dot={<CrossoverDot />}
                  activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2, fill: '#f59e0b' }}
                  isAnimationActive={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </motion.div>
      
      {shouldRenderChart && (
        <SummaryContainer>
          <h3>Financial Summary</h3>
          <SummaryGrid>
            <SummaryCard>
              <h4>Total Income</h4>
              <p>${chartData.length > 0 ? chartData[chartData.length - 1].cumulativeIncome.toFixed(2) : "0.00"}</p>
            </SummaryCard>
            <SummaryCard>
              <h4>Total Expenses</h4>
              <p>${chartData.length > 0 ? chartData[chartData.length - 1].cumulativeExpense.toFixed(2) : "0.00"}</p>
            </SummaryCard>
            <SummaryCard 
              style={{ backgroundColor: chartData.length > 0 && chartData[chartData.length - 1].cumulativeBalance >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" }}
            >
              <h4>Net Balance (Period)</h4>
              <p style={{ color: chartData.length > 0 && chartData[chartData.length - 1].cumulativeBalance >= 0 ? "#22c55e" : "#ef4444" }}>
                ${chartData.length > 0 ? Math.abs(chartData[chartData.length - 1].cumulativeBalance).toFixed(2) : "0.00"}
                {chartData.length > 0 && chartData[chartData.length - 1].cumulativeBalance < 0 ? " (Deficit)" : ""}
              </p>
            </SummaryCard>
            <SummaryCard 
              style={{ backgroundColor: chartData.length > 0 && chartData[chartData.length - 1].accountBalance >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }}
            >
              <h4>Account Balance (All Time)</h4>
              <p style={{ color: chartData.length > 0 && chartData[chartData.length - 1].accountBalance >= 0 ? "#10b981" : "#ef4444" }}>
                ${chartData.length > 0 ? Math.abs(chartData[chartData.length - 1].accountBalance).toFixed(2) : "0.00"}
                {chartData.length > 0 && chartData[chartData.length - 1].accountBalance < 0 ? " (Deficit)" : ""}
              </p>
            </SummaryCard>
          </SummaryGrid>
          
          {/* Crossover Alert */}
          {chartData.some(item => item.crossoverPoint !== null && item.crossoverPoint !== undefined) && showCrossovers && (
            <CrossoverAlert>
              <span>⚠️</span> Your balance crossed zero during this period. Check the yellow markers on the chart.
            </CrossoverAlert>
          )}
        </SummaryContainer>
      )}
    </Container>
  );
};

export default DetailedChartsContainer;

/* Styled Components */
const Container = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  overflow: hidden;
`;

const HeaderContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .chart-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }
  
  .chart-subtitle {
    font-size: 0.875rem;
    color: #64748b;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
  }
  
  select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background-color: white;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const LegendWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${(props) => (props.active ? '#1e293b' : '#94a3b8')};
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background-color: ${(props) => (props.active ? '#f8fafc' : 'transparent')};
  transition: all 0.2s;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const SummaryContainer = styled.div`
  margin-top: 2rem;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const SummaryCard = styled.div`
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  h4 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
  }
`;

const CrossoverAlert = styled.div`
  margin-top: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  span {
    font-size: 1.25rem;
  }
`;

const LoadingContainer = styled.div`
  padding: 3rem;
  text-align: center;
  color: #64748b;
  font-size: 1rem;
`;

const NoDataContainer = styled.div`
  padding: 3rem;
  text-align: center;
  color: #64748b;
  font-size: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
`;
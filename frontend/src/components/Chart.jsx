import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { useGlobalContext } from "../context/GlobalContext";
import moment from "moment";

const ChartsContainer = () => {
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

    // Improved transaction categorization function with cumulative balance
    const categorizeTransactions = (transactions) => {
        const groupedData = {};

        // Filter transactions by date range
        const filteredTransactions = transactions.filter(transaction => 
            isWithinDateRange(transaction.date)
        );

        // Sort transactions by date (oldest first) for cumulative calculation
        filteredTransactions.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());

        // First, categorize and calculate per-period metrics
        filteredTransactions.forEach((transaction) => {
            // Use 'date' field instead of 'createdAt'
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
                    periodBalance: 0,  // Balance for just this period
                    cumulativeIncome: 0, // Running total of income
                    cumulativeExpense: 0, // Running total of expenses
                    cumulativeBalance: 0, // Running total of balance
                    positiveBalance: 0,
                    negativeBalance: 0
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

        result.forEach(item => {
            // Update running totals
            runningIncome += Number(item.income) || 0;
            runningExpense += Number(item.expense) || 0;
            runningBalance = runningIncome - runningExpense;
            
            // Assign cumulative values
            item.cumulativeIncome = runningIncome;
            item.cumulativeExpense = runningExpense;
            item.cumulativeBalance = runningBalance;
            
            // Add positive and negative balance properties
            item.positiveBalance = runningBalance >= 0 ? runningBalance : 0;
            item.negativeBalance = runningBalance < 0 ? runningBalance : 0;
            
            // Add balance type indicator for coloring
            item.balanceType = runningBalance >= 0 ? "positive" : "negative";
            
            // Add separate points for positive and negative balances (for custom points)
            item.positivePoint = runningBalance >= 0 ? runningBalance : null;
            item.negativePoint = runningBalance < 0 ? runningBalance : null;
            item.lineColor = item.cumulativeBalance >= 0 ? '#22c55e' : '#ef4444';

            item.positiveOverlay = item.cumulativeBalance >= 0 ? item.cumulativeBalance : null;
            item.negativeOverlay = item.cumulativeBalance < 0 ? item.cumulativeBalance : null;

    item.balanceColor = item.cumulativeBalance >= 0 ? '#22c55e' : '#ef4444';
    item.balance = Number(item.cumulativeBalance);
    item.positive = item.balance >= 0 ? item.balance : null;
    item.negative = item.balance < 0 ? item.balance : null; 


        // Add explicit x-axis coordinate
        item.xIndex = result.indexOf(item);
});
            
        // Set no data flag
        setNoData(result.length === 0);
        
        return result;
    };
    
    // Memoized chart data
    const chartData = useMemo(() => {
        const allTransactions = [
            ...incomes.map(inc => ({ ...inc, type: "income" })),
            ...expenses.map(exp => ({ ...exp, type: "expense" }))
        ];
        return categorizeTransactions(allTransactions);
        
    }, [incomes, expenses, filter, yearFilter, useMonthRange, startMonth, endMonth]);
    
    const crossings = useMemo(() => {
        const crosses = [];
        for (let i = 1; i < chartData.length; i++) {
          const prev = chartData[i - 1].cumulativeBalance;
          const curr = chartData[i].cumulativeBalance;
          if (prev * curr < 0) { // Detect sign change
            crosses.push(i - 0.5); // Midpoint between data points
          }
        }
        return crosses;
      }, [chartData]);
    // Custom tooltip to show period balance instead of cumulative
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Find all visible metrics
            const visibleItems = payload.filter(item => {
                const name = item.name;
                if (name === 'income' && !showIncome) return false;
                if (name === 'expense' && !showExpense) return false;
                if (['cumulativeBalance', 'positiveBalance', 'negativeBalance', 'positivePoint', 'negativePoint'].includes(name) && !showBalance) return false;
                if (['positiveBalance', 'negativeBalance', 'positivePoint', 'negativePoint'].includes(name)) return false;
                return true;
            });
            
            // Calculate period balance for tooltip
            const incomeValue = payload.find(p => p.name === 'income')?.value || 0;
            const expenseValue = payload.find(p => p.name === 'expense')?.value || 0;
            const periodBalance = incomeValue - expenseValue;
            
            // Get cumulative balance for tooltip color
            const balanceValue = payload.find(p => p.name === 'cumulativeBalance')?.value || 0;
            const balanceColor = balanceValue >= 0 ? '#22c55e' : '#ef4444';

            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {visibleItems.map((item, index) => {
                        let name = item.name;
                        let value = item.value;
                        let color = item.color;
                        
                        // Map names to more user-friendly labels
                        if (name === 'income') name = 'Income';
                        else if (name === 'expense') name = 'Expense';
                        else if (name === 'cumulativeBalance') {
                            name = 'Balance';
                            color = balanceColor; // Dynamically set color based on value
                        }
                        
                        return (
                            <p key={index} style={{ color }}>
                                {name}: ${value.toFixed(2)}
                            </p>
                        );
                    })}
                    
                    {/* Only show period balance if both income and expense are visible */}
                    {showIncome && showExpense && (
                        <p style={{ color: periodBalance >= 0 ? '#22c55e' : '#ef4444' }}>
                            Period Balance: ${periodBalance.toFixed(2)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Custom line dot component to render different colors based on balance
    const CustomBalanceDot = (props) => {
        const { cx, cy, value, dataKey } = props;
        
        if (cx === undefined || cy === undefined) return null;
        
        // Set color based on which line (positivePoint or negativePoint) the dot belongs to
        // This ensures dots match their line colors without depending on the value
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
// Positive dots component (green dots)
const PositiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // Only render if it's a positive value and coordinates exist
    if (cx === undefined || cy === undefined || value === null) return null;
    
    // Check if this is truly a positive point (additional safety)
    // if (value < 0) return null;
    
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
                        onChange={(e) => setFilter(e.target.value)}>
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
                        onChange={(e) => setUseMonthRange(e.target.value === "month")}>
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
                                onChange={(e) => setStartMonth(e.target.value)}>
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
                                onChange={(e) => setEndMonth(e.target.value)}>
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
                            onChange={(e) => setYearFilter(e.target.value)}>
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
                <HeaderContainer className="content-center
">
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
                        <LegendColor color="#22c55e" />
                        <span>Balance</span>
                    </LegendItem>
                </LegendWrapper>
                
                {noData ? (
                    <NoDataContainer>
                        <p>No transactions found for the selected period.</p>
                    </NoDataContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorPositiveBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorNegativeBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            
                            <XAxis 
        dataKey="xIndex"
        type="number"
        tickFormatter={(index) => chartData[index]?.displayCategory || ''}
        domain={[0, chartData.length - 1]}
        tickLine={false}
        axisLine={false}
        tick={{ fill: '#6b7280', fontSize: 12 }}
        angle={-45}
        textAnchor="end"
        height={70}/>
                            
                            <YAxis 
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            
                            {/* Reference line at y=0 for balance */}
                            {showBalance && (
                                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                            )}
                            
                            <Tooltip content={<CustomTooltip />} 
                                contentStyle={{ 
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    padding: '0.75rem',
                                    backgroundColor: 'white'
                                }}
                            />
                            
                            {/* Income Area */}
                            {showIncome && (
                                <Area
                                    type="monotone" 
                                    dataKey="income" 
                                    stroke="#3B82F6" 
                                    strokeWidth={3} 
                                    fill="url(#colorIncome)"
                                    dot={{ r: 4, fill: "#3B82F6", stroke: "#fff", strokeWidth: 1 }}
                                    activeDot={{ r: 6 }}
                                    name="income"
                                    isAnimationActive={true}
                                    zIndex={1}
                                />
                            )}
                            
                            {/* Expense Area */}
                            {showExpense && (
                                <Area 
                                    type="monotone" 
                                    dataKey="expense" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={3} 
                                    fill="url(#colorExpense)" 
                                    dot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 1 }}
                                    activeDot={{ r: 6 }}
                                    name="expense"
                                    isAnimationActive={true}
                                    zIndex={1}
                                />
                            )}
                            
                            {/* Positive Balance Area */}
                            {showBalance && (
                                <Area 
                                    type="monotone" 
                                    dataKey="positiveBalance" 
                                    stroke="none"
                                    fill="url(#colorPositiveBalance)" 
                                    isAnimationActive={true}
                                    fillOpacity={0.5}
                                    zIndex={2}
                                />
                            )}
                            
                            {/* Negative Balance Area */}
                            {showBalance && (
                                <Area 
                                    type="monotone" 
                                    dataKey="negativeBalance" 
                                    stroke="none"
                                    fill="url(#colorNegativeBalance)" 
                                    isAnimationActive={true}
                                    fillOpacity={0.5}
                                    zIndex={2}
                                />
                            )}
                            
                            {/* Balance visualization */}
                                {showBalance && (
                                        <Line
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            dot={<PositiveDot />}
                                            connectNulls={true}
                                            zIndex={3}
                                        />
                                )}
                            
                                        

                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </motion.div>
        </Container>
    );
};

// Styled Components
const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
    font-size: 1.2rem;
    color: #666;
`;

const NoDataContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #666;
    border: 1px dashed #ccc;
    border-radius: 8px;
    margin: 2rem 0;
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 1rem;
    padding: 1rem;

    .chart-box {
        width: 90%;
        max-width: 900px;
        background: #fff;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 1px 1px 15px rgba(0, 0, 0, 0.1);
        text-align: left;
        position: relative;
    }

    .chart-title {
        font-size: 1.5rem;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .chart-subtitle {
        font-size: 0.9rem;
        color: #6b7280;
        margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
        .chart-box {
            width: 100%;
            padding: 1rem;
        }
    }
        .recharts-wrapper {
    overflow: visible !important;
  }
  
  .recharts-surface {
    overflow: visible !important;
  }
    
    .custom-tooltip {
        background-color: white;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        
        .tooltip-label {
            margin-bottom: 8px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        p {
            margin: 5px 0;
            font-size: 14px;
        }
    }
`;

const FiltersContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1rem;
    align-items: center;
    justify-content: center;
`;

const FilterGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: #333;
    
    select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
    }
`;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
`;

const LegendWrapper = styled.div`
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    opacity: ${props => props.active ? 1 : 0.5};
    transition: opacity 0.2s;
    
    &:hover {
        opacity: 0.8;
    }
`;

const LegendColor = styled.div`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => props.color};
`;

export default ChartsContainer;
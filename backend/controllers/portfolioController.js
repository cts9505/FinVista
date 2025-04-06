import { 
    FixedDepositModel, 
    PPFModel, 
    CryptoModel, 
    StocksModel, 
    GoldModel, 
    MutualFundModel, 
    RealEstateModel,
    TransactionModel
  } from "../models/Portfolio.js";
  import userModel from "../models/model.js";
  import axios from "axios";
  // Updated portfolio summary to include new investment types
  export const portfolioSummary = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Get all investments
      const stocks = await StocksModel.find({ userId });
      const gold = await GoldModel.find({ userId });
      const realEstate = await RealEstateModel.find({ userId });
      const mutualFunds = await MutualFundModel.find({ userId });
      const fixedDeposits = await FixedDepositModel.find({ userId });
      const ppfAccounts = await PPFModel.find({ userId });
      const cryptos = await CryptoModel.find({ userId });
      
      // [EXISTING CODE FOR STOCKS, GOLD, REAL ESTATE, MUTUAL FUNDS]
      // ... (keep your existing calculation logic)
      
      // Calculate fixed deposit values
      let fdCurrentValue = 0;
      const fdInvestedValue = fixedDeposits.reduce((total, fd) => 
        total + fd.depositAmount, 0);
      
      for (const fd of fixedDeposits) {
        // Calculate years from start to maturity
        const startDate = new Date(fd.startDate);
        const maturityDate = new Date(fd.maturityDate);
        const yearsToMaturity = (maturityDate - startDate) / (365 * 24 * 60 * 60 * 1000);
        
        if (fd.interestType === 'simple') {
          // Simple interest: A = P(1 + rt)
          const maturityAmount = fd.depositAmount * (1 + (fd.interestRate/100) * yearsToMaturity);
          
          // Calculate current value based on time elapsed
          const currentDate = new Date();
          const yearsElapsed = Math.min(
            yearsToMaturity,
            (currentDate - startDate) / (365 * 24 * 60 * 60 * 1000)
          );
          
          const currentValue = fd.depositAmount * (1 + (fd.interestRate/100) * yearsElapsed);
          fdCurrentValue += currentValue;
        } else {
          // Compound interest
          const maturityAmount = calculateFDMaturityAmount(
            fd.depositAmount, 
            fd.interestRate, 
            yearsToMaturity, 
            fd.compoundFrequency
          );
          
          // For current value, calculate based on time elapsed
          const currentDate = new Date();
          const yearsElapsed = Math.min(
            yearsToMaturity,
            (currentDate - startDate) / (365 * 24 * 60 * 60 * 1000)
          );
          
          const currentValue = calculateFDMaturityAmount(
            fd.depositAmount, 
            fd.interestRate, 
            yearsElapsed, 
            fd.compoundFrequency
          );
          
          fdCurrentValue += currentValue;
        }
      }
      
      // Calculate PPF values
      let ppfCurrentValue = 0;
      const ppfInvestedValue = ppfAccounts.reduce((total, ppf) => 
        total + ppf.totalInvestment, 0);
      
      for (const ppf of ppfAccounts) {
        const estimatedValue = calculatePPFValue(
          ppf.yearlyContributions, 
          ppf.currentInterestRate
        );
        ppfCurrentValue += estimatedValue;
      }
      
      // Calculate crypto values
      let cryptoCurrentValue = 0;
      const cryptoInvestedValue = cryptos.reduce((total, crypto) => 
        total + (crypto.buyPrice * crypto.quantity), 0);
      
      // Fetch current crypto prices
      for (const crypto of cryptos) {
        try {
          const currentPrice = await getCryptoPrice(crypto.coinId);
          if (currentPrice) {
            cryptoCurrentValue += currentPrice * crypto.quantity;
          } else {
            // Fallback: use invested value as a conservative estimate
            cryptoCurrentValue += crypto.buyPrice * crypto.quantity;
          }
        } catch (error) {
          console.error(`Error calculating value for crypto ${crypto.name}:`, error);
          // Fallback
          cryptoCurrentValue += crypto.buyPrice * crypto.quantity;
        }
      }
      
      // Total portfolio value (including new investments)
      const totalInvestedValue = stockInvestedValue + goldInvestedValue + 
                                realEstateInvestedValue + mutualFundInvestedValue +
                                fdInvestedValue + ppfInvestedValue + cryptoInvestedValue;
                                
      const totalCurrentValue = stockCurrentValue + goldCurrentValue + 
                               realEstateCurrentValue + mutualFundCurrentValue +
                               fdCurrentValue + ppfCurrentValue + cryptoCurrentValue;
      
      res.json({
        totalInvestedValue,
        totalCurrentValue,
        overallGrowth: totalInvestedValue > 0 ? 
                      ((totalCurrentValue - totalInvestedValue) / totalInvestedValue) * 100 : 0,
        categoryBreakdown: {
          stocks: {
            investedValue: stockInvestedValue,
            currentValue: stockCurrentValue,
            growth: stockInvestedValue > 0 ? ((stockCurrentValue - stockInvestedValue) / stockInvestedValue) * 100 : 0,
            count: stocks.length
          },
          gold: {
            investedValue: goldInvestedValue,
            currentValue: goldCurrentValue,
            growth: goldInvestedValue > 0 ? ((goldCurrentValue - goldInvestedValue) / goldInvestedValue) * 100 : 0,
            count: gold.length
          },
          realEstate: {
            investedValue: realEstateInvestedValue,
            currentValue: realEstateCurrentValue,
            growth: realEstateInvestedValue > 0 ? ((realEstateCurrentValue - realEstateInvestedValue) / realEstateInvestedValue) * 100 : 0,
            count: realEstate.length
          },
          mutualFunds: {
            investedValue: mutualFundInvestedValue,
            currentValue: mutualFundCurrentValue,
            growth: mutualFundInvestedValue > 0 ? ((mutualFundCurrentValue - mutualFundInvestedValue) / mutualFundInvestedValue) * 100 : 0,
            count: mutualFunds.length
          },
          fixedDeposits: {
            investedValue: fdInvestedValue,
            currentValue: fdCurrentValue,
            growth: fdInvestedValue > 0 ? ((fdCurrentValue - fdInvestedValue) / fdInvestedValue) * 100 : 0,
            count: fixedDeposits.length
          },
          ppf: {
            investedValue: ppfInvestedValue,
            currentValue: ppfCurrentValue,
            growth: ppfInvestedValue > 0 ? ((ppfCurrentValue - ppfInvestedValue) / ppfInvestedValue) * 100 : 0,
            count: ppfAccounts.length
          },
          crypto: {
            investedValue: cryptoInvestedValue,
            currentValue: cryptoCurrentValue,
            growth: cryptoInvestedValue > 0 ? ((cryptoCurrentValue - cryptoInvestedValue) / cryptoInvestedValue) * 100 : 0,
            count: cryptos.length
          }
        }
      });
    } catch (error) {
      console.error("Error fetching portfolio summary:", error);
      res.status(500).json({ error: "Failed to fetch portfolio summary" });
    }
  };
// Utility function to fetch latest gold price in INR per gram
export const getRealizedProfits = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Get all sell transactions
      const transactions = await TransactionModel.find({ 
        userId, 
        transactionType: "sell"
      }).sort({ sellDate: -1 });
      
      // Calculate total realized profit
      const totalRealizedProfit = transactions.reduce((total, transaction) => 
        total + transaction.profit, 0);
      
      // Get realized profits by asset type
      const assetTypeProfits = {};
      
      transactions.forEach(transaction => {
        const { assetType, profit } = transaction;
        if (!assetTypeProfits[assetType]) {
          assetTypeProfits[assetType] = 0;
        }
        assetTypeProfits[assetType] += profit;
      });
      
      // Get top profitable assets
      const symbolProfits = {};
      
      transactions.forEach(transaction => {
        const { symbol, profit } = transaction;
        if (symbol) {
          if (!symbolProfits[symbol]) {
            symbolProfits[symbol] = 0;
          }
          symbolProfits[symbol] += profit;
        }
      });
      
      const topProfitableAssets = Object.entries(symbolProfits)
        .map(([symbol, profit]) => ({ symbol, profit }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);
      
      res.json({
        totalRealizedProfit,
        transactions,
        assetTypeProfits,
        topProfitableAssets
      });
    } catch (error) {
      console.error("Error fetching realized profits:", error);
      res.status(500).json({ error: "Failed to fetch realized profits" });
    }
  };
  export const getTransactionHistory = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { assetType, symbol, startDate, endDate, transactionType } = req.query;
      
      // Build filter object
      const filter = { userId };
      
      if (assetType) filter.assetType = assetType;
      if (symbol) filter.symbol = symbol;
      if (transactionType) filter.transactionType = transactionType;
      
      // Date filters
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      const transactions = await TransactionModel.find(filter).sort({ createdAt: -1 });
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  };

const getGoldPrice = async () => {
  try {
    // Fetch Gold Price (USD per Ounce)
    const goldResponse = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/GC=F");
    const goldPriceUSD = goldResponse.data.chart.result[0].meta.regularMarketPrice;
    
    // Fetch USD to INR Exchange Rate
    const forexResponse = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X");
    const usdToInr = forexResponse.data.chart.result[0].meta.regularMarketPrice;
    
    // Convert USD per Ounce → INR per Gram
    const goldPriceINRPerGram = (goldPriceUSD * usdToInr) / 31.1035;
    return goldPriceINRPerGram;
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return null;
  }
};

// Utility function to fetch mutual fund NAV data
const getMutualFundNAV = async (schemeCode) => {
  try {
    const response = await axios.get("https://www.amfiindia.com/spages/NAVAll.txt");
    const navData = response.data;
    
    // Parse the text data
    const lines = navData.split('\n');
    for (const line of lines) {
      const parts = line.split(';');
      if (parts.length >= 5 && parts[0] === schemeCode) {
        return {
          schemeName: parts[1],
          nav: parseFloat(parts[4])
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching mutual fund NAV:", error);
    return null;
  }
};

// // Portfolio summary endpoint
// export const portfolioSummary = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const user = await userModel.findById(userId);
//     if (!user) {
//       throw new Error("User not found");
//     }
    
//     // Get all investments
//     const stocks = await StocksModel.find({ userId });
//     const gold = await GoldModel.find({ userId });
//     const realEstate = await RealEstateModel.find({ userId });
//     const mutualFunds = await MutualFundModel.find({ userId });
    
//     // Calculate stock values
//     let stockCurrentValue = 0;
//     let stockInvestedValue = 0;
    
//     for (const stock of stocks) {
//       try {
//         const { data } = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`);
//         const currentPrice = data.chart.result[0].meta.regularMarketPrice;
//         stockCurrentValue += currentPrice * stock.quantity;
//         stockInvestedValue += stock.buyPrice * stock.quantity;
//       } catch (error) {
//         console.error(`Error fetching data for ${stock.symbol}:`, error);
//       }
//     }
    
//     // Calculate gold values
//     const currentGoldPrice = await getGoldPrice() || 0;
//     const goldCurrentValue = gold.reduce((total, item) => 
//       total + (currentGoldPrice * item.quantity), 0);
//     const goldInvestedValue = gold.reduce((total, item) => 
//       total + (item.buyPrice * item.quantity), 0);
    
//     // Calculate real estate values
//     const realEstateCurrentValue = realEstate.reduce((total, property) => 
//       total + (property.currentValuation || property.purchasePrice), 0);
//     const realEstateInvestedValue = realEstate.reduce((total, property) => 
//       total + property.purchasePrice, 0);
    
//     // Calculate mutual fund values
//     let mutualFundCurrentValue = 0;
//     const mutualFundInvestedValue = mutualFunds.reduce((total, fund) => 
//       total + fund.investmentAmount, 0);
    
//     for (const fund of mutualFunds) {
//       try {
//         const navData = await getMutualFundNAV(fund.schemeCode);
//         if (navData) {
//           const currentValue = (fund.units * navData.nav);
//           mutualFundCurrentValue += currentValue;
//         } else {
//           // If NAV not found, use a conservative estimate
//           mutualFundCurrentValue += fund.investmentAmount * 1.05;
//         }
//       } catch (error) {
//         console.error(`Error calculating value for mutual fund ${fund.schemeName}:`, error);
//       }
//     }
    
//     // Total portfolio value
//     const totalInvestedValue = stockInvestedValue + goldInvestedValue + 
//                               realEstateInvestedValue + mutualFundInvestedValue;
//     const totalCurrentValue = stockCurrentValue + goldCurrentValue + 
//                              realEstateCurrentValue + mutualFundCurrentValue;
    
//     res.json({
//       totalInvestedValue,
//       totalCurrentValue,
//       overallGrowth: ((totalCurrentValue - totalInvestedValue) / totalInvestedValue) * 100,
//       categoryBreakdown: {
//         stocks: {
//           investedValue: stockInvestedValue,
//           currentValue: stockCurrentValue,
//           growth: stockInvestedValue > 0 ? ((stockCurrentValue - stockInvestedValue) / stockInvestedValue) * 100 : 0,
//           count: stocks.length
//         },
//         gold: {
//           investedValue: goldInvestedValue,
//           currentValue: goldCurrentValue,
//           growth: goldInvestedValue > 0 ? ((goldCurrentValue - goldInvestedValue) / goldInvestedValue) * 100 : 0,
//           count: gold.length,
//           currentPrice: currentGoldPrice
//         },
//         realEstate: {
//           investedValue: realEstateInvestedValue,
//           currentValue: realEstateCurrentValue,
//           growth: realEstateInvestedValue > 0 ? ((realEstateCurrentValue - realEstateInvestedValue) / realEstateInvestedValue) * 100 : 0,
//           count: realEstate.length
//         },
//         mutualFunds: {
//           investedValue: mutualFundInvestedValue,
//           currentValue: mutualFundCurrentValue,
//           growth: mutualFundInvestedValue > 0 ? ((mutualFundCurrentValue - mutualFundInvestedValue) / mutualFundInvestedValue) * 100 : 0,
//           count: mutualFunds.length
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching portfolio summary:", error);
//     res.status(500).json({ error: "Failed to fetch portfolio summary" });
//   }
// };
// STOCK CONTROLLERS
export const getStocks = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const stocks = await StocksModel.find({ userId }).sort({ createdAt: -1 });
    
    // Fetch current prices from Yahoo Finance
    const stocksWithCurrentPrices = await Promise.all(stocks.map(async (stock) => {
      try {
        const { data } = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`);
        const currentPrice = data.chart.result[0].meta.regularMarketPrice;
        const changePercent = data.chart.result[0].meta.regularMarketChangePercent || 0;
        
        return {
          ...stock.toObject(),
          currentPrice,
          change: changePercent,
          currentValue: currentPrice * stock.quantity,
          investedValue: stock.buyPrice * stock.quantity,
          profit: (currentPrice - stock.buyPrice) * stock.quantity,
          profitPercentage: ((currentPrice - stock.buyPrice) / stock.buyPrice) * 100
        };
      } catch (error) {
        console.error(`Error fetching current price for ${stock.symbol}:`, error);
        return stock.toObject();
      }
    }));
    
    res.json(stocksWithCurrentPrices);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
};

export const addStock = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { symbol, name, buyDate, buyPrice, quantity, sector, notes } = req.body;
      
      // Validate the stock symbol
      try {
        await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      } catch (error) {
        return res.status(400).json({ error: "Invalid stock symbol" });
      }
      
      const newStock = new StocksModel({
        userId,
        symbol,
        name,
        buyDate,
        buyPrice,
        quantity,
        sector,
        notes
      });
      
      await newStock.save();
      
      // Record the buy transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "stock",
        assetId: newStock._id,
        symbol,
        name,
        transactionType: "buy",
        buyPrice,
        quantity,
        buyDate: new Date(buyDate),
        notes: notes || `Bought ${quantity} shares of ${name}`
      });
      
      await transaction.save();
      
      res.status(201).json({
        stock: newStock,
        transaction
      });
    } catch (error) {
      console.error("Error adding stock:", error);
      res.status(500).json({ error: "Failed to add stock" });
    }
  };
  
export const updateStock = async (req, res) => {
  try {
    const userId = req.userId;
    const stockId = req.params.id;
    
    // Find the stock and verify ownership
    const stock = await StocksModel.findById(stockId);
    if (!stock || stock.userId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to modify this stock" });
    }
    
    const updatedStock = await StocksModel.findByIdAndUpdate(
      stockId,
      req.body,
      { new: true }
    );
    
    res.json(updatedStock);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
};

export const deleteStock = async (req, res) => {
  try {
    const userId = req.userId;
    const stockId = req.params.id;
    
    // Find the stock and verify ownership
    const stock = await StocksModel.findById(stockId);
    if (!stock || stock.userId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this stock" });
    }
    
    await StocksModel.findByIdAndDelete(stockId);
    res.json({ message: "Stock deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock:", error);
    res.status(500).json({ error: "Failed to delete stock" });
  }
};

export const sellStock = async (req, res) => {
    try {
      const userId = req.userId;
      const stockId = req.params.id;
      const { sellPrice, sellDate, quantity, notes } = req.body;
      
      // Find the stock and verify ownership
      const stock = await StocksModel.findById(stockId);
      if (!stock || stock.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to sell this stock" });
      }
      
      if (quantity > stock.quantity) {
        return res.status(400).json({ error: "Cannot sell more shares than owned" });
      }
      
      // Calculate profit/loss
      const profit = (sellPrice - stock.buyPrice) * quantity;
      const profitPercentage = ((sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
      
      // Record the transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "stock",
        assetId: stockId,
        symbol: stock.symbol,
        name: stock.name,
        transactionType: "sell",
        buyPrice: stock.buyPrice,
        sellPrice,
        quantity,
        buyDate: stock.buyDate,
        sellDate: new Date(sellDate),
        profit,
        profitPercentage,
        notes: notes || `Sold ${quantity} shares of ${stock.name}`
      });
      
      await transaction.save();
      
      // If selling all shares, delete the stock
      if (quantity === stock.quantity) {
        await StocksModel.findByIdAndDelete(stockId);
      } else {
        // Otherwise update the quantity
        await StocksModel.findByIdAndUpdate(
          stockId,
          { $inc: { quantity: -quantity } }
        );
      }
      
      res.json({ 
        message: "Stock sold successfully",
        profit,
        profitPercentage,
        transaction: transaction
      });
    } catch (error) {
      console.error("Error selling stock:", error);
      res.status(500).json({ error: "Failed to sell stock" });
    }
  };
  
// GOLD CONTROLLERS
export const getGold = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const gold = await GoldModel.find({ userId }).sort({ createdAt: -1 });
    const currentGoldPrice = await getGoldPrice();
    
    const goldWithCurrentValues = gold.map(item => {
      const currentValue = currentGoldPrice * item.quantity;
      return {
        ...item.toObject(),
        currentPrice: currentGoldPrice,
        currentValue,
        investedValue: item.buyPrice * item.quantity,
        profit: currentValue - (item.buyPrice * item.quantity),
        profitPercentage: ((currentGoldPrice - item.buyPrice) / item.buyPrice) * 100
      };
    });
    
    res.json(goldWithCurrentValues);
  } catch (error) {
    console.error("Error fetching gold investments:", error);
    res.status(500).json({ error: "Failed to fetch gold investments" });
  }
};

export const addGold = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { type, purity, buyDate, buyPrice, quantity, description } = req.body;
      
      const newGold = new GoldModel({
        userId,
        type, // e.g., coin, bar, jewelry
        purity, // e.g., 24K, 22K
        buyDate,
        buyPrice, // per gram
        quantity, // in grams
        description
      });
      
      await newGold.save();
      
      // Record the buy transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "gold",
        assetId: newGold._id,
        symbol: `${type} ${purity}`,
        name: `Gold ${type} (${purity})`,
        transactionType: "buy",
        buyPrice,
        quantity,
        buyDate: new Date(buyDate),
        notes: description || `Bought ${quantity}g of ${purity} gold ${type}`
      });
      
      await transaction.save();
      
      res.status(201).json({
        gold: newGold,
        transaction
      });
    } catch (error) {
      console.error("Error adding gold investment:", error);
      res.status(500).json({ error: "Failed to add gold investment" });
    }
  };
  
  export const updateGold = async (req, res) => {
    try {
      const userId = req.userId;
      const goldId = req.params.id;
      
      // Find the gold and verify ownership
      const gold = await GoldModel.findById(goldId);
      if (!gold || gold.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this gold investment" });
      }
      
      const updatedGold = await GoldModel.findByIdAndUpdate(
        goldId,
        req.body,
        { new: true }
      );
      
      // Update the associated transaction if it exists
      if (req.body.buyPrice || req.body.quantity || req.body.buyDate || req.body.description) {
        await TransactionModel.findOneAndUpdate(
          { 
            userId,
            assetType: "gold",
            assetId: goldId,
            transactionType: "buy"
          },
          { 
            buyPrice: req.body.buyPrice || gold.buyPrice,
            quantity: req.body.quantity || gold.quantity,
            buyDate: req.body.buyDate ? new Date(req.body.buyDate) : gold.buyDate,
            notes: req.body.description || gold.description
          }
        );
      }
      
      res.json(updatedGold);
    } catch (error) {
      console.error("Error updating gold investment:", error);
      res.status(500).json({ error: "Failed to update gold investment" });
    }
  };
  
  export const deleteGold = async (req, res) => {
    try {
      const userId = req.userId;
      const goldId = req.params.id;
      
      // Find the gold and verify ownership
      const gold = await GoldModel.findById(goldId);
      if (!gold || gold.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this gold investment" });
      }
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "gold",
        assetId: goldId
      });
      
      await GoldModel.findByIdAndDelete(goldId);
      res.json({ message: "Gold investment deleted successfully" });
    } catch (error) {
      console.error("Error deleting gold investment:", error);
      res.status(500).json({ error: "Failed to delete gold investment" });
    }
  };
  
  export const sellGold = async (req, res) => {
    try {
      const userId = req.userId;
      const goldId = req.params.id;
      const { sellPrice, sellDate, quantity, notes } = req.body;
      
      // Find the gold and verify ownership
      const gold = await GoldModel.findById(goldId);
      if (!gold || gold.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to sell this gold investment" });
      }
      
      if (quantity > gold.quantity) {
        return res.status(400).json({ error: "Cannot sell more gold than owned" });
      }
      
      // Calculate profit/loss
      const profit = (sellPrice - gold.buyPrice) * quantity;
      const profitPercentage = ((sellPrice - gold.buyPrice) / gold.buyPrice) * 100;
      
      // Record the sell transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "gold",
        assetId: goldId,
        symbol: `${gold.type} ${gold.purity}`,
        name: `Gold ${gold.type} (${gold.purity})`,
        transactionType: "sell",
        buyPrice: gold.buyPrice,
        sellPrice,
        quantity,
        buyDate: gold.buyDate,
        sellDate: new Date(sellDate),
        profit,
        profitPercentage,
        notes: notes || `Sold ${quantity}g of ${gold.purity} gold ${gold.type}`
      });
      
      await transaction.save();
      
      // If selling all, delete the record
      if (quantity === gold.quantity) {
        await GoldModel.findByIdAndDelete(goldId);
      } else {
        // Otherwise update the quantity
        await GoldModel.findByIdAndUpdate(
          goldId,
          { $inc: { quantity: -quantity } }
        );
      }
      
      res.json({ 
        message: "Gold sold successfully",
        profit,
        profitPercentage,
        transaction
      });
    } catch (error) {
      console.error("Error selling gold:", error);
      res.status(500).json({ error: "Failed to sell gold" });
    }
  };

// MUTUAL FUND CONTROLLERS
export const getMutualFunds = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const mutualFunds = await MutualFundModel.find({ userId }).sort({ createdAt: -1 });
    
    // Fetch current NAVs and calculate current values
    const fundsWithCurrentValues = await Promise.all(mutualFunds.map(async (fund) => {
      try {
        const navData = await getMutualFundNAV(fund.schemeCode);
        if (navData) {
          const currentNav = navData.nav;
          const currentValue = fund.units * currentNav;
          return {
            ...fund.toObject(),
            currentNav,
            currentValue,
            investedValue: fund.investmentAmount,
            profit: currentValue - fund.investmentAmount,
            profitPercentage: ((currentValue - fund.investmentAmount) / fund.investmentAmount) * 100
          };
        } else {
          // If NAV not found, use a conservative estimate
          return {
            ...fund.toObject(),
            currentNav: 'Not available',
            currentValue: fund.investmentAmount * 1.05,
            investedValue: fund.investmentAmount,
            profit: fund.investmentAmount * 0.05,
            profitPercentage: 5
          };
        }
      } catch (error) {
        console.error(`Error calculating value for mutual fund ${fund.schemeName}:`, error);
        return fund.toObject();
      }
    }));
    
    res.json(fundsWithCurrentValues);
  } catch (error) {
    console.error("Error fetching mutual funds:", error);
    res.status(500).json({ error: "Failed to fetch mutual funds" });
  }
};

export const searchMutualFunds = async (req, res) => {
  try {
    const { query } = req.params;
    
    try {
      const response = await axios.get("https://www.amfiindia.com/spages/NAVAll.txt");
      const navData = response.data;
      
      // Parse the text data
      const lines = navData.split('\n');
      const results = [];
      
      for (const line of lines) {
        const parts = line.split(';');
        if (parts.length >= 5 && parts[1] && parts[1].toLowerCase().includes(query.toLowerCase())) {
          results.push({
            schemeCode: parts[0],
            schemeName: parts[1],
            isinDiv: parts[2],
            isinGrowth: parts[3],
            nav: parseFloat(parts[4])
          });
          
          // Limit results to prevent overwhelming response
          if (results.length >= 20) break;
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error searching mutual funds:", error);
      res.status(500).json({ error: "Failed to search mutual funds" });
    }
  } catch (error) {
    console.error("Error searching mutual funds:", error);
    res.status(500).json({ error: "Failed to search mutual funds" });
  }
};

export const addMutualFund = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { schemeName, schemeCode, purchaseDate, investmentAmount, notes } = req.body;
      
      // Verify the scheme code
      try {
        const navData = await getMutualFundNAV(schemeCode);
        if (!navData) {
          return res.status(400).json({ error: "Invalid scheme code" });
        }
        
        // Calculate units based on NAV at the time of investment
        const units = investmentAmount / navData.nav;
        const purchaseNav = navData.nav;
        
        const newFund = new MutualFundModel({
          userId,
          schemeName,
          schemeCode,
          purchaseDate,
          investmentAmount,
          units,
          purchaseNav,
          notes
        });
        
        await newFund.save();
        
        // Record the buy transaction in history
        const transaction = new TransactionModel({
          userId,
          assetType: "mutualFund",
          assetId: newFund._id,
          symbol: schemeCode,
          name: schemeName,
          transactionType: "buy",
          buyPrice: purchaseNav,
          quantity: units,
          buyDate: new Date(purchaseDate),
          notes: notes || `Invested ₹${investmentAmount} in ${schemeName}`
        });
        
        await transaction.save();
        
        res.status(201).json({
          mutualFund: newFund,
          transaction
        });
      } catch (error) {
        console.error("Error verifying mutual fund scheme:", error);
        return res.status(400).json({ error: "Could not verify mutual fund scheme" });
      }
    } catch (error) {
      console.error("Error adding mutual fund:", error);
      res.status(500).json({ error: "Failed to add mutual fund" });
    }
  };
  
  export const updateMutualFund = async (req, res) => {
    try {
      const userId = req.userId;
      const fundId = req.params.id;
      
      // Find the fund and verify ownership
      const fund = await MutualFundModel.findById(fundId);
      if (!fund || fund.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this mutual fund" });
      }
      
      let newUnits = fund.units;
      let newPurchaseNav = fund.purchaseNav;
      
      // If investment amount is changed, recalculate units
      if (req.body.investmentAmount && req.body.investmentAmount !== fund.investmentAmount) {
        try {
          const navData = await getMutualFundNAV(fund.schemeCode);
          if (navData) {
            newUnits = req.body.investmentAmount / navData.nav;
            newPurchaseNav = navData.nav;
            req.body.units = newUnits;
            req.body.purchaseNav = newPurchaseNav;
          }
        } catch (error) {
          console.error("Error recalculating units:", error);
        }
      }
      
      const updatedFund = await MutualFundModel.findByIdAndUpdate(
        fundId,
        req.body,
        { new: true }
      );
      
      // Update the associated transaction if it exists
      if (req.body.investmentAmount || req.body.purchaseDate || req.body.notes) {
        await TransactionModel.findOneAndUpdate(
          { 
            userId,
            assetType: "mutualFund",
            assetId: fundId,
            transactionType: "buy"
          },
          { 
            buyPrice: newPurchaseNav,
            quantity: newUnits,
            buyDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : fund.purchaseDate,
            notes: req.body.notes || fund.notes
          }
        );
      }
      
      res.json(updatedFund);
    } catch (error) {
      console.error("Error updating mutual fund:", error);
      res.status(500).json({ error: "Failed to update mutual fund" });
    }
  };
  
  export const deleteMutualFund = async (req, res) => {
    try {
      const userId = req.userId;
      const fundId = req.params.id;
      
      // Find the fund and verify ownership
      const fund = await MutualFundModel.findById(fundId);
      if (!fund || fund.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this mutual fund" });
      }
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "mutualFund",
        assetId: fundId
      });
      
      await MutualFundModel.findByIdAndDelete(fundId);
      res.json({ message: "Mutual fund deleted successfully" });
    } catch (error) {
      console.error("Error deleting mutual fund:", error);
      res.status(500).json({ error: "Failed to delete mutual fund" });
    }
  };
  
  export const sellMutualFund = async (req, res) => {
    try {
      const userId = req.userId;
      const fundId = req.params.id;
      const { sellDate, units, notes } = req.body;
      
      // Find the fund and verify ownership
      const fund = await MutualFundModel.findById(fundId);
      if (!fund || fund.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to sell this mutual fund" });
      }
      
      if (units > fund.units) {
        return res.status(400).json({ error: "Cannot sell more units than owned" });
      }
      
      // Calculate current NAV and redemption value
      const navData = await getMutualFundNAV(fund.schemeCode);
      if (!navData) {
        return res.status(400).json({ error: "Could not fetch current NAV" });
      }
      
      const currentNav = navData.nav;
      const sellValue = units * currentNav;
      
      // Calculate profit/loss based on proportional investment
      const investmentProportion = (units / fund.units) * fund.investmentAmount;
      const profit = sellValue - investmentProportion;
      const profitPercentage = (profit / investmentProportion) * 100;
      
      // Record the sell transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "mutualFund",
        assetId: fundId,
        symbol: fund.schemeCode,
        name: fund.schemeName,
        transactionType: "sell",
        buyPrice: fund.purchaseNav,
        sellPrice: currentNav,
        quantity: units,
        buyDate: fund.purchaseDate,
        sellDate: new Date(sellDate),
        profit,
        profitPercentage,
        notes: notes || `Redeemed ${units} units of ${fund.schemeName}`
      });
      
      await transaction.save();
      
      // If selling all units, delete the record
      if (units === fund.units) {
        await MutualFundModel.findByIdAndDelete(fundId);
      } else {
        // Otherwise update the units and investment amount proportionally
        const remainingRatio = (fund.units - units) / fund.units;
        await MutualFundModel.findByIdAndUpdate(
          fundId,
          { 
            units: fund.units - units,
            investmentAmount: fund.investmentAmount * remainingRatio
          }
        );
      }
      
      res.json({ 
        message: "Mutual fund units sold successfully",
        sellValue,
        profit,
        profitPercentage,
        transaction
      });
    } catch (error) {
      console.error("Error selling mutual fund:", error);
      res.status(500).json({ error: "Failed to sell mutual fund" });
    }
  };

// REAL ESTATE CONTROLLERS
export const getRealEstate = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const properties = await RealEstateModel.find({ userId }).sort({ createdAt: -1 });
    
    const propertiesWithGrowth = properties.map(property => {
      const currentValue = property.currentValuation || property.purchasePrice;
      return {
        ...property.toObject(),
        growth: ((currentValue - property.purchasePrice) / property.purchasePrice) * 100
      };
    });
    
    res.json(propertiesWithGrowth);
  } catch (error) {
    console.error("Error fetching real estate:", error);
    res.status(500).json({ error: "Failed to fetch real estate" });
  }
};
// REAL ESTATE FUNCTIONS WITH TRANSACTION TRACKING
export const addRealEstate = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const {
        propertyName,
        propertyType,
        location,
        area,
        purchaseDate,
        purchasePrice,
        currentValuation,
        notes
      } = req.body;
      
      const newProperty = new RealEstateModel({
        userId,
        propertyName,
        propertyType, // e.g., residential, commercial, land
        location,
        area, // in sq. ft or sq. m
        purchaseDate,
        purchasePrice,
        currentValuation: currentValuation || purchasePrice,
        notes
      });
      
      await newProperty.save();
      
      // Record the purchase transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "realestate",
        assetId: newProperty._id,
        propertyName,
        location,
        transactionType: "buy",
        buyPrice: purchasePrice,
        buyDate: new Date(purchaseDate),
        notes: notes || `Purchased ${propertyType} property: ${propertyName}`
      });
      
      await transaction.save();
      
      res.status(201).json({
        property: newProperty,
        transaction
      });
    } catch (error) {
      console.error("Error adding real estate:", error);
      res.status(500).json({ error: "Failed to add real estate" });
    }
  };
  
  export const updateRealEstate = async (req, res) => {
    try {
      const userId = req.userId;
      const propertyId = req.params.id;
      
      // Find the property and verify ownership
      const property = await RealEstateModel.findById(propertyId);
      if (!property || property.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this property" });
      }
      
      const updatedProperty = await RealEstateModel.findByIdAndUpdate(
        propertyId,
        req.body,
        { new: true }
      );
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating real estate:", error);
      res.status(500).json({ error: "Failed to update real estate" });
    }
  };
  
  export const deleteRealEstate = async (req, res) => {
    try {
      const userId = req.userId;
      const propertyId = req.params.id;
      
      // Find the property and verify ownership
      const property = await RealEstateModel.findById(propertyId);
      if (!property || property.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this property" });
      }
      
      // Delete the property
      await RealEstateModel.findByIdAndDelete(propertyId);
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "realestate",
        assetId: propertyId
      });
      
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting real estate:", error);
      res.status(500).json({ error: "Failed to delete real estate" });
    }
  };
  
  export const sellRealEstate = async (req, res) => {
    try {
      const userId = req.userId;
      const propertyId = req.params.id;
      const { sellPrice, sellDate, notes } = req.body;
      
      // Find the property and verify ownership
      const property = await RealEstateModel.findById(propertyId);
      if (!property || property.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to sell this property" });
      }
      
      // Calculate profit/loss
      const profit = sellPrice - property.purchasePrice;
      const profitPercentage = (profit / property.purchasePrice) * 100;
      
      // Record the sale transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "realestate",
        assetId: propertyId,
        propertyName: property.propertyName,
        location: property.location,
        transactionType: "sell",
        buyPrice: property.purchasePrice,
        sellPrice,
        buyDate: property.purchaseDate,
        sellDate: new Date(sellDate),
        profit,
        profitPercentage,
        notes: notes || `Sold ${property.propertyType} property: ${property.propertyName}`
      });
      
      await transaction.save();
      
      // Delete the property
      await RealEstateModel.findByIdAndDelete(propertyId);
      
      res.json({
        message: "Property sold successfully",
        profit,
        profitPercentage,
        transaction
      });
    } catch (error) {
      console.error("Error selling property:", error);
      res.status(500).json({ error: "Failed to sell property" });
    }
  };

  const calculateFDMaturityAmount = (principal, rate, years, compoundFrequency) => {
    let n = 1; // compounding frequency per year
    
    switch(compoundFrequency) {
      case 'quarterly':
        n = 4;
        break;
      case 'half-yearly':
        n = 2;
        break;
      case 'yearly':
        n = 1;
        break;
      default:
        n = 4; // default to quarterly
    }
    
    // Compound interest formula: A = P(1 + r/n)^(nt)
    const maturityAmount = principal * Math.pow(1 + (rate/100)/n, n * years);
    return maturityAmount;
  };
  
  // Utility function to calculate PPF future value
  const calculatePPFValue = (contributions, rate) => {
    // Sort contributions by year
    contributions.sort((a, b) => a.year - b.year);
    
    let totalValue = 0;
    const currentYear = new Date().getFullYear();
    
    // Calculate compound interest for each year's contribution
    contributions.forEach(contribution => {
      const yearsRemaining = Math.max(0, 15 - (currentYear - contribution.year));
      // PPF uses annual compounding
      const futureValue = contribution.amount * Math.pow(1 + rate/100, yearsRemaining);
      totalValue += futureValue;
    });
    
    return totalValue;
  };
  
  // Utility function to fetch cryptocurrency prices from CoinGecko API
  const getCryptoPrice = async (coinId, vsCurrency = 'inr') => {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`;
      const response = await axios.get(url);
      
      if (response.data && response.data[coinId] && response.data[coinId][vsCurrency]) {
        return response.data[coinId][vsCurrency];
      }
      return null;
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error);
      return null;
    }
  };
  
  
  // FIXED DEPOSIT CONTROLLERS
  export const getFixedDeposits = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const fixedDeposits = await FixedDepositModel.find({ userId }).sort({ maturityDate: 1 });
      
      // Calculate current value and projected maturity for each FD
      const fdsWithProjections = fixedDeposits.map(fd => {
        const fdObj = fd.toObject();
        
        // Calculate years from start to maturity
        const startDate = new Date(fd.startDate);
        const maturityDate = new Date(fd.maturityDate);
        const yearsToMaturity = (maturityDate - startDate) / (365 * 24 * 60 * 60 * 1000);
        
        // Calculate maturity amount
        let maturityAmount;
        if (fd.interestType === 'simple') {
          // Simple interest: A = P(1 + rt)
          maturityAmount = fd.depositAmount * (1 + (fd.interestRate/100) * yearsToMaturity);
        } else {
          // Compound interest
          maturityAmount = calculateFDMaturityAmount(
            fd.depositAmount, 
            fd.interestRate, 
            yearsToMaturity, 
            fd.compoundFrequency
          );
        }
        
        // Calculate current value
        const currentDate = new Date();
        const yearsElapsed = Math.min(
          yearsToMaturity,
          (currentDate - startDate) / (365 * 24 * 60 * 60 * 1000)
        );
        
        let currentValue;
        if (fd.interestType === 'simple') {
          currentValue = fd.depositAmount * (1 + (fd.interestRate/100) * yearsElapsed);
        } else {
          currentValue = calculateFDMaturityAmount(
            fd.depositAmount, 
            fd.interestRate, 
            yearsElapsed, 
            fd.compoundFrequency
          );
        }
        
        // Calculate days remaining until maturity
        const daysRemaining = Math.max(0, Math.floor((maturityDate - currentDate) / (24 * 60 * 60 * 1000)));
        
        return {
          ...fdObj,
          maturityAmount,
          currentValue,
          interestEarned: currentValue - fd.depositAmount,
          daysRemaining,
          isMatured: currentDate >= maturityDate
        };
      });
      
      res.json(fdsWithProjections);
    } catch (error) {
      console.error("Error fetching fixed deposits:", error);
      res.status(500).json({ error: "Failed to fetch fixed deposits" });
    }
  };
  

// FIXED DEPOSIT FUNCTIONS WITH TRANSACTION TRACKING
export const addFixedDeposit = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { 
        bankName, 
        depositAmount, 
        interestRate, 
        startDate, 
        maturityDate, 
        interestType, 
        compoundFrequency, 
        notes 
      } = req.body;
      
      const newFD = new FixedDepositModel({
        userId,
        bankName,
        depositAmount,
        interestRate,
        startDate,
        maturityDate,
        interestType,
        compoundFrequency,
        notes
      });
      
      await newFD.save();
      
      // Record the deposit transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "fd",
        assetId: newFD._id,
        bankName,
        transactionType: "deposit",
        investAmount: depositAmount,
        investDate: new Date(startDate),
        expectedMaturityDate: new Date(maturityDate),
        notes: notes || `Created Fixed Deposit of ${depositAmount} at ${bankName}`
      });
      
      await transaction.save();
      
      res.status(201).json({
        fd: newFD,
        transaction
      });
    } catch (error) {
      console.error("Error adding fixed deposit:", error);
      res.status(500).json({ error: "Failed to add fixed deposit" });
    }
  };
  
  export const updateFixedDeposit = async (req, res) => {
    try {
      const userId = req.userId;
      const fdId = req.params.id;
      
      // Find the FD and verify ownership
      const fd = await FixedDepositModel.findById(fdId);
      if (!fd || fd.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this fixed deposit" });
      }
      
      const updatedFD = await FixedDepositModel.findByIdAndUpdate(
        fdId,
        req.body,
        { new: true }
      );
      
      res.json(updatedFD);
    } catch (error) {
      console.error("Error updating fixed deposit:", error);
      res.status(500).json({ error: "Failed to update fixed deposit" });
    }
  };
  
  export const deleteFixedDeposit = async (req, res) => {
    try {
      const userId = req.userId;
      const fdId = req.params.id;
      
      // Find the FD and verify ownership
      const fd = await FixedDepositModel.findById(fdId);
      if (!fd || fd.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this fixed deposit" });
      }
      
      // Delete the FD
      await FixedDepositModel.findByIdAndDelete(fdId);
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "fd",
        assetId: fdId
      });
      
      res.json({ message: "Fixed deposit deleted successfully" });
    } catch (error) {
      console.error("Error deleting fixed deposit:", error);
      res.status(500).json({ error: "Failed to delete fixed deposit" });
    }
  };
  
  export const matureFixedDeposit = async (req, res) => {
    try {
      const userId = req.userId;
      const fdId = req.params.id;
      const { maturityAmount, actualMaturityDate, prematurePenalty, notes } = req.body;
      
      // Find the FD and verify ownership
      const fd = await FixedDepositModel.findById(fdId);
      if (!fd || fd.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to mature this fixed deposit" });
      }
      
      // Calculate profit
      const profit = maturityAmount - fd.depositAmount;
      const profitPercentage = (profit / fd.depositAmount) * 100;
      
      // Determine if premature withdrawal
      const isPremature = new Date(actualMaturityDate) < new Date(fd.maturityDate);
      
      // Record the maturity transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "fd",
        assetId: fdId,
        bankName: fd.bankName,
        transactionType: isPremature ? "premature-withdrawal" : "mature",
        investAmount: fd.depositAmount,
        maturityAmount,
        investDate: fd.startDate,
        maturityDate: new Date(actualMaturityDate),
        expectedMaturityDate: new Date(fd.maturityDate),
        profit,
        profitPercentage,
        prematurePenalty: isPremature ? prematurePenalty : 0,
        notes: notes || `Fixed Deposit ${isPremature ? 'withdrawn prematurely' : 'matured'} with ${profit > 0 ? 'profit' : 'loss'} of ${profit}`
      });
      
      await transaction.save();
      
      // Delete the FD as it has been withdrawn
      await FixedDepositModel.findByIdAndDelete(fdId);
      
      res.json({
        message: `Fixed deposit ${isPremature ? 'withdrawn prematurely' : 'matured'} successfully`,
        profit,
        profitPercentage,
        transaction
      });
    } catch (error) {
      console.error("Error maturing fixed deposit:", error);
      res.status(500).json({ error: "Failed to mature fixed deposit" });
    }
  };
  
  
  // PPF CONTROLLERS
  export const getPPFAccounts = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const ppfAccounts = await PPFModel.find({ userId }).sort({ createdAt: -1 });
      
      // Calculate current value for each PPF account
      const ppfWithProjections = ppfAccounts.map(ppf => {
        const ppfObj = ppf.toObject();
        
        // Calculate estimated maturity value
        const estimatedValue = calculatePPFValue(
          ppf.yearlyContributions, 
          ppf.currentInterestRate
        );
        
        // Calculate time to maturity
        const currentDate = new Date();
        const maturityDate = new Date(ppf.maturityDate);
        const yearsRemaining = Math.max(0, (maturityDate - currentDate) / (365 * 24 * 60 * 60 * 1000));
        
        return {
          ...ppfObj,
          currentValue: estimatedValue,
          interestEarned: estimatedValue - ppf.totalInvestment,
          yearsRemaining: Math.floor(yearsRemaining),
          isMatured: currentDate >= maturityDate
        };
      });
      
      res.json(ppfWithProjections);
    } catch (error) {
      console.error("Error fetching PPF accounts:", error);
      res.status(500).json({ error: "Failed to fetch PPF accounts" });
    }
  };
  
// PPF FUNCTIONS WITH TRANSACTION TRACKING

export const addPPFAccount = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { 
        accountNumber, 
        bankName, 
        openDate, 
        currentInterestRate, 
        totalInvestment,
        yearlyContributions,
        notes 
      } = req.body;
      
      // Calculate maturity date (PPF has 15-year maturity)
      const openDateObj = new Date(openDate);
      const maturityDate = new Date(openDateObj);
      maturityDate.setFullYear(maturityDate.getFullYear() + 15);
      
      const newPPF = new PPFModel({
        userId,
        accountNumber,
        bankName,
        openDate,
        maturityDate,
        currentInterestRate,
        totalInvestment,
        yearlyContributions: yearlyContributions || [],
        notes
      });
      
      await newPPF.save();
      
      // Record the initial investment transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "ppf",
        assetId: newPPF._id,
        accountNumber: accountNumber,
        bankName: bankName,
        transactionType: "invest",
        investAmount: totalInvestment,
        investDate: new Date(openDate),
        notes: notes || `Opened PPF account at ${bankName}`
      });
      
      await transaction.save();
      
      res.status(201).json({
        ppf: newPPF,
        transaction
      });
    } catch (error) {
      console.error("Error adding PPF account:", error);
      res.status(500).json({ error: "Failed to add PPF account" });
    }
  };
  
export const updatePPFAccount = async (req, res) => {
    try {
      const userId = req.userId;
      const ppfId = req.params.id;
      
      // Find the PPF account and verify ownership
      const ppf = await PPFModel.findById(ppfId);
      if (!ppf || ppf.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this PPF account" });
      }
      
      const updatedPPF = await PPFModel.findByIdAndUpdate(
        ppfId,
        req.body,
        { new: true }
      );
      
      res.json(updatedPPF);
    } catch (error) {
      console.error("Error updating PPF account:", error);
      res.status(500).json({ error: "Failed to update PPF account" });
    }
  };
  
  export const deletePPFAccount = async (req, res) => {
    try {
      const userId = req.userId;
      const ppfId = req.params.id;
      
      // Find the PPF account and verify ownership
      const ppf = await PPFModel.findById(ppfId);
      if (!ppf || ppf.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this PPF account" });
      }
      
      // Delete the PPF account
      await PPFModel.findByIdAndDelete(ppfId);
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "ppf",
        assetId: ppfId
      });
      
      res.json({ message: "PPF account deleted successfully" });
    } catch (error) {
      console.error("Error deleting PPF account:", error);
      res.status(500).json({ error: "Failed to delete PPF account" });
    }
  };
  
  export const addYearlyContribution = async (req, res) => {
    try {
      const userId = req.userId;
      const ppfId = req.params.id;
      
      // Find the PPF account and verify ownership
      const ppf = await PPFModel.findById(ppfId);
      if (!ppf || ppf.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this PPF account" });
      }
      
      const { year, amount, date, notes } = req.body;
      
      // Add the contribution
      ppf.yearlyContributions.push({ year, amount, date });
      
      // Update the total investment amount
      ppf.totalInvestment += amount;
      
      await ppf.save();
      
      // Record the contribution as a transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "ppf",
        assetId: ppfId,
        accountNumber: ppf.accountNumber,
        bankName: ppf.bankName,
        transactionType: "contribute",
        investAmount: amount,
        investDate: new Date(date),
        notes: notes || `Yearly contribution to PPF account for ${year}`
      });
      
      await transaction.save();
      
      res.json({
        ppf,
        transaction
      });
    } catch (error) {
      console.error("Error adding yearly contribution:", error);
      res.status(500).json({ error: "Failed to add yearly contribution" });
    }
  };
  
  export const maturePPF = async (req, res) => {
    try {
      const userId = req.userId;
      const ppfId = req.params.id;
      const { maturityAmount, maturityDate, notes } = req.body;
      
      // Find the PPF account and verify ownership
      const ppf = await PPFModel.findById(ppfId);
      if (!ppf || ppf.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to mature this PPF account" });
      }
      
      // Calculate profit
      const profit = maturityAmount - ppf.totalInvestment;
      const profitPercentage = (profit / ppf.totalInvestment) * 100;
      
      // Record the maturity transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "ppf",
        assetId: ppfId,
        accountNumber: ppf.accountNumber,
        bankName: ppf.bankName,
        transactionType: "mature",
        investAmount: ppf.totalInvestment,
        maturityAmount,
        maturityDate: new Date(maturityDate),
        profit,
        profitPercentage,
        notes: notes || `PPF account matured with ${profit > 0 ? 'profit' : 'loss'} of ${profit}`
      });
      
      await transaction.save();
      
      // Delete the PPF account as it has matured
      await PPFModel.findByIdAndDelete(ppfId);
      
      res.json({
        message: "PPF account matured successfully",
        profit,
        profitPercentage,
        transaction
      });
    } catch (error) {
      console.error("Error maturing PPF account:", error);
      res.status(500).json({ error: "Failed to mature PPF account" });
    }
  };
  
// CRYPTOCURRENCY CONTROLLERS WITH TRANSACTION TRACKING

export const getCryptos = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const cryptos = await CryptoModel.find({ userId }).sort({ createdAt: -1 });
      
      // Fetch current prices from CoinGecko
      const cryptosWithCurrentPrices = await Promise.all(cryptos.map(async (crypto) => {
        try {
          const currentPrice = await getCryptoPrice(crypto.coinId);
          
          if (currentPrice) {
            return {
              ...crypto.toObject(),
              currentPrice,
              currentValue: currentPrice * crypto.quantity,
              investedValue: crypto.buyPrice * crypto.quantity,
              profit: (currentPrice - crypto.buyPrice) * crypto.quantity,
              profitPercentage: ((currentPrice - crypto.buyPrice) / crypto.buyPrice) * 100
            };
          } else {
            return crypto.toObject();
          }
        } catch (error) {
          console.error(`Error fetching current price for ${crypto.name}:`, error);
          return crypto.toObject();
        }
      }));
      
      res.json(cryptosWithCurrentPrices);
    } catch (error) {
      console.error("Error fetching cryptocurrencies:", error);
      res.status(500).json({ error: "Failed to fetch cryptocurrencies" });
    }
  };
  
  export const addCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const { 
        coinId, 
        name, 
        symbol, 
        buyDate, 
        buyPrice, 
        quantity, 
        platform, 
        walletAddress, 
        notes 
      } = req.body;
      
      // Validate the coin ID by checking if it exists on CoinGecko
      try {
        const price = await getCryptoPrice(coinId);
        if (!price) {
          return res.status(400).json({ error: "Invalid coin ID" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Failed to validate coin ID" });
      }
      
      const newCrypto = new CryptoModel({
        userId,
        coinId,
        name,
        symbol,
        buyDate,
        buyPrice,
        quantity,
        platform,
        walletAddress,
        notes
      });
      
      await newCrypto.save();
      
      // Record the buy transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "crypto",
        assetId: newCrypto._id,
        coinId,
        symbol,
        name,
        transactionType: "buy",
        buyPrice,
        quantity,
        buyDate: new Date(buyDate),
        platform,
        notes: notes || `Bought ${quantity} of ${name}`
      });
      
      await transaction.save();
      
      // Update user's portfolio stats if user model has these fields
      try {
        await userModel.findByIdAndUpdate(userId, {
          $inc: {
            cryptoBalance: buyPrice * quantity,
            totalInvestment: buyPrice * quantity
          }
        });
      } catch (error) {
        console.error("Warning: Could not update user portfolio stats:", error);
        // Continue execution even if this fails
      }
      
      res.status(201).json({
        crypto: newCrypto,
        transaction
      });
    } catch (error) {
      console.error("Error adding cryptocurrency:", error);
      res.status(500).json({ error: "Failed to add cryptocurrency" });
    }
  };
  
  export const updateCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const cryptoId = req.params.id;
      
      // Find the crypto investment and verify ownership
      const crypto = await CryptoModel.findById(cryptoId);
      if (!crypto || crypto.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this crypto investment" });
      }
      
      const updatedCrypto = await CryptoModel.findByIdAndUpdate(
        cryptoId,
        req.body,
        { new: true }
      );
      
      res.json(updatedCrypto);
    } catch (error) {
      console.error("Error updating cryptocurrency:", error);
      res.status(500).json({ error: "Failed to update cryptocurrency" });
    }
  };
  
  export const deleteCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const cryptoId = req.params.id;
      
      // Find the crypto investment and verify ownership
      const crypto = await CryptoModel.findById(cryptoId);
      if (!crypto || crypto.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this crypto investment" });
      }
      
      // Delete the crypto
      await CryptoModel.findByIdAndDelete(cryptoId);
      
      // Delete associated transactions
      await TransactionModel.deleteMany({
        userId,
        assetType: "crypto",
        assetId: cryptoId
      });
      
      // Update user's portfolio stats if user model has these fields
      try {
        await userModel.findByIdAndUpdate(userId, {
          $inc: {
            cryptoBalance: -(crypto.buyPrice * crypto.quantity),
            totalInvestment: -(crypto.buyPrice * crypto.quantity)
          }
        });
      } catch (error) {
        console.error("Warning: Could not update user portfolio stats:", error);
        // Continue execution even if this fails
      }
      
      res.json({ message: "Cryptocurrency investment deleted successfully" });
    } catch (error) {
      console.error("Error deleting cryptocurrency:", error);
      res.status(500).json({ error: "Failed to delete cryptocurrency" });
    }
  };
  
  export const sellCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const cryptoId = req.params.id;
      const { sellPrice, sellDate, quantity, notes } = req.body;
      
      // Find the crypto investment and verify ownership
      const crypto = await CryptoModel.findById(cryptoId);
      if (!crypto || crypto.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to sell this crypto investment" });
      }
      
      if (quantity > crypto.quantity) {
        return res.status(400).json({ error: "Cannot sell more coins than owned" });
      }
      
      // Calculate profit/loss
      const profit = (sellPrice - crypto.buyPrice) * quantity;
      const profitPercentage = ((sellPrice - crypto.buyPrice) / crypto.buyPrice) * 100;
      
      // Record the sell transaction in history
      const transaction = new TransactionModel({
        userId,
        assetType: "crypto",
        assetId: cryptoId,
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        transactionType: "sell",
        buyPrice: crypto.buyPrice,
        sellPrice,
        quantity,
        buyDate: crypto.buyDate,
        sellDate: new Date(sellDate),
        platform: crypto.platform,
        profit,
        profitPercentage,
        notes: notes || `Sold ${quantity} of ${crypto.name}`
      });
      
      await transaction.save();
      
      // If selling all coins, delete the investment
      if (quantity === crypto.quantity) {
        await CryptoModel.findByIdAndDelete(cryptoId);
      } else {
        // Otherwise update the quantity
        await CryptoModel.findByIdAndUpdate(
          cryptoId,
          { $inc: { quantity: -quantity } }
        );
      }
      
      // Update user's portfolio stats
      try {
        await userModel.findByIdAndUpdate(userId, {
          $inc: {
            totalProfit: profit,
            cryptoBalance: -(quantity * crypto.buyPrice)
          }
        });
      } catch (error) {
        console.error("Warning: Could not update user portfolio stats:", error);
        // Continue execution even if this fails
      }
      
      res.json({
        message: "Cryptocurrency sold successfully",
        profit,
        profitPercentage,
        transaction,
        remainingQuantity: crypto.quantity - quantity
      });
    } catch (error) {
      console.error("Error selling cryptocurrency:", error);
      res.status(500).json({ error: "Failed to sell cryptocurrency" });
    }
  };
  
  export const transferCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const cryptoId = req.params.id;
      const { 
        newPlatform, 
        newWalletAddress, 
        transferFee, 
        transferDate, 
        notes 
      } = req.body;
      
      // Find the crypto investment and verify ownership
      const crypto = await CryptoModel.findById(cryptoId);
      if (!crypto || crypto.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to transfer this crypto investment" });
      }
      
      // Update the platform and wallet address
      const updatedCrypto = await CryptoModel.findByIdAndUpdate(
        cryptoId,
        { 
          platform: newPlatform, 
          walletAddress: newWalletAddress 
        },
        { new: true }
      );
      
      // Record the transfer transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "crypto",
        assetId: cryptoId,
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        transactionType: "transfer",
        quantity: crypto.quantity,
        transferDate: new Date(transferDate),
        fromPlatform: crypto.platform,
        toPlatform: newPlatform,
        fromWallet: crypto.walletAddress,
        toWallet: newWalletAddress,
        transferFee: transferFee || 0,
        notes: notes || `Transferred ${crypto.quantity} ${crypto.symbol} from ${crypto.platform} to ${newPlatform}`
      });
      
      await transaction.save();
      
      res.json({
        message: "Cryptocurrency transferred successfully",
        crypto: updatedCrypto,
        transaction
      });
    } catch (error) {
      console.error("Error transferring cryptocurrency:", error);
      res.status(500).json({ error: "Failed to transfer cryptocurrency" });
    }
  };
  
  export const stakeCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const cryptoId = req.params.id;
      const { 
        stakeAmount, 
        stakePlatform, 
        stakeDate, 
        lockupPeriod, 
        estimatedAPY, 
        notes 
      } = req.body;
      
      // Find the crypto investment and verify ownership
      const crypto = await CryptoModel.findById(cryptoId);
      if (!crypto || crypto.userId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to stake this crypto investment" });
      }
      
      if (stakeAmount > crypto.quantity) {
        return res.status(400).json({ error: "Cannot stake more coins than owned" });
      }
      
      // Calculate estimated rewards
      const estimatedRewards = stakeAmount * (estimatedAPY / 100) * (lockupPeriod / 365);
      
      // Create a new staking record
      const stakingRecord = new StakingModel({
        userId,
        cryptoId,
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        stakeAmount,
        stakePlatform,
        stakeDate: new Date(stakeDate),
        lockupPeriod, // in days
        estimatedAPY,
        estimatedRewards,
        isActive: true,
        notes
      });
      
      await stakingRecord.save();
      
      // Update the available quantity in the crypto record
      await CryptoModel.findByIdAndUpdate(
        cryptoId,
        { $inc: { quantity: -stakeAmount } }
      );
      
      // Record the staking transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "crypto",
        assetId: cryptoId,
        relatedAssetId: stakingRecord._id, // Link to the staking record
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        transactionType: "stake",
        quantity: stakeAmount,
        stakeDate: new Date(stakeDate),
        platform: stakePlatform,
        lockupPeriod,
        estimatedAPY,
        estimatedRewards,
        notes: notes || `Staked ${stakeAmount} ${crypto.symbol} on ${stakePlatform} for ${lockupPeriod} days`
      });
      
      await transaction.save();
      
      res.json({
        message: "Cryptocurrency staked successfully",
        stakingRecord,
        transaction,
        remainingQuantity: crypto.quantity - stakeAmount
      });
    } catch (error) {
      console.error("Error staking cryptocurrency:", error);
      res.status(500).json({ error: "Failed to stake cryptocurrency" });
    }
  };
  
  export const unstakeCrypto = async (req, res) => {
    try {
      const userId = req.userId;
      const stakingId = req.params.id;
      const { 
        actualRewards, 
        unstakeDate, 
        notes 
      } = req.body;
      
      // Find the staking record and verify ownership
      const stakingRecord = await StakingModel.findById(stakingId);
      if (!stakingRecord || stakingRecord.userId.toString() !== userId || !stakingRecord.isActive) {
        return res.status(403).json({ error: "Not authorized or invalid staking record" });
      }
      
      // Find the associated crypto
      const crypto = await CryptoModel.findById(stakingRecord.cryptoId);
      if (!crypto) {
        return res.status(400).json({ error: "Associated cryptocurrency not found" });
      }
      
      // Mark the staking as completed
      const updatedStaking = await StakingModel.findByIdAndUpdate(
        stakingId,
        { 
          isActive: false,
          endDate: new Date(unstakeDate),
          actualRewards,
          completed: true
        },
        { new: true }
      );
      
      // Add the staked amount back to the crypto holding
      await CryptoModel.findByIdAndUpdate(
        stakingRecord.cryptoId,
        { $inc: { quantity: stakingRecord.stakeAmount } }
      );
      
      // Create a new crypto record for the rewards if there are rewards
      let rewardsCrypto = null;
      if (actualRewards > 0) {
        rewardsCrypto = new CryptoModel({
          userId,
          coinId: crypto.coinId,
          name: crypto.name,
          symbol: crypto.symbol,
          buyDate: new Date(unstakeDate),
          buyPrice: 0, // Rewards have no buy price
          quantity: actualRewards,
          platform: stakingRecord.stakePlatform,
          walletAddress: crypto.walletAddress,
          notes: `Staking rewards from ${stakingRecord.stakeAmount} ${crypto.symbol}`
        });
        
        await rewardsCrypto.save();
      }
      
      // Record the unstaking transaction
      const transaction = new TransactionModel({
        userId,
        assetType: "crypto",
        assetId: stakingRecord.cryptoId,
        relatedAssetId: stakingId,
        coinId: crypto.coinId,
        symbol: crypto.symbol,
        name: crypto.name,
        transactionType: "unstake",
        quantity: stakingRecord.stakeAmount,
        stakeDate: stakingRecord.stakeDate,
        unstakeDate: new Date(unstakeDate),
        platform: stakingRecord.stakePlatform,
        stakingDuration: Math.floor((new Date(unstakeDate) - stakingRecord.stakeDate) / (1000 * 60 * 60 * 24)), // in days
        rewards: actualRewards,
        notes: notes || `Unstaked ${stakingRecord.stakeAmount} ${crypto.symbol} with ${actualRewards} ${crypto.symbol} rewards`
      });
      
      await transaction.save();
      
      res.json({
        message: "Cryptocurrency unstaked successfully",
        updatedStaking,
        transaction,
        rewardsCrypto
      });
    } catch (error) {
      console.error("Error unstaking cryptocurrency:", error);
      res.status(500).json({ error: "Failed to unstake cryptocurrency" });
    }
  };
  
  export const getCryptoStats = async (req, res) => {
    try {
      const userId = req.userId;
      
      // Get all user's cryptocurrencies
      const cryptos = await CryptoModel.find({ userId });
      
      // Get all crypto transactions
      const transactions = await TransactionModel.find({ 
        userId, 
        assetType: "crypto" 
      });
      
      // Get active staking records
      const stakingRecords = await StakingModel.find({ 
        userId, 
        isActive: true 
      });
      
      // Calculate total invested amount
      const totalInvested = cryptos.reduce((sum, crypto) => 
        sum + (crypto.buyPrice * crypto.quantity), 0);
      
      // Fetch current prices and calculate total current value
      const cryptosWithCurrentValue = await Promise.all(cryptos.map(async (crypto) => {
        const currentPrice = await getCryptoPrice(crypto.coinId);
        return {
          ...crypto.toObject(),
          currentPrice,
          currentValue: currentPrice ? currentPrice * crypto.quantity : 0
        };
      }));
      
      const totalCurrentValue = cryptosWithCurrentValue.reduce((sum, crypto) => 
        sum + (crypto.currentValue || 0), 0);
      
      // Calculate total profit/loss
      const totalProfitLoss = totalCurrentValue - totalInvested;
      
      // Calculate realized profit/loss from completed sell transactions
      const realizedProfitLoss = transactions
        .filter(t => t.transactionType === 'sell')
        .reduce((sum, t) => sum + (t.profit || 0), 0);
      
      // Calculate total value of staked assets
      const totalStakedValue = await Promise.all(stakingRecords.map(async (record) => {
        const currentPrice = await getCryptoPrice(record.coinId);
        return {
          ...record.toObject(),
          stakedValue: currentPrice ? currentPrice * record.stakeAmount : 0,
          estimatedRewardValue: currentPrice ? currentPrice * record.estimatedRewards : 0
        };
      }));
      
      const stakedValue = totalStakedValue.reduce((sum, record) => 
        sum + (record.stakedValue || 0), 0);
      
      const estimatedRewardsValue = totalStakedValue.reduce((sum, record) => 
        sum + (record.estimatedRewardValue || 0), 0);
      
      // Group by coin
      const coinDistribution = {};
      cryptosWithCurrentValue.forEach(crypto => {
        if (!coinDistribution[crypto.symbol]) {
          coinDistribution[crypto.symbol] = {
            quantity: 0,
            value: 0,
            percentage: 0
          };
        }
        
        coinDistribution[crypto.symbol].quantity += crypto.quantity;
        coinDistribution[crypto.symbol].value += crypto.currentValue || 0;
      });
      
      // Calculate percentages
      Object.keys(coinDistribution).forEach(symbol => {
        coinDistribution[symbol].percentage = totalCurrentValue > 0 
          ? (coinDistribution[symbol].value / totalCurrentValue) * 100 
          : 0;
      });
      
      // Group by platform
      const platformDistribution = {};
      cryptosWithCurrentValue.forEach(crypto => {
        if (!platformDistribution[crypto.platform]) {
          platformDistribution[crypto.platform] = {
            value: 0,
            percentage: 0
          };
        }
        
        platformDistribution[crypto.platform].value += crypto.currentValue || 0;
      });
      
      // Calculate percentages
      Object.keys(platformDistribution).forEach(platform => {
        platformDistribution[platform].percentage = totalCurrentValue > 0 
          ? (platformDistribution[platform].value / totalCurrentValue) * 100 
          : 0;
      });
      
      res.json({
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercentage: totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0,
        realizedProfitLoss,
        stakedValue,
        estimatedRewardsValue,
        coinDistribution,
        platformDistribution,
        assetCount: cryptos.length,
        stakingCount: stakingRecords.length
      });
    } catch (error) {
      console.error("Error fetching crypto statistics:", error);
      res.status(500).json({ error: "Failed to fetch crypto statistics" });
    }
  };
  
  export const getStakingRecords = async (req, res) => {
    try {
      const userId = req.userId;
      const { isActive } = req.query;
      
      const query = { userId };
      
      // Filter by active status if provided
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      
      const stakingRecords = await StakingModel.find(query).sort({ stakeDate: -1 });
      
      // Fetch current prices for active staking records
      const recordsWithValue = await Promise.all(stakingRecords.map(async (record) => {
        if (record.isActive) {
          const currentPrice = await getCryptoPrice(record.coinId);
          return {
            ...record.toObject(),
            currentValue: currentPrice ? currentPrice * record.stakeAmount : 0,
            estimatedRewardValue: currentPrice ? currentPrice * record.estimatedRewards : 0,
            daysRemaining: record.lockupPeriod - Math.floor((new Date() - record.stakeDate) / (1000 * 60 * 60 * 24))
          };
        } else {
          return record.toObject();
        }
      }));
      
      res.json(recordsWithValue);
    } catch (error) {
      console.error("Error fetching staking records:", error);
      res.status(500).json({ error: "Failed to fetch staking records" });
    }
  };


// TRANSACTION MANAGEMENT

export const getTransactions = async (req, res) => {
    try {
      const userId = req.userId;
      const { assetType, startDate, endDate, transactionType } = req.query;
      
      // Build query object
      const query = { userId };
      
      // Add filters if provided
      if (assetType) query.assetType = assetType;
      if (transactionType) query.transactionType = transactionType;
      
      // Add date range if provided
      if (startDate || endDate) {
        query.$or = [];
        
        if (startDate && endDate) {
          // Buy date range
          query.$or.push({
            buyDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          });
          
          // Sell date range
          query.$or.push({
            sellDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          });
          
          // Invest date range
          query.$or.push({
            investDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          });
          
          // Maturity date range
          query.$or.push({
            maturityDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          });
        } else if (startDate) {
          // Only start date provided
          query.$or.push({ buyDate: { $gte: new Date(startDate) } });
          query.$or.push({ sellDate: { $gte: new Date(startDate) } });
          query.$or.push({ investDate: { $gte: new Date(startDate) } });
          query.$or.push({ maturityDate: { $gte: new Date(startDate) } });
        } else {
          // Only end date provided
          query.$or.push({ buyDate: { $lte: new Date(endDate) } });
          query.$or.push({ sellDate: { $lte: new Date(endDate) } });
          query.$or.push({ investDate: { $lte: new Date(endDate) } });
          query.$or.push({ maturityDate: { $lte: new Date(endDate) } });
        }
      }
      
      const transactions = await TransactionModel.find(query).sort({ 
        // Sort by the available date field (different transaction types have different date fields)
        $or: [
          { sellDate: -1 },
          { buyDate: -1 },
          { investDate: -1 },
          { maturityDate: -1 }
        ]
      });
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  };
  
  export const getTransactionById = async (req, res) => {
    try {
      const userId = req.userId;
      const transactionId = req.params.id;
      
      const transaction = await TransactionModel.findById(transactionId);
      
      if (!transaction || transaction.userId.toString() !== userId) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  };
  
  export const getTransactionStats = async (req, res) => {
    try {
      const userId = req.userId;
      const { year, assetType } = req.query;
      
      // Build query object
      const query = { userId };
      
      // Add filters if provided
      if (assetType) query.assetType = assetType;
      
      // Add year filter if provided
      if (year) {
        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
        
        query.$or = [
          { buyDate: { $gte: startDate, $lte: endDate } },
          { sellDate: { $gte: startDate, $lte: endDate } },
          { investDate: { $gte: startDate, $lte: endDate } },
          { maturityDate: { $gte: startDate, $lte: endDate } }
        ];
      }
      
      // Get all matching transactions
      const transactions = await TransactionModel.find(query);
      
      // Calculate statistics
      const stats = {
        totalTransactions: transactions.length,
        totalProfit: 0,
        totalInvestment: 0,
        assetTypeBreakdown: {},
        profitByAssetType: {},
        transactionTypeBreakdown: {}
      };
      
      // Process each transaction
      transactions.forEach(transaction => {
        // Count by asset type
        stats.assetTypeBreakdown[transaction.assetType] = 
          (stats.assetTypeBreakdown[transaction.assetType] || 0) + 1;
        
        // Count by transaction type
        stats.transactionTypeBreakdown[transaction.transactionType] = 
          (stats.transactionTypeBreakdown[transaction.transactionType] || 0) + 1;
        
        // Sum profits
        if (transaction.profit) {
          stats.totalProfit += transaction.profit;
          
          // Sum profits by asset type
          stats.profitByAssetType[transaction.assetType] = 
            (stats.profitByAssetType[transaction.assetType] || 0) + transaction.profit;
        }
        
        // Sum investments
        if (transaction.investAmount) {
          stats.totalInvestment += transaction.investAmount;
        } else if (transaction.buyPrice) {
          stats.totalInvestment += transaction.buyPrice;
        }
      });
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
      res.status(500).json({ error: "Failed to fetch transaction statistics" });
    }
  };
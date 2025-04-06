import express from 'express';
import { 
  // Portfolio Summary
  portfolioSummary,
  
  // Stock Controllers
  getStocks,
  addStock,
  updateStock,
  deleteStock,
  sellStock,
  
  // Gold Controllers
  getGold,
  addGold,
  updateGold,
  deleteGold,
  sellGold,
  
  // Mutual Fund Controllers
  getMutualFunds,
  searchMutualFunds,
  addMutualFund,
  updateMutualFund,
  deleteMutualFund,
  sellMutualFund,
  
  // Real Estate Controllers
  getRealEstate,
  addRealEstate,
  updateRealEstate,
  deleteRealEstate,
  sellRealEstate,

   // Fixed Deposit Controllers
   getFixedDeposits,
   addFixedDeposit,
   updateFixedDeposit,
   deleteFixedDeposit,
 
   // PPF Account Controllers
   getPPFAccounts,
   addPPFAccount,
   updatePPFAccount,
   deletePPFAccount,
   addYearlyContribution,
 
   // Cryptocurrency Controllers
   getCryptos,
   addCrypto,
   updateCrypto,
   deleteCrypto,
   sellCrypto,

   getRealizedProfits,
   getTransactionHistory
} from '../controllers/portfolioController.js';

import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/usercontroller.js';

const Portfoliorouter = express.Router();

// Portfolio Summary
Portfoliorouter.get('/summary', userAuth, portfolioSummary);

// User Data
Portfoliorouter.get('/user-data', userAuth, getUserData);

// STOCK ROUTES
Portfoliorouter.get('/stocks', userAuth, getStocks);
Portfoliorouter.post('/add-stock', userAuth, addStock);
Portfoliorouter.put('/stocks/:id', userAuth, updateStock);
Portfoliorouter.delete('/stocks/:id', userAuth, deleteStock);
Portfoliorouter.post('/stocks/:id/sell', userAuth, sellStock);

// GOLD ROUTES
Portfoliorouter.get('/gold', userAuth, getGold);
Portfoliorouter.post('/gold', userAuth, addGold);
Portfoliorouter.put('/gold/:id', userAuth, updateGold);
Portfoliorouter.delete('/gold/:id', userAuth, deleteGold);
Portfoliorouter.post('/gold/:id/sell', userAuth, sellGold);

// MUTUAL FUND ROUTES
Portfoliorouter.get('/mutual-funds', userAuth, getMutualFunds);
Portfoliorouter.get('/mutual-funds/search/:query', userAuth, searchMutualFunds);
Portfoliorouter.post('/mutual-funds', userAuth, addMutualFund);
Portfoliorouter.put('/mutual-funds/:id', userAuth, updateMutualFund);
Portfoliorouter.delete('/mutual-funds/:id', userAuth, deleteMutualFund);
Portfoliorouter.post('/mutual-funds/:id/sell', userAuth, sellMutualFund);

// REAL ESTATE ROUTES
Portfoliorouter.get('/real-estate', userAuth, getRealEstate);
Portfoliorouter.post('/real-estate', userAuth, addRealEstate);
Portfoliorouter.put('/real-estate/:id', userAuth, updateRealEstate);
Portfoliorouter.delete('/real-estate/:id', userAuth, deleteRealEstate);
Portfoliorouter.post('/real-estate/:id/sell', userAuth, sellRealEstate);
// Fixed Deposit Routes
Portfoliorouter.get('/fixed-deposits', userAuth, getFixedDeposits);
Portfoliorouter.post('/fixed-deposits', userAuth, addFixedDeposit);
Portfoliorouter.put('/fixed-deposits/:id', userAuth, updateFixedDeposit);
Portfoliorouter.delete('/fixed-deposits/:id', userAuth, deleteFixedDeposit);

// PPF Account Routes
Portfoliorouter.get('/ppf', userAuth, getPPFAccounts);
Portfoliorouter.post('/ppf', userAuth, addPPFAccount);
Portfoliorouter.put('/ppf/:id', userAuth, updatePPFAccount);
Portfoliorouter.delete('/ppf/:id', userAuth, deletePPFAccount);
Portfoliorouter.post('/ppf/:id/contributions', userAuth, addYearlyContribution);

// Cryptocurrency Routes
Portfoliorouter.get('/crypto', userAuth, getCryptos);
Portfoliorouter.post('/crypto', userAuth, addCrypto);
Portfoliorouter.put('/crypto/:id', userAuth, updateCrypto);
Portfoliorouter.delete('/crypto/:id', userAuth, deleteCrypto);
Portfoliorouter.post('/crypto/:id/sell', userAuth, sellCrypto);

// Legacy routes - maintained for backward compatibility
Portfoliorouter.get('/get-stock', userAuth, getStocks);
Portfoliorouter.post('/add-stock', userAuth, addStock);
Portfoliorouter.put('/update-stock', userAuth, updateStock);
Portfoliorouter.delete('/delete', userAuth, deleteStock);

// In your routes file
Portfoliorouter.get("/realized-profits", userAuth, getRealizedProfits);
Portfoliorouter.get("/transaction-history", userAuth, getTransactionHistory);

export default Portfoliorouter;



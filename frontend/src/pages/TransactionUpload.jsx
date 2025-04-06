import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useGlobalContext } from '../context/GlobalContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReceiptScanner = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditTransaction, setCurrentEditTransaction] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [inputState, setInputState] = useState({
    title: '',
    amount: '',
    date: new Date(),
    category: '',
    description: '',
    type: 'expense'
  });

  // Get global context functions
  const { addExpense, addIncome } = useGlobalContext();

  const formatDate = (date) => {
    if (!date) return "Unknown";
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const totalAmount = transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.rawAmount || 0);
    return sum + amount;
  }, 0);

  const verifiedCount = transactions.filter(tx => tx.status === 'verified').length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const errorCount = transactions.filter(tx => tx.status === 'error').length;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setLoading(true);
    
    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', file);
      
      // Make API call
      const response = await axios.post("http://localhost:5050/process-image/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
      });
      
      // Process the API response data
      const apiData = response.data;
      console.log("API Response:", apiData);
      
      // Check if the response has a transactions property
      let dataToProcess = [];
      if (apiData && apiData.transactions && Array.isArray(apiData.transactions)) {
        dataToProcess = apiData.transactions;
      } else if (Array.isArray(apiData)) {
        dataToProcess = apiData;
      } else {
        console.error("API did not return a valid transactions array:", apiData);
        alert("Invalid response format from API");
        setLoading(false);
        return;
      }
      
      // Process the API data and set our transactions state
      const processedTransactions = dataToProcess.map((item, index) => {
        const isValidDate = item.date && item.date !== "unknown";
        
        return {
          id: index + 1,
          title: item.title || "Unknown",
          amount: `₹${parseFloat(item.amount || 0).toFixed(2)}`,
          rawAmount: parseFloat(item.amount || 0),
          date: isValidDate ? new Date(item.date).toISOString() : null,
          formattedDate: isValidDate ? formatDate(new Date(item.date)) : "Unknown",
          category: item.category || "Uncategorized",
          description: item.description || "",
          status: isValidDate ? "pending" : "error",
          type: item.type || "expense"
        };
      });
      
      setTransactions(processedTransactions);
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Error processing receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyTransaction = (id) => {
    setTransactions(transactions.map(tx => {
      if (tx.id === id) {
        // If status is verified, we add to database
        if (tx.status === "pending") {
          // Add to database based on type
          const transactionData = {
            title: tx.title,
            amount: tx.rawAmount,
            date: tx.date,
            category: tx.category,
            description: tx.description
          };
          
          if (tx.type === "income") {
            addIncome(transactionData);
          } else {
            addExpense(transactionData);
          }
          
          return { ...tx, status: 'verified' };
        }
        return tx;
      }
      return tx;
    }));
  };

  const verifyAll = () => {
    const updatedTransactions = transactions.map(tx => {
      if (tx.status === "pending") {
        // Add to database based on type
        const transactionData = {
          title: tx.title,
          amount: tx.rawAmount,
          date: tx.date,
          category: tx.category,
          description: tx.description
        };
        
        if (tx.type === "income") {
          addIncome(transactionData);
        } else {
          addExpense(transactionData);
        }
        
        return { ...tx, status: 'verified' };
      }
      return tx;
    });
    
    setTransactions(updatedTransactions);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  const handleEditTransaction = (transaction) => {
    setCurrentEditTransaction(transaction);
    setInputState({
      title: transaction.title,
      amount: transaction.rawAmount.toString(),
      date: transaction.date ? new Date(transaction.date) : new Date(),
      category: transaction.category,
      description: transaction.description,
      type: transaction.type
    });
    setShowEditModal(true);
    setIsEditMode(true);
  };

  const handleInput = (name) => (e) => {
    setInputState({ ...inputState, [name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setInputState({ ...inputState, date });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentEditTransaction) {
      // Update the transaction in our state
      const updatedTransactions = transactions.map(tx => {
        if (tx.id === currentEditTransaction.id) {
          const updatedTx = {
            ...tx,
            title: inputState.title,
            amount: `₹${parseFloat(inputState.amount).toFixed(2)}`,
            rawAmount: parseFloat(inputState.amount),
            date: inputState.date.toISOString(),
            formattedDate: formatDate(inputState.date),
            category: inputState.category,
            description: inputState.description,
            type: inputState.type,
            status: 'pending' // Reset to pending after edit
          };
          return updatedTx;
        }
        return tx;
      });
      
      setTransactions(updatedTransactions);
    }
    
    // Reset form and close modal
    setShowEditModal(false);
    setCurrentEditTransaction(null);
    setIsEditMode(false);
    setInputState({
      title: '',
      amount: '',
      date: new Date(),
      category: '',
      description: '',
      type: 'expense'
    });
  };

  return (
    <>
      <Sidebar onToggle={setIsSidebarCollapsed} />
      <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>
        <div className="p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold m-0">Receipt Scanner</h1>
              <p className="text-gray-500 text-sm mt-1">Upload receipts to extract transactions</p>
            </div>
          </div>
          
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold m-0">Upload Receipt</h2>
            </div>
            <div className="p-5">
              <div 
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className="text-5xl text-blue-400 mb-4">📄</div>
                <h3 className="font-medium mb-2">Drag & Drop Receipt Image</h3>
                <p className="text-gray-500 mb-4">or click to browse files</p>
                <button 
                  className="bg-white border border-gray-200 py-2 px-4 rounded-lg font-medium text-sm"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Select Image"}
                </button>
                <input 
                  id="fileInput" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-blue-600">
              <div className="text-gray-500 text-sm mb-2">Total Transactions</div>
              <div className="text-2xl font-semibold">{transactions.length}</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-green-500">
              <div className="text-gray-500 text-sm mb-2">Verified</div>
              <div className="text-2xl font-semibold">{verifiedCount}</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-yellow-500">
              <div className="text-gray-500 text-sm mb-2">Pending Verification</div>
              <div className="text-2xl font-semibold">{pendingCount}</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-red-500">
              <div className="text-gray-500 text-sm mb-2">Error/Unknown Date</div>
              <div className="text-2xl font-semibold">{errorCount}</div>
            </div>
          </div>
          
          {/* Transactions Section */}
          <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold m-0">Extracted Transactions</h2>
              {transactions.length > 0 && (
                <button 
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center"
                  onClick={verifyAll}
                >
                  <span className="mr-2">✓</span> Verify All
                </button>
              )}
            </div>
            <div className="p-5">
              {loading ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">Processing your receipt...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">No transactions extracted yet. Upload a receipt to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`px-4 py-3 border-b border-gray-200 flex justify-between items-center ${
                        transaction.status === 'verified' 
                          ? 'bg-green-50' 
                          : transaction.status === 'error'
                          ? 'bg-red-50'
                          : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">{transaction.formattedDate}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'verified' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status === 'verified' 
                            ? 'Verified' 
                            : transaction.status === 'error'
                            ? 'Error: Fix Date'
                            : '! Needs Review'}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Title</div>
                          <div className="text-sm">{transaction.title}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Amount</div>
                          <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount} 
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {transaction.type === 'income' ? '↑ Income' : '↓ Expense'}
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Category</div>
                          <div className="text-sm">{transaction.category}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Description</div>
                          <div className="text-sm">{transaction.description}</div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
                        <div className="flex gap-2">
                          <button 
                            className="text-xs p-1.5 border border-gray-200 bg-white rounded"
                            onClick={() => handleEditTransaction(transaction)}
                          >✏</button>
                          <button 
                            className={`text-xs p-1.5 border border-gray-200 bg-white rounded ${
                              transaction.status === 'error' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => transaction.status !== 'error' && verifyTransaction(transaction.id)}
                            disabled={transaction.status === 'error'}
                          >✓</button>
                        </div>
                        <button 
                          className="text-xs p-1.5 border border-gray-200 bg-white rounded"
                          onClick={() => deleteTransaction(transaction.id)}
                        >🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full relative border-2 border-blue-300">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setIsEditMode(false);
                setCurrentEditTransaction(null);
              }}
              className="absolute top-4 right-4 text-2xl"
            >
              ✖️
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              Edit Transaction
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  value={inputState.title}
                  name="title"
                  placeholder="Transaction Title"
                  onChange={handleInput('title')}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  value={inputState.amount}
                  name="amount"
                  placeholder="Amount"
                  onChange={handleInput('amount')}
                  className="w-full p-2 border rounded"
                  required
                  step="0.01"
                />
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={inputState.type === 'expense'}
                      onChange={() => setInputState({...inputState, type: 'expense'})}
                      className="mr-2"
                    />
                    Expense
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={inputState.type === 'income'}
                      onChange={() => setInputState({...inputState, type: 'income'})}
                      className="mr-2"
                    />
                    Income
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <DatePicker
                    selected={inputState.date}
                    onChange={handleDateChange}
                    className="w-full p-2 border rounded"
                    dateFormat="dd/MM/yyyy"
                    required
                  />
                </div>
                <input
                  type="text"
                  value={inputState.category}
                  name="category"
                  placeholder="Category"
                  onChange={handleInput('category')}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  value={inputState.description}
                  name="description"
                  placeholder="Description (if any)"
                  onChange={handleInput('description')}
                  className="w-full p-2 border rounded h-20"
                />
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                >
                  Update Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptScanner;
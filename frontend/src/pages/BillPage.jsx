import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Trash2, Mail, Calendar, CheckCircle, PlusCircle, Edit2, X, DollarSign, Clock, FileText, IndianRupeeIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { ArrowUp,ArrowDown,ArrowUpDown } from 'lucide-react';
const BillPage = () => {
  const { addExpense } = useGlobalContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { 
    addBill, 
    getBills,
    updateBill,
    deleteBill, 
    bills,
    expenses 
  } = useGlobalContext();
  
  // Bill types
  const billTypes = [
    { value: 'electricity', label: 'Electricity', emoji: '⚡' },
    { value: 'water', label: 'Water', emoji: '💧' },
    { value: 'telephone', label: 'Telephone', emoji: '☎️' },
    { value: 'internet', label: 'Internet', emoji: '🌐' },
    { value: 'phone_recharge', label: 'Phone Recharge', emoji: '📱' },
    { value: 'rent', label: 'Rent', emoji: '🏠' },
    { value: 'subscription', label: 'Subscription', emoji: '📺' },
    { value: 'other', label: 'Other', emoji: '📄' }
  ];

  // Recurrence options
  const recurrenceTypes = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'biannual', label: 'Half-Yearly' },
    { value: 'annual', label: 'Yearly' },
    { value: 'once', label: 'One-time' }
  ];

  const [showNewBillForm, setShowNewBillForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditBill, setCurrentEditBill] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Electricity',
    type: 'electricity',
    amount: '',
    dueDate: new Date(),
    recurrence: 'monthly',
    reminderDays: 3,
    description: ''
  });
  const [totalPaid, setTotalPaid] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [billSortField, setBillSortField] = useState("dueDate");
  const [billSortOrder, setBillSortOrder] = useState("asc");

  // Load bills from API on component mount
  useEffect(() => {
    getBills();
  }, []);
  
  // Check for upcoming bills whenever bills change
  useEffect(() => {
    if (bills && bills.length > 0) {
      checkUpcomingBills(bills);
    }
    if (expenses && expenses.length > 0) {
        const billsTotal = expenses
          .filter(expense => expense.category === 'Bills')
          .reduce((sum, expense) => sum + expense.amount, 0);
        setTotalPaid(billsTotal);
      }
  }, [bills,expenses]);

  // Auto-fill name based on type unless type is "other"
  useEffect(() => {
    if (formData.type !== 'other') {
      const selectedType = billTypes.find(type => type.value === formData.type);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          name: selectedType.label
        }));
      }
    }
  }, [formData.type]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prevState) => ({
      ...prevState,
      dueDate: date,
    }));
  };

  // Check for bills with upcoming deadlines
  const checkUpcomingBills = (billsData) => {
    const today = new Date();
    const newNotifications = [];
    
    billsData.forEach(bill => {
      const dueDate = new Date(bill.dueDate);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= bill.reminderDays && diffDays >= 0) {
        newNotifications.push({
          id: bill._id,
          message: `${bill.name} bill of ₹${bill.amount} is due in ${diffDays} days!`,
          type: 'reminder'
        });
      } else if (diffDays < 0) {
        newNotifications.push({
          id: bill._id,
          message: `${bill.name} bill of ₹${bill.amount} is overdue by ${Math.abs(diffDays)} days!`,
          type: 'overdue'
        });
      }
    });
    
    setNotifications(newNotifications);
  };

  // Handler for bill sorting
  const handleBillSort = (field) => {
    if (billSortField === field) {
      setBillSortOrder(billSortOrder === "asc" ? "desc" : "asc");
    } else {
      setBillSortField(field);
      setBillSortOrder("asc");
    }
  };

  // Sort bills based on current sort settings
  const sortedBills = [...bills].sort((a, b) => {
    if (billSortField === "amount") {
      return billSortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
    } else if (billSortField === "dueDate") {
      return billSortOrder === "asc" 
        ? new Date(a.dueDate) - new Date(b.dueDate) 
        : new Date(b.dueDate) - new Date(a.dueDate);
    } else if (billSortField === "name") {
      return billSortOrder === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (billSortField === "type") {
      return billSortOrder === "asc" 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    }
    return 0;
  });

  // Form submission handler
 const handleSubmitBill = (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.name || !formData.amount || !formData.dueDate) {
    alert('Please fill in all required fields');
    return;
  }

  const billData = {
    name: formData.name,
    amount: parseInt(formData.amount),
    type: formData.type,
    description: formData.description || '',
    dueDate: new Date(formData.dueDate).toISOString(),
    recurrence: formData.recurrence,
    reminderDays: parseInt(formData.reminderDays),
  };
  
  console.log('Submitting Bill Data:', billData);

  try {
    if (isEditMode && currentEditBill) {
      updateBill(currentEditBill._id, billData);
    } else {
      addBill(billData);
    }
     
    // Reset form and close modal
    setFormData({
      name: 'Electricity',
      type: 'electricity',
      amount: '',
      dueDate: new Date(),
      recurrence: 'monthly',
      reminderDays: 3,
      description: ''
    });
    
    setShowNewBillForm(false);
    setIsEditMode(false);
    setCurrentEditBill(null);
  } catch (error) {
    console.error('Error adding/updating bill:', error);
    alert('Failed to add/update bill. Please try again.');
  }
};
  // Edit bill handler
  const handleEditBill = (bill) => {
    setCurrentEditBill(bill);
    setFormData({
      name: bill.name,
      type: bill.type,
      amount: bill.amount,
      dueDate: new Date(bill.dueDate),
      recurrence: bill.recurrence || 'monthly',
      reminderDays: bill.reminderDays || 3,
      description: bill.description || ''
    });
    setShowNewBillForm(true);
    setIsEditMode(true);
  };

  // Mark bill as paid
  const handlePayBill = (billId) => {
    const billToPay = bills.find(bill => bill._id === billId);
    if (!billToPay) return;
    
    // Add to expenses
    const expenseData = {
      title: billToPay.name,
      amount: billToPay.amount,
      date: new Date(),
      category: 'Bills',
      description: `Paid ${billToPay.name} bill of ${new Date(billToPay.dueDate).toLocaleString('en-US', { month: 'short' })}`,
      emoji: getBillIcon(billToPay.type)
    };
    
    // Add to global expenses
    addExpense(expenseData);
    
    // Delete the current bill
    deleteBill(billId);
    
    // Check recurrence and create a new bill with future date if needed
    const recurrence = billToPay.recurrence || 'monthly';
    
    if (recurrence !== 'once') {
      // Calculate next due date based on recurrence
      const currentDueDate = new Date(billToPay.dueDate);
      let nextDueDate = new Date(currentDueDate);
      
      if (recurrence === 'monthly') {
        nextDueDate.setMonth(currentDueDate.getMonth() + 1);
      } else if (recurrence === 'quarterly') {
        nextDueDate.setMonth(currentDueDate.getMonth() + 3);
      } else if (recurrence === 'biannual') {
        nextDueDate.setMonth(currentDueDate.getMonth() + 6);
      } else if (recurrence === 'annual') {
        nextDueDate.setFullYear(currentDueDate.getFullYear() + 1);
      }
      
      // Create a new bill with the future date
      const newBillData = {
        name: billToPay.name,
        type: billToPay.type,
        amount: billToPay.amount,
        description: billToPay.description,
        dueDate: nextDueDate.toISOString(),
        recurrence: recurrence,
        reminderDays: billToPay.reminderDays || 3
      };
      
      // Add the new bill
      addBill(newBillData);
    }
    
    // Filter out related notifications
    setNotifications(prev => prev.filter(notif => notif.id !== billId));
    
    // Show confirmation toast instead of alert
    // Using setTimeout to simulate toast behavior
    const toastMessage = document.createElement('div');
    toastMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
    toastMessage.innerHTML = `<p>${billToPay.name} has been marked as paid and added to expenses.</p>
                             ${recurrence !== 'once' ? '<p>A new bill has been scheduled for the next payment period.</p>' : ''}`;
    document.body.appendChild(toastMessage);
    
    setTimeout(() => {
      toastMessage.classList.add('animate-fadeOut');
      setTimeout(() => {
        document.body.removeChild(toastMessage);
      }, 500);
    }, 3000);
  };

  // Delete bill
  const handleDeleteBill = (billId) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      deleteBill(billId);
      
      // Filter out related notifications
      setNotifications(prev => prev.filter(notif => notif.id !== billId));
      
      // Toast notification instead of alert
      const toastMessage = document.createElement('div');
      toastMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
      toastMessage.innerHTML = `<p>Bill has been deleted.</p>`;
      document.body.appendChild(toastMessage);
      
      setTimeout(() => {
        toastMessage.classList.add('animate-fadeOut');
        setTimeout(() => {
          document.body.removeChild(toastMessage);
        }, 500);
      }, 3000);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get appropriate icon based on bill type
  const getBillIcon = (type) => {
    const bill = billTypes.find(bill => bill.value === type);
    return bill ? bill.emoji : '📄';
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color based on days until due
  const getStatusColor = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'bg-red-100 text-red-800'; // Overdue
    if (days <= 3) return 'bg-yellow-100 text-yellow-800'; // Due soon
    return 'bg-green-100 text-green-800'; // Due later
  };
  
  // History of Paid Bills component
const PaidBillsHistory = ({ expenses }) => {
    // Filter only expenses with the 'Bills' category
    const paidBills = expenses.filter(expense => expense.category === 'Bills');
    
    // Sort by date (most recent first)
    const sortedPaidBills = [...paidBills].sort((a, b) => new Date(b.date) - new Date(a.date));
  
    // Format date 
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    };
  
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mt-8">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-green-600 flex items-center">
            <DollarSign className="mr-2" size={18} />
            Payment History
          </h2>
        </div>
        
        {sortedPaidBills.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
              <FileText size={32} />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">No payment history</p>
            <p className="text-gray-500 mb-4">Your bill payment history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedPaidBills.map(expense => (
                  <tr key={expense._id} className="hover:bg-green-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 text-xl">{expense.emoji || '📄'}</div>
                        <div>
                          <div className="font-medium text-gray-900">{expense.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">₹{expense.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        <span className="text-gray-900">{formatDate(expense.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-500 text-sm">{expense.description}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      <Sidebar onToggle={setIsSidebarCollapsed} />
      <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 ' : 'ml-64 max-w-full'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Bill Management</h1>
            <p className="text-gray-500">Track, manage, and pay your bills on time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow text-center border border-gray-200">
              <p className="text-sm text-gray-600">Total Bill's Paid
              <span className="text-base font-bold pl-2 text-green-600">₹{totalPaid.toFixed(2)}</span></p>
            </div>
            <button 
              onClick={() => {
                setShowNewBillForm(true);
                setIsEditMode(false);
                setCurrentEditBill(null);
                setFormData({
                  name: 'Electricity',
                  type: 'electricity',
                  amount: '',
                  dueDate: new Date(),
                  recurrence: 'monthly',
                  reminderDays: 3,
                  description: ''
                });
              }} 
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-md"
            >
              <PlusCircle size={16} />
              <span>Add New Bill</span>
            </button>
          </div>
        </div>
        
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-600 flex items-center">
              <Mail className="mr-2" size={18} />
              Notifications ({notifications.length})
            </h2>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg flex justify-between items-center shadow-sm border ${
                    notification.type === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <p className="font-medium">{notification.message}</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePayBill(notification.id)}
                      className={`${notification.type === 'overdue' ? 'bg-red-100 hover:bg-red-200' : 'bg-yellow-100 hover:bg-yellow-200'} p-2 rounded-full transition-colors`}
                      title="Mark as Paid"
                    >
                      <CheckCircle size={18} className={notification.type === 'overdue' ? 'text-red-600' : 'text-yellow-600'} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* New Bill Form Modal */}
        {showNewBillForm && (
          <div className="fixed inset-0 backdrop-blur-xs bg-opacity-100 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-90vh overflow-y-auto p-6 m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-600">
                  {isEditMode ? 'Edit Bill' : 'Create New Bill'}
                </h2>
                <button 
                  onClick={() => setShowNewBillForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitBill} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bill Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
                    <div className="relative">
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                      >
                        {billTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.emoji} {type.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Name - show only if type is "other" or in edit mode */}
                  {(formData.type === 'other' || isEditMode) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                          <FileText size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Bill Name"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <IndianRupeeIcon size={16} className="text-gray-400" />
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </span>
                      <DatePicker
                        selected={formData.dueDate instanceof Date ? formData.dueDate : new Date(formData.dueDate)}
                        onChange={handleDateChange}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        dateFormat="dd/MM/yyyy"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Recurrence */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock size={16} className="text-gray-400" />
                      </span>
                      <select
                        name="recurrence"
                        value={formData.recurrence}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                      >
                        {recurrenceTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reminder Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reminder (Days Before)</label>
                    <input
                      type="number"
                      name="reminderDays"
                      value={formData.reminderDays}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="30"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">You'll be notified this many days before the due date.</p>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add any additional details about this bill"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBillForm(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
                    // disabled={!formData.name || !formData.dueDate}
                  >
                    {isEditMode ? <Edit2 size={16} /> : <PlusCircle size={16} />}
                    {isEditMode ? 'Update Bill' : 'Add Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Total Bills</h3>
            <p className="text-2xl font-bold">{bills.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Due This Month</h3>
            <p className="text-2xl font-bold">
              {bills.filter(bill => {
                const dueDate = new Date(bill.dueDate);
                const now = new Date();
                return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-500">Due Soon (3 Days)</h3>
            <p className="text-2xl font-bold">
              {bills.filter(bill => {
                const days = getDaysUntilDue(bill.dueDate);
                return days >= 0 && days <= 3;
              }).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
            <p className="text-2xl font-bold">
              {bills.filter(bill => getDaysUntilDue(bill.dueDate) < 0).length}
            </p>
          </div>
        </div>
        {/* Bills List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-blue-600 flex items-center">
              <Calendar className="mr-2" size={18} />
              Upcoming Bills
            </h2>
            
            {/* Filter/sort options could go here */}
          </div>
          
          {bills.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
                <PlusCircle size={32} />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">No bills found</p>
              <p className="text-gray-500 mb-4">Add a new bill to get started with tracking</p>
              <button 
                onClick={() => {
                  setShowNewBillForm(true);
                  setIsEditMode(false);
                  setCurrentEditBill(null);
                  setFormData({
                    name: 'Electricity',
                    type: 'electricity',
                    amount: '',
                    dueDate: new Date(),
                    recurrence: 'monthly',
                    reminderDays: 3,
                    description: ''
                  });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your First Bill
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                        onClick={() => handleBillSort("name")}>
                        <div className="flex flex-row items-center">
                            Bill <span className="ml-2">{billSortField === "name" ? (billSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                        </div>
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                        onClick={() => handleBillSort("amount")}>
                        <div className="flex flex-row items-center">
                            Amount <span className="ml-2">{billSortField === "amount" ? (billSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                        </div>
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                        onClick={() => handleBillSort("dueDate")}>
                        <div className="flex flex-row items-center">
                            Due Date <span className="ml-2">{billSortField === "dueDate" ? (billSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                        </div>
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                        onClick={() => handleBillSort("type")}>
                        <div className="flex flex-row items-center">
                            Type <span className="ml-2">{billSortField === "type" ? (billSortOrder === "asc" ? <ArrowUp size={20}/> : <ArrowDown size={20}/>) : <ArrowUpDown size={20}/>}</span>
                        </div>
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurrence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reminder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedBills.map(bill => (
                    <tr key={bill._id} className="hover:bg-blue-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-2 text-xl">{getBillIcon(bill.type)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{bill.name}</div>
                            {bill.description && (
                              <div className="text-sm text-gray-500">{bill.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">₹{bill.amount.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                            <div className="flex items-center">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            <span className="text-gray-900">{formatDate(bill.dueDate)}</span>
                            </div>
                            <span className="text-sm text-gray-500 mt-1">
                            {Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24))-1} days left
                            </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-900">
                          {billTypes.find(t => t.value === bill.type)?.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {recurrenceTypes.find(t => t.value === bill.recurrence)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail size={14} className="mr-1 text-gray-400" />
                          <span>{bill.reminderDays} days before</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePayBill(bill._id)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Bill"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBill(bill._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Bill"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          )}
        </div>
        {/* After the Upcoming Bills div, add: */}
<PaidBillsHistory expenses={expenses} />
      </div>
    </>
  );
};

export default BillPage;
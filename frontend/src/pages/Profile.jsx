import React, { useState, useEffect ,useContext} from 'react';
import { 
  User, Mail, Phone, Home, Edit3, LogOut, AlertCircle, Info, 
  CreditCard, MapPin, Briefcase, DollarSign, Settings, Check, X, 
  Calendar, Clock, Bell, Eye, EyeOff, 
  Shield, Trash2, GripVertical,Save,ShieldCheck,
  FolderOpen,Edit,ArrowUpCircle,ArrowDownCircle,Award,
  Download,TrendingUp,Scissors,PlusCircle,IndianRupee,ReceiptIndianRupee,
  PlusSquare,Plus,MinusCircle,MinusSquare,Minus,
  CheckCircle,CheckSquare,Star,Laptop, Smartphone, Globe,
  ShieldAlertIcon
} from 'lucide-react';
import axios from 'axios';
import SecurityTab from '../components/ChangePassword'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatDistanceToNow } from 'date-fns';
import ChangePasswordForm from '../components/ChangePassword';
import { AppContent } from '../context/AppContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GlobalContext, useGlobalContext } from '../context/GlobalContext';

// Base URL for API calls - replace with your actual base URL
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const CategoryAPI = {
  addCategory: async (categoryType, categoryName) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/add-category`, {
        categoryType,
        categoryName
      }, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to add category');
      return response.data.category; // Should be { _id, name }
    } catch (error) {
      console.error('Error adding category:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  editCategory: async (categoryType, categoryId, newCategoryName) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/auth/edit-category`, {
        categoryType,
        categoryId,
        newCategoryName
      }, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to edit category');
      return response.data; // Adjust based on backend response
    } catch (error) {
      console.error('Error editing category:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  deleteCategory: async (categoryType, categoryId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/api/auth/delete-category`, {
        data: { categoryType, categoryId },
        withCredentials: true
      });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to delete category');
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  updateCategoryOrder: async (categoryType, categories) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/auth/update-category-order`, {
        categoryType,
        categories
      }, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to update category order');
      toast.success("Updated order of categories!");
      return response.data;
    } catch (error) {
      console.error('Error updating category order:', {
        message: error.message,
        response: error.response?.data
      });
      toast.error(error.response?.data?.message || "Failed to update category order");
      throw error;
    }
  }
};

// Separate component for category form to avoid conditional hooks
const CategoryForm = ({ editingSection, setEditingSection, categoryType, editingCategory, setUserData, setError }) => {
  const [categoryName, setCategoryName] = useState(editingCategory?.name || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedCategory;
      if (editingSection === 'editCategory') {
        await CategoryAPI.editCategory(categoryType, editingCategory.id, categoryName);
        updatedCategory = { _id: editingCategory.id, name: categoryName };
      } else {
        const newCategory = await CategoryAPI.addCategory(categoryType, categoryName);
       updatedCategory = newCategory;
      }
      
      setUserData(prev => {
        const updatedCategories = editingSection === 'editCategory'
          ? prev.onboardingData[categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories']
              .map(cat => cat._id === updatedCategory._id ? updatedCategory : cat)
          : [
              ...prev.onboardingData[categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories'],
              updatedCategory
            ];
        
        return {
          ...prev,
          onboardingData: {
            ...prev.onboardingData,
            [categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories']: updatedCategories
          }
        };
      });
      
      setEditingSection(null);
      setCategoryName('');
      toast.success(`Category ${editingSection === 'editCategory' ? 'updated' : 'added'} successfully`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to save category');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        type="text"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        placeholder="Category Name"
        className="w-full p-2 border rounded mb-2"
      />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          {editingSection === 'editCategory' ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setEditingSection(null)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [editingSection, setEditingSection] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isSecurityAlertsEnabled, setIsSecurityAlertsEnabled] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const{setIsLoggedin,backendUrl} =useContext(AppContent);
  const{addExpense}= useGlobalContext();
  const [newItem, setNewItem] = useState('');
  const [originalData, setOriginalData] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/user/get-data`, {
          withCredentials: true,
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch user data');
  

        setUserData(response.data.userData); // No need to map, backend handles it
        setFormData(response.data.userData);

      } catch (err) {
        setError(err.message);
        setUserData(null);
        
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const sendVerificationOtp= async()=>{
    try{
      axios.defaults.withCredentials=true;
      const{data}= await axios.post(`${BASE_URL}/api/auth/send-verify-otp`)
      if(data.success){
        navigate('/verify-email')
        toast.success(data.message)
      }
      else{
        toast.error(data.message)
      }
    }catch(e){
    toast.error(e.message);
  }
  }  

  const handleProfileAction = (action) => {
    if (action === "logout") {
      // Handle logout logic here
      // console.log("Logging out...");
      logout();
      navigate("/");
    }
  };

  const logout = async()=>{
    try{
      axios.defaults.withCredentials=true;
      const{data} = await axios.post(`${BASE_URL}/api/auth/logout`);
      data.success && setIsLoggedin(false);
      data.success && setUserData(false);
      localStorage.removeItem('user-info');
      toast.success(data.message)
      navigate('/')
    }
    catch(error){
      toast.error(error.message);
    }
  };

  // Function to update user data
  const updateUserData = async (updatedData) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/auth/update-profile`, updatedData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        return true;
      } else {
        toast.error(response.data.message);
        return false;
      }
    } catch (error) {
      console.error("Update user data error:", error);
      toast.error("Error updating profile");
      return false;
    }
  };

  const handleDragEnd = async (result, categoryType) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;
  
    const categories = categoryType === 'income'
      ? [...userData.onboardingData.customIncomeCategories]
      : [...userData.onboardingData.customExpenseCategories];
  
    const [reorderedItem] = categories.splice(source.index, 1);
    categories.splice(destination.index, 0, reorderedItem);
  

    try {
      setUserData(prev => ({
        ...prev,
        onboardingData: {
          ...prev.onboardingData,
          [categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories']: categories
        }
      }));
      await CategoryAPI.updateCategoryOrder(categoryType, categories);
    } catch (error) {
      setError(error.message);
      setUserData(prev => prev);
    }
  };

  const handleSaveFinance = async () => {
    try {
      const response = await axios.put(`${BASE_URL}/api/auth/update-onboarding`, {
        onboardingData: formData.onboardingData
      }, { withCredentials: true });
  
      if (response.data.success) {
        setUserData({ ...userData, onboardingData: formData.onboardingData });
        setIsEditing(false);
        setEditingSection(null);
        toast.success('Financial profile updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update financial profile');
      }
    } catch (error) {
      console.error('Error updating financial profile:', error);
      toast.error(error.response?.data?.message || 'Error updating financial profile');
    }
  };

  const renderCategoryItem = (category, index, categoryType) => {

    if (!category._id) {
      console.error('Category missing _id:', category);
      return (
        <div key={`${categoryType}-${category.name}-${index}`} className="p-3 text-red-500 flex items-center justify-between">
          <span>Error: Invalid category "{category.name}" (missing ID)</span>
          <span className="text-xs">Contact support to fix</span>
        </div>
      );
    }
    
    const categoryId = category._id.toString();
    
    return (
      <Draggable key={categoryId} draggableId={categoryId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              snapshot.isDragging ? 'bg-blue-50 shadow-md' : 'bg-white hover:bg-gray-50'
            } transition-all duration-200`}
          >
            <div className="flex items-center">
              <GripVertical className="mr-3 text-gray-400" size={16} />
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  categoryType === 'income' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium text-gray-700">{category.name}</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  setEditingCategory({ type: categoryType, id: categoryId, name: category.name });
                  setEditingSection('editCategory');
                }}
                className="p-1 text-gray-500 hover:text-blue-500 mr-1"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={async () => {
                  try {
                    await CategoryAPI.deleteCategory(categoryType, categoryId);
                    setUserData(prev => ({
                      ...prev,
                      onboardingData: {
                        ...prev.onboardingData,
                        [categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories']: prev.onboardingData[
                          categoryType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories'
                        ].filter(cat => cat._id !== categoryId)
                      }
                    }));
                    toast.success('Category deleted successfully');
                  } catch (error) {
                    console.error('Error deleting category:', error);
                    setError(error.message);
                    toast.error(error.message || 'Failed to delete category');
                  }
                }}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderEmailVerificationBanner = () => {
    if (userData.isAccountVerified) return null;
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Email Verification Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your email address has not been verified. Please verify your email to access all features.</p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={sendVerificationOtp}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Resend Verification Email
              </button>
              <button
                onClick={sendVerificationOtp}
                className="inline-flex items-center px-4 py-2 border border-yellow-600 text-sm font-medium rounded-md shadow-sm text-yellow-600 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Go to Verification Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };


  const handleAddItem = (category) => {
    if (newItem.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem]
    }));
    
    setNewItem('');
  };

  const handleRemoveItem = (category, item) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const handleInputChangeAge = (e) => {
    const { name, value } = e.target;
    
    // Prevents leading zeros and restricts input to numbers only
    const sanitizedValue = value.replace(/^0+/, '');
  
    // Restrict to numbers between 1-99
    if (!isNaN(sanitizedValue) && sanitizedValue >= 1 && sanitizedValue <= 99) {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue
      }));
    }
  };

  const handleSave = async () => {
    const success = await updateUserData(formData);
    if (success) {
      setUserData({...formData});
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({...userData});
    setIsEditing(false);
  };

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/auth/check-premium-status`);
      if (response.data.success) {
        // Update user data with subscription info
        setUserData(prevData => ({
          ...prevData,
          isPremium: response.data.isPremium,
          subscriptionType: response.data.subscriptionType || 'monthly',
          subscriptionEndDate: response.data.subscriptionEndDate,
          daysRemaining: response.data.daysRemaining || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  // First, let's add a function to fetch transaction history from expenses
  const fetchSubscriptionHistory = async () => {
    try {
      // Assuming you have an API endpoint to fetch expenses
      const response = await axios.get(`${BASE_URL}/api/auth/get-payment`);
      // Map to the format needed for the billing history table
      // return subscriptionHistory.map(expense => ({
      //   date: expense.date,
      //   amount: expense.amount,
      //   status: 'Paid', // Since these are recorded expenses, they're assumed paid
      //   id: expense._id, // Assuming your expense objects have IDs
      //   description: expense.description
      // }));
      if(response.data.success) return response.data.payments;
      else {
        toast.error(response.data.message || 'Failed to fetch subscription history');
      console.log(response.data);
    }
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  };

// Add this to your component initialization (useEffect)
useEffect(() => {
  const loadData = async () => {
    if (userData && userData.isPremium) {
      const history = await fetchSubscriptionHistory();
      setUserData(prevData => ({...prevData, billingHistory: history}));
    }
  };
  loadData();
}, [userData?.isPremium]);

// Modify the download invoice function to generate a PDF
const downloadInvoice = (paymentId) => {
  // Find the specific payment record
  const payment = userData.billingHistory.find(item => item.id === paymentId);
  
  if (!payment) {
    toast.error('Invoice not found');
    return;
  }
  
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Helper function to draw a line
    const drawLine = (y) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };
    
    // Helper function for creating a simple table
    const createTable = (headers, rows, startY) => {
      const colWidth = (pageWidth - 2 * margin) / headers.length;
      let y = startY;
      
      // Headers
      doc.setFillColor(44, 62, 80);
      doc.setDrawColor(44, 62, 80);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
      
      headers.forEach((header, i) => {
        doc.text(header, margin + (i * colWidth) + 5, y + 7);
      });
      y += 10;
      
      // Rows
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      rows.forEach((row, rowIndex) => {
        // Alternate row background for better readability
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
        }
        
        row.forEach((cell, i) => {
          // Right-align the amount column
          if (i === headers.length - 1) {
            doc.text(cell, (margin + ((i + 1) * colWidth)) - 5, y + 7, { align: 'right' });
          } else {
            doc.text(cell, margin + (i * colWidth) + 5, y + 7);
          }
        });
        y += 10;
      });
      
      return y; // Return the new Y position
    };
    
    // Add company logo/header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('AI Finance Pro', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('RECEIPT', pageWidth / 2, 32, { align: 'center' });
    
    // Add receipt number and date in top corners
    doc.setFontSize(10);
    doc.text(`Receipt #: ${payment.id.substring(0, 8)}`, margin, 50);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })}`, pageWidth - margin, 50, { align: 'right' });
    
    // Add billing and subscription info
    let y = 70;
    
    // Two-column layout for customer and payment info
    const colWidth = (pageWidth - (2 * margin)) / 2;
    
    // Left column - Customer info
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Information', margin, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Name: ${userData.name || 'User'}`, margin, y + 10);
    doc.text(`Email: ${userData.email || 'Not provided'}`, margin, y + 20);
    
    // Right column - Payment info
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Information', margin + colWidth, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Method: ${payment.paymentMethod || 'Online Payment'}`, margin + colWidth, y + 10);
    doc.text(`Status: ${payment.status}`, margin + colWidth, y + 20);
    doc.text(`Transaction ID: ${payment.paymentId || 'N/A'}`, margin + colWidth, y + 30);
    doc.text(`Order ID: ${payment.orderId || 'N/A'}`, margin + colWidth, y + 40);
    
    // Subscription details
    y += 60;
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'bold');
    doc.text('Subscription Details', margin, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.text(`Plan: ${payment.plan || 'Premium'}`, margin, y + 10);
    
    // Format subscription date range
    const startDate = payment.subscriptionPeriod?.start ? 
      new Date(payment.subscriptionPeriod.start).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) : 'N/A';
    
    const endDate = payment.subscriptionPeriod?.end ? 
      new Date(payment.subscriptionPeriod.end).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) : 'N/A';
    
    doc.text(`Period: ${startDate} to ${endDate}`, margin, y + 20);
    
    // Draw line above invoice items
    drawLine(y + 35);
    
    // Invoice items table
    y += 45;
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Items', margin, y);
    y += 10;
    
    // Create table headers and rows
    const headers = ['Description', 'Amount'];
    
    // Handle potential undefined values
    const processingFee = payment.fee ? (payment.fee/100).toFixed(2) : '0.00';
    const taxAmount = payment.tax ? (payment.tax/100).toFixed(2) : '0.00';
    const currency = payment.currency || '$';
    const discount = (payment.tax + payment.fee)/100;

    const rows = [
      ['Subscription Fee', `${currency} ${payment.amount}`],
      ['Processing Fee', `${currency} ${processingFee}`],
      ['Tax', `${currency} ${taxAmount}`],
      ['Discount', `- ${currency} ${discount}`],
    ];
    
    // Calculate the total
    const total = (
      parseFloat(payment.amount)
    ).toFixed(2);
    
    // Call custom table function
    let tableEndY = createTable(headers, rows, y);
    
    // Add total
    tableEndY += 6;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', pageWidth - margin - 80, tableEndY);
    doc.text(`${currency} ${total}`, pageWidth - margin-5, tableEndY, { align: 'right' });
    
    // Add footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    drawLine(pageHeight - 30);
    doc.text('Thank you for your subscription to AI Finance Pro.', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text('For any questions, please contact support@aifinancepro.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save the PDF
    doc.save(`AI-Finance-Pro-Invoice-${payment.id.substring(0, 8)}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    toast.error('Failed to generate receipt PDF');
    
    // Fallback to text receipt if PDF generation fails
    try {
      const receiptText = `
===========================================
              AI FINANCE PRO
                 RECEIPT
===========================================
Receipt #: ${payment.id.substring(0, 8)}
Date: ${new Date().toLocaleDateString()}

CUSTOMER INFORMATION
-------------------
Name: ${userData.name || 'User'}
Email: ${userData.email || 'Not provided'}

PAYMENT INFORMATION
------------------
Method: ${payment.paymentMethod || 'Online Payment'}
Status: ${payment.status}
Transaction ID: ${payment.paymentId || 'N/A'}
Order ID: ${payment.orderId || 'N/A'}

SUBSCRIPTION DETAILS
-------------------
Plan: ${payment.plan || 'Premium'}
Start Date: ${payment.subscriptionPeriod?.start ? new Date(payment.subscriptionPeriod.start).toLocaleDateString() : 'N/A'}
End Date: ${payment.subscriptionPeriod?.end ? new Date(payment.subscriptionPeriod.end).toLocaleDateString() : 'N/A'}

INVOICE ITEMS
------------
Subscription Fee:  ${payment.currency || '$'} ${payment.amount}
Processing Fee:    ${payment.currency || '$'} ${(payment.fee/100).toFixed(2) || '0.00'}
Tax:               ${payment.currency || '$'} ${(payment.tax/100).toFixed(2) || '0.00'}
                  ----------
TOTAL:             ${payment.currency || '$'} ${(
        parseFloat(payment.amount) + 
        parseFloat((payment.fee/100).toFixed(2) || 0) + 
        parseFloat((payment.tax/100).toFixed(2) || 0)
      ).toFixed(2)}

===========================================
Thank you for your subscription to AI Finance Pro.
For any questions, please contact support@aifinancepro.com
===========================================
`;
      
      // Create a blob and download it
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI-Finance-Pro-Receipt-${payment.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (fallbackError) {
      console.error('Even text fallback failed:', fallbackError);
      toast.error('Could not generate receipt in any format. Please contact support.');
    }
  }
};
 
  const confirmCancellation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${BASE_URL}/api/auth/cancel-subscription`);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Subscription canceled successfully');
        setShowCancelConfirm(false);
        await fetchSubscriptionData(); // Refresh data
      } else {
        toast.error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePayment = () => {
    // Implement payment update flow - could open a modal or redirect to payment page
    toast.info('Payment update feature will be available soon');
  };
  

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderFinancialItem = (item, onEdit, onDelete) => {
    return (
      <div key={item._id || item} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2 mb-2">
        <span>{item.name || item}</span>
        {onEdit && onDelete && (
          <div className="flex ml-2">
            <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 ml-1">
              <Edit3 size={12} />
            </button>
            <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 ml-1">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const navigateToOnboarding = () => {
    window.location.href = '/onboarding';
  };

  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span>Loading...</span>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-xl font-medium text-gray-700">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  
    if (!userData) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-xl font-medium text-gray-700">No user data available</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    
  if (activeTab === 'profile') {
    return (
      <div className="w-full">
        {renderEmailVerificationBanner()}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center text-blue-500 hover:text-blue-700"
                >
                  <Edit3 size={16} className="mr-1" /> Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-1 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                    {userData.isAccountVerified ? (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500">
                        <AlertCircle size={16} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleInputChangeAge}
                    min={1}
                    max={99}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-gray-800">{userData.name}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="text-gray-500 mr-3" size={18} />
                  <div className="flex-grow">
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center">
                      <p className="text-gray-800">{userData.email}</p>
                      {userData.isAccountVerified ? (
                        <span className="ml-2 text-green-500 flex items-center">
                          <Check size={16} className="mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="ml-2 text-yellow-500 flex items-center">
                          <AlertCircle size={16} className="mr-1" /> Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    {userData.age ? (
                      <p className="text-gray-800">{userData.age} years</p>
                    ) : (
                      <p className="text-gray-400 italic">Not set</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    {userData.phone ? (
                      <p className="text-gray-800">{userData.phone}</p>
                    ) : (
                      <p className="text-gray-400 italic">Not set</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    {userData.address ? (
                      <p className="text-gray-800">{userData.address}</p>
                    ) : (
                      <p className="text-gray-400 italic">Not set</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Account Updated</p>
                    <p className="text-gray-800">{formatDate(userData.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="text-gray-500 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="text-gray-800">{formatDate(userData.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Account Management</h2>
            <div className="space-y-4">
            <button 
              onClick={() => setShowChangePasswordModal(true)}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <Settings size={16} className="mr-2" /> Change Password
            </button>
            
              <button className="flex items-center text-red-500 hover:text-red-700" onClick={() => handleProfileAction("logout")}>
                <LogOut className="mr-2" size={16} /> Log Out
              </button>
              {/* <button className="flex items-center text-red-500 hover:text-red-700">
                <Trash2 className="mr-2" size={16} /> Delete Account
              </button> */}
            </div>
          </div>
        </div>
        {/* Modal or overlay for Change Password Form */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-md">
              <ChangePasswordForm 
                onClose={() => setShowChangePasswordModal(false)}
              />
            </div>
          </div>
        )}
      </div>
      
    );
  } 
  else if (activeTab === 'finance') {
    return (
      <div className="w-full">
        {!userData.isOnboardingComplete ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-xl font-medium text-gray-700">Please Complete Onboarding!</p>
              <button
                onClick={navigateToOnboarding}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Click here for Onboarding
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Financial Profile Section */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="text-xl font-bold">Financial Profile</h2>
                  {editingSection !== 'financialProfile' ? (
                    <button
                      onClick={() => {
                        setEditingSection('financialProfile');
                        setOriginalData({ ...formData }); // Save original data for cancel
                      }}
                      className="flex items-center text-blue-500 hover:text-blue-700 mt-2 sm:mt-0"
                    >
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={handleSaveFinance}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      >
                        <Save size={16} className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setFormData({ ...originalData }); // Revert to original data
                          setEditingSection(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center"
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
  
                {editingSection === 'financialProfile' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={formData.onboardingData?.employmentStatus || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: { ...formData.onboardingData, employmentStatus: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>Select Status</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Student">Student</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Income ($)</label>
                      <input
                        type="number"
                        value={formData.onboardingData?.yearlyIncome ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: {
                              ...formData.onboardingData,
                              yearlyIncome: e.target.value === '' ? 0 : Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
                      <input
                        type="number"
                        value={formData.onboardingData?.monthlyBudget ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: {
                              ...formData.onboardingData,
                              monthlyBudget: e.target.value === '' ? 0 : Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Savings Goal ($)</label>
                      <input
                        type="number"
                        value={formData.onboardingData?.savingsGoal ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: {
                              ...formData.onboardingData,
                              savingsGoal: e.target.value === '' ? 0 : Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                      <select
                        value={formData.onboardingData?.riskLevel || 'Moderate'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: { ...formData.onboardingData, riskLevel: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>Select Risk Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userData.onboardingData.employmentStatus && (
                      <div className="flex items-center">
                        <ReceiptIndianRupee className="text-gray-500 mr-3" size={18} />
                        <div>
                          <p className="text-sm text-gray-500">Employment Status</p>
                          <p className="text-gray-800">{userData.onboardingData.employmentStatus}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <IndianRupee className="text-gray-500 mr-3" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Yearly Income</p>
                        <p className="text-gray-800">{Number(userData.onboardingData.yearlyIncome).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="text-gray-500 mr-3" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Monthly Budget</p>
                        <p className="text-gray-800">{Number(userData.onboardingData.monthlyBudget).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="text-gray-500 mr-3" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Savings Goal</p>
                        <p className="text-gray-800">{Number(userData.onboardingData.savingsGoal).toLocaleString()}</p>
                      </div>
                    </div>
                    {userData.onboardingData.riskLevel && (
                      <div className="flex items-start">
                        <ShieldAlertIcon className="text-gray-500 mr-3 mt-1" size={18} />
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Risk Level</p>
                          <div className="flex items-center">
                            <span
                              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                userData.onboardingData.riskLevel === 'High'
                                  ? 'bg-red-500'
                                  : userData.onboardingData.riskLevel === 'Medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                            ></span>
                            <p className="text-gray-800 font-medium">{userData.onboardingData.riskLevel}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
  {/* Investments Section */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="text-xl font-bold">Investments</h2>
                  {editingSection !== 'investments' ? (
                    <button
                      onClick={() => {
                        setEditingSection('investments');
                        setOriginalData({ ...formData });
                      }}
                      className="flex items-center text-blue-500 hover:text-blue-700 mt-2 sm:mt-0"
                    >
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={handleSaveFinance}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      >
                        <Save size={16} className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setFormData({ ...originalData });
                          setEditingSection(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center"
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
  
                {editingSection === 'investments' ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.onboardingData?.isCurrentlyInvesting || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingData: {
                              ...formData.onboardingData,
                              isCurrentlyInvesting: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">Currently Investing</label>
                    </div>
  
                    {formData.onboardingData?.isCurrentlyInvesting && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Investment Types</p>
                        <div className="flex flex-wrap mb-4">
                          {formData.onboardingData?.investmentTypes?.map((type, index) => (
                            <div key={index} className="flex items-center mr-4 mb-2">
                              <input
                                type="text"
                                value={type}
                                onChange={(e) => {
                                  const newTypes = [...formData.onboardingData.investmentTypes];
                                  newTypes[index] = e.target.value;
                                  setFormData({
                                    ...formData,
                                    onboardingData: { ...formData.onboardingData, investmentTypes: newTypes },
                                  });
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                onClick={() => {
                                  const newTypes = formData.onboardingData.investmentTypes.filter(
                                    (_, i) => i !== index
                                  );
                                  setFormData({
                                    ...formData,
                                    onboardingData: { ...formData.onboardingData, investmentTypes: newTypes },
                                  });
                                }}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Add a new investment type"
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => {
                              if (newItem.trim()) {
                                setFormData({
                                  ...formData,
                                  onboardingData: {
                                    ...formData.onboardingData,
                                    investmentTypes: [
                                      ...(formData.onboardingData?.investmentTypes || []),
                                      newItem,
                                    ],
                                  },
                                });
                                setNewItem('');
                              }
                            }}
                            className="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600"
                          >
                            <PlusCircle size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Currently Investing</p>
                      <p className="flex items-center text-gray-800">
                        {userData.onboardingData.isCurrentlyInvesting ? (
                          <>
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                            Yes
                          </>
                        ) : (
                          <>
                            <X size={18} className="text-red-500 mr-2" />
                            No
                          </>
                        )}
                      </p>
                    </div>
                    {userData.onboardingData.isCurrentlyInvesting &&
                      userData.onboardingData.investmentTypes &&
                      userData.onboardingData.investmentTypes.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Investment Types</p>
                          <div className="flex flex-wrap">
                            {userData.onboardingData.investmentTypes.map((type, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full mr-2 mb-2 flex items-center"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
            {/* Financial Goals Section */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="text-xl font-bold">Financial Goals</h2>
                  {editingSection !== 'financialGoals' ? (
                    <button
                      onClick={() => {
                        setEditingSection('financialGoals');
                        setOriginalData({ ...formData });
                      }}
                      className="flex items-center text-blue-500 hover:text-blue-700 mt-2 sm:mt-0"
                    >
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={handleSaveFinance}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      >
                        <Save size={16} className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setFormData({ ...originalData });
                          setEditingSection(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center"
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
  
                {editingSection === 'financialGoals' ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap mb-4">
                      {formData.onboardingData?.financialGoals?.map((goal, index) => (
                        <div key={index} className="flex items-center mr-4 mb-2">
                          <input
                            type="text"
                            value={goal}
                            onChange={(e) => {
                              const newGoals = [...formData.onboardingData.financialGoals];
                              newGoals[index] = e.target.value;
                              setFormData({
                                ...formData,
                                onboardingData: { ...formData.onboardingData, financialGoals: newGoals },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => {
                              const newGoals = formData.onboardingData.financialGoals.filter((_, i) => i !== index);
                              setFormData({
                                ...formData,
                                onboardingData: { ...formData.onboardingData, financialGoals: newGoals },
                              });
                            }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add a new financial goal"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (newItem.trim()) {
                            setFormData({
                              ...formData,
                              onboardingData: {
                                ...formData.onboardingData,
                                financialGoals: [...(formData.onboardingData?.financialGoals || []), newItem],
                              },
                            });
                            setNewItem('');
                          }
                        }}
                        className="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  userData.onboardingData.financialGoals && userData.onboardingData.financialGoals.length > 0 ? (
                    <div className="flex flex-wrap">
                      {userData.onboardingData.financialGoals.map((goal, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full mr-2 mb-2 flex items-center"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No financial goals set</p>
                  )
                )}
              </div>
            </div>
  
            {/* Financial Habits Section */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="text-xl font-bold">Financial Habits</h2>
                  {editingSection !== 'financialHabits' ? (
                    <button
                      onClick={() => {
                        setEditingSection('financialHabits');
                        setOriginalData({ ...formData });
                      }}
                      className="flex items-center text-blue-500 hover:text-blue-700 mt-2 sm:mt-0"
                    >
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={handleSaveFinance}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      >
                        <Save size={16} className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setFormData({ ...originalData });
                          setEditingSection(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center"
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
  
                {editingSection === 'financialHabits' ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap mb-4">
                      {formData.onboardingData?.financialHabits?.map((habit, index) => (
                        <div key={index} className="flex items-center mr-4 mb-2">
                          <input
                            type="text"
                            value={habit}
                            onChange={(e) => {
                              const newHabits = [...formData.onboardingData.financialHabits];
                              newHabits[index] = e.target.value;
                              setFormData({
                                ...formData,
                                onboardingData: { ...formData.onboardingData, financialHabits: newHabits },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => {
                              const newHabits = formData.onboardingData.financialHabits.filter((_, i) => i !== index);
                              setFormData({
                                ...formData,
                                onboardingData: { ...formData.onboardingData, financialHabits: newHabits },
                              });
                            }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add a new financial habit"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (newItem.trim()) {
                            setFormData({
                              ...formData,
                              onboardingData: {
                                ...formData.onboardingData,
                                financialHabits: [...(formData.onboardingData?.financialHabits || []), newItem],
                              },
                            });
                            setNewItem('');
                          }
                        }}
                        className="bg-blue-500 text-white px-3 py-2 rounded-r-md hover:bg-blue-600"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  userData.onboardingData.financialHabits && userData.onboardingData.financialHabits.length > 0 ? (
                    <div className="flex flex-wrap">
                      {userData.onboardingData.financialHabits.map((habit, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full mr-2 mb-2 flex items-center"
                        >
                          {habit}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No financial habits set</p>
                  )
                )}
              </div>
            </div>
  
            
          </div>
        )}
      </div>
    );
  }
  else if (activeTab === 'category') {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Custom Categories</h2>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <ArrowUpCircle className="mr-2 text-green-500" size={20} />
                Income Categories
              </h3>
              <button
                onClick={() => {
                  setEditingSection('addIncomeCategory');
                  setEditingCategory(null);
                }}
                className="flex items-center text-blue-500 hover:text-blue-600"
              >
                <PlusCircle size={16} className="mr-1" /> Add Category
              </button>
            </div>
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'income')}>
              <Droppable droppableId="incomeCategories">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {userData.onboardingData.customIncomeCategories.map((category, index) =>
                      renderCategoryItem(category, index, 'income')
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <ArrowDownCircle className="mr-2 text-red-500" size={20} />
                Expense Categories
              </h3>
              <button
                onClick={() => {
                  setEditingSection('addExpenseCategory');
                  setEditingCategory(null);
                }}
                className="flex items-center text-blue-500 hover:text-blue-600"
              >
                <PlusCircle size={16} className="mr-1" /> Add Category
              </button>
            </div>
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'expense')}>
              <Droppable droppableId="expenseCategories">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {userData.onboardingData.customExpenseCategories.map((category, index) =>
                      renderCategoryItem(category, index, 'expense')
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {(editingSection === 'addIncomeCategory' || editingSection === 'addExpenseCategory' || editingSection === 'editCategory') && (
            <CategoryForm
              editingSection={editingSection}
              setEditingSection={setEditingSection}
              categoryType={editingSection === 'addIncomeCategory' || editingCategory?.type === 'income' ? 'income' : 'expense'}
              editingCategory={editingCategory}
              setUserData={setUserData}
              setError={setError}
            />
          )}
        </div>
      </div>
    );
  }
  else if (activeTab === 'security') {
    return (
      <div className="w-full">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Security Settings</h2>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              {/* <div>
                <h3 className="text-md font-semibold mb-3">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="text-gray-500 mr-3" size={18} />
                    <div>
                      <p className="text-gray-800">Enable two-factor authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isTwoFactorEnabled}
                      onChange={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
                    />
                    <div className={`w-11 h-6 ${isTwoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                </div>
              </div> */}
              
              {/* Login History */}
              <div>
                <h3 className="text-md font-semibold mb-3">Login History</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Authorization
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userData?.loginHistory?.slice(-3).reverse().map((login, index) => (
                        <tr key={index} className={`${
                          login.isSuccessful ? "bg-green-100" : "bg-red-100"
                        }`} >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDistanceToNow(new Date(login.loginAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {login.loginMethod || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {login.ipAddress || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {login.location 
                              ? `${login.location.city || ''}, ${login.location.region || ''}, ${login.location.country || ''}`.trim()
                              : 'Unknown Location'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Login History */}
              <div>
                <h3 className="text-md font-semibold mb-3">Devices</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device / Browser
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operating System
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Used
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userData?.deviceTokens?.slice(-3).reverse().map((device, index) => {
                        // Find the corresponding login history entry
                        const login = userData?.loginHistory
                          ?.slice(-3)
                          .reverse()
                          .find((entry) => entry.device === device.device);

                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.device === "Unknown Device" ? "Unknown" : device.device} 
                              {login ? (login.browser === "Unknown Browser" ? " / Unknown" : " / " + login.browser) : " / Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {login?.operatingSystem || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {device ? formatDate(device.lastUsed) : 'Unknown'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              </div>

              {/* Password Security */}
              <div>
                <h3 className="text-md font-semibold mb-3">Password Security</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="text-gray-500 mr-3" size={18} />
                    <div>
                      <p className="text-gray-800">Change Password</p>
                      <p className="text-sm text-gray-500">
                        Last changed: {formatDistanceToNow(new Date(userData?.lastPasswordChange || Date.now()), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowChangePasswordModal(true)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Change
                  </button>
                </div>
                {showChangePasswordModal && (
                  <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
                    <div className="w-full max-w-md">
                      <ChangePasswordForm 
                        onClose={() => setShowChangePasswordModal(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notifications */}
              {/* <div>
                <h3 className="text-md font-semibold mb-3">Notifications</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="text-gray-500 mr-3" size={18} />
                    <div>
                      <p className="text-gray-800">Security Alerts</p>
                      <p className="text-sm text-gray-500">Get notified of any suspicious activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isSecurityAlertsEnabled}
                      onChange={() => setIsSecurityAlertsEnabled(!isSecurityAlertsEnabled)}
                    />
                    <div className={`w-11 h-6 ${isSecurityAlertsEnabled ? 'bg-blue-600' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                </div>
              </div> */}
            </div>
          </div>
        </div>
        
      </div>
    );
  }
  else if (activeTab === 'preferences') {
    return (
      <div className="w-full">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Display Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-3">Theme</h3>
                <div className="flex items-center space-x-4">
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white border border-gray-300 rounded-md mb-2"></div>
                    <span className="text-sm">Light</span>
                  </button>
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-800 border border-gray-300 rounded-md mb-2"></div>
                    <span className="text-sm">Dark</span>
                  </button>
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded-md mb-2"></div>
                    <span className="text-sm">Auto</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-3">Dashboard Layout</h3>
                <div className="flex items-center space-x-4">
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 border border-gray-300 rounded-md mb-2 flex flex-col p-1">
                      <div className="bg-gray-300 h-2 w-full mb-1"></div>
                      <div className="flex-1 flex space-x-1">
                        <div className="bg-gray-300 w-1/2"></div>
                        <div className="bg-gray-300 w-1/2"></div>
                      </div>
                    </div>
                    <span className="text-sm">Grid</span>
                  </button>
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 border border-gray-300 rounded-md mb-2 flex flex-col p-1">
                      <div className="bg-gray-300 h-2 w-full mb-1"></div>
                      <div className="flex-1 flex flex-col space-y-1">
                        <div className="bg-gray-300 h-1/3"></div>
                        <div className="bg-gray-300 h-1/3"></div>
                        <div className="bg-gray-300 h-1/3"></div>
                      </div>
                    </div>
                    <span className="text-sm">List</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-3">Currency Display</h3>
                <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive important updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800">Budget Alerts</p>
                  <p className="text-sm text-gray-500">Get notified when approaching budget limits</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800">Weekly Reports</p>
                  <p className="text-sm text-gray-500">Receive weekly financial summaries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  else if (activeTab === 'subscription') {
    return (
      <div className="w-full">
        {/* Current Subscription Status Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {!userData.isPremium ? (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">No Active Subscription</h2>
                <span className="px-4 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Free Plan</span>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Current Subscription</h2>
                <span className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Premium</span>
              </div>
            )}
            
            {userData.isPremium && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Premium Plan</p>
                    <p className="text-sm text-gray-500 capitalize">{userData.subscriptionType || 'Monthly'}</p>
                  </div>
                  <p className="font-semibold">{userData.subscriptionType === 'annually' ? '$101.88/year' : '$9.99/month'}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Plan Type</p>
                  <p className="text-sm capitalize">{userData.subscriptionType}</p>
                </div>

                <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {userData.subscriptionType === "trial" ? "Trial End Date" : "Subscription End Date"}
                </p>
                <p className="text-sm">
                  {userData.subscriptionType === "trial"
                    ? new Date(userData.trialEndDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : new Date(userData.subscriptionEndDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                </p>
                </div>
                
                <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {userData.subscriptionType === "trial"
                      ? "Trial Days Remaining"
                      : "Subscription Days Remaining"}
                  </p>
                  <p className="text-sm">
                    {Math.max(
                      Math.ceil(
                        (new Date(
                          userData.subscriptionType === "trial"
                            ? userData.trialEndDate
                            : userData.subscriptionEndDate
                        ) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      ),
                      0
                    )}{" "}
                    days
                  </p>
                </div>
                
              </div>
            )}
            
            {userData.isPremium ? (
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <button 
                  onClick={() => handleUpdatePayment()} 
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition"
                >
                  Update Payment
                </button>
                <button 
                  onClick={() => setShowCancelConfirm(true)} 
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition"
                >
                  Cancel Subscription
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <button 
                  onClick={() => navigate('/upgrade')} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Upgrade to Premium
                </button>
                <button 
                  onClick={() => navigate('/upgrade')} 
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition"
                >
                  Start 7-Day Free Trial
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Subscription Benefits Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Premium Benefits</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-medium">Unlimited Transactions</p>
                  <p className="text-sm text-gray-500">Track all your financial activities without limits</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-medium">AI-Powered Insights</p>
                  <p className="text-sm text-gray-500">Get personalized financial recommendations</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-medium">Advanced Analytics</p>
                  <p className="text-sm text-gray-500">Detailed insights into your spending habits</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-medium">Premium Support</p>
                  <p className="text-sm text-gray-500">Priority customer service available 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Billing History Card */}
        {userData && userData.isPremium && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Billing History</h2>
            
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {userData.billingHistory && userData.billingHistory.length > 0 ? (
                    userData.billingHistory.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                              item.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                            <button onClick={() => downloadInvoice(item.id)} className="flex items-center">
                              <Download size={14} className="mr-1" /> Download
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="4">
                          No billing history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Cancellation Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative border-2 border-red-200 shadow-xl m-4">
              <div className="flex items-center mb-4 text-red-600">
                <AlertCircle className="mr-2" size={24} />
                <h2 className="text-xl font-bold">Cancel Subscription?</h2>
              </div>
              
              <div className="mb-6 space-y-4">
                <p className="text-gray-700">Are you sure you want to cancel your Premium subscription?</p>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Subscription type:</span> <span className="capitalize">{userData.subscriptionType}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Subscription ends on:</span> {userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available'}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Days remaining:</span> {userData.daysRemaining || 0} days
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    If eligible, refunds will be processed within 7 business days.
                  </p>
                </div>
                
                <p className="text-sm text-gray-600">
                  Your access to premium features will continue until the end of your billing period.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-end">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition order-2 sm:order-1"
                  disabled={isLoading}
                >
                  Keep Subscription
                </button>
                <button 
                  onClick={confirmCancellation}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center order-1 sm:order-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  else if (activeTab === 'achievements') {
      return (
        <div className="w-full">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Your Achievements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-4">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Budget Master</h3>
                    <p className="text-sm text-gray-500">Stayed under budget for 3 consecutive months</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-4">
                    <Star size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Saving Star</h3>
                    <p className="text-sm text-gray-500">Reached 50% of your savings goal</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center mr-4">
                    <Scissors size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Debt Destroyer</h3>
                    <p className="text-sm text-gray-500">Pay off all your debts</p>
                    <span className="text-xs text-yellow-500 mt-1 inline-block">In progress</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center opacity-50">
                  <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-4">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Investment Guru</h3>
                    <p className="text-sm text-gray-500">Start your first investment</p>
                    <span className="text-xs text-gray-500 mt-1 inline-block">Locked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Your Stats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-2xl font-bold text-blue-500">85%</h3>
                  <p className="text-sm text-gray-500">Budget Adherence</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-2xl font-bold text-green-500">$2,500</h3>
                  <p className="text-sm text-gray-500">Total Savings</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-2xl font-bold text-purple-500">12</h3>
                  <p className="text-sm text-gray-500">Months Active</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
                <div className="border rounded-lg p-4 h-64 flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500">Chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};
  
    return (
        <>
                <Sidebar onToggle={setIsSidebarCollapsed} />
                <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-14 ' : 'ml-60 max-w-full'}`}>
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your account and settings</p>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row">
            <div className="md:w-72 flex-shrink-0 mb-6 md:mb-0">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden sticky top-8">
                <div className="p-6 text-center bg-gradient-to-b from-blue-50 to-white">
                  <div className="inline-block h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                    <User className="h-full w-full text-blue-400 p-4" />
                  </div>
                  <h2 className="mt-4 font-semibold text-gray-900">{userData?.name || 'User'}</h2>
                  <p className="text-sm text-gray-500">{userData?.email || ''}</p>
                  <p className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                    {userData?.isPremium ? 'Premium User' : 'Free User'}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 p-2">
                  <nav className="flex flex-col space-y-1">
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'profile' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <User className={`mr-3 ${activeTab === 'profile' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Profile
                    </button>
                    <button 
                      onClick={() => setActiveTab('finance')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'finance' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <DollarSign className={`mr-3 ${activeTab === 'finance' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Financial Info
                    </button>
                    <button 
                      onClick={() => setActiveTab('category')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'category' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <FolderOpen className={`mr-3 ${activeTab === 'category' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Category
                    </button>
                    <button 
                      onClick={() => setActiveTab('security')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'security' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Shield className={`mr-3 ${activeTab === 'security' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Security
                    </button>
                    <button 
                      onClick={() => setActiveTab('subscription')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'subscription' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <CreditCard className={`mr-3 ${activeTab === 'subscription' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Subscription
                    </button>
                    <button 
                      onClick={() => setActiveTab('preferences')}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === 'preferences' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Settings className={`mr-3 ${activeTab === 'preferences' ? 'text-white' : 'text-blue-400'}`} size={18} />
                      Settings
                    </button>
                  </nav>
                </div>
              </div>
            </div>
            
            <div className="md:ml-6 flex-1">
              {renderProfileContent()}
            </div>
          </div>
        </div>
        </div>
        </>
      );
  };
  
  export default ProfilePage;
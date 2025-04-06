import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, MoreHorizontal, PlusCircle, Edit, Trash2, Eye, ArrowRight, Search, Filter, Download, Bell } from 'lucide-react';

const PortfolioDashboard = () => {
  // Demo data - replace with API calls to your backend
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetToAdd, setAssetToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Gold prices have increased by 2.5% in the last 24 hours", time: "2 hours ago", read: false },
    { id: 2, message: "Dividend received: ₹1,200 from HDFCBANK", time: "Yesterday", read: false },
    { id: 3, message: "Your SIP investment of ₹5,000 in SBI Small Cap Fund is scheduled for tomorrow", time: "1 day ago", read: true }
  ]);

  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setPortfolioData({
        totalInvestedValue: 1256000,
        totalCurrentValue: 1432500,
        overallGrowth: 14.05,
        categoryBreakdown: {
          stocks: {
            investedValue: 540000,
            currentValue: 612000,
            growth: 13.33,
            count: 12
          },
          gold: {
            investedValue: 156000,
            currentValue: 172500,
            growth: 10.58,
            count: 3,
            currentPrice: 5270
          },
          realEstate: {
            investedValue: 450000,
            currentValue: 520000,
            growth: 15.56,
            count: 1
          },
          mutualFunds: {
            investedValue: 110000,
            currentValue: 128000,
            growth: 16.36,
            count: 5
          }
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

  const getPieChartData = () => {
    if (!portfolioData) return [];
    
    return [
      { name: 'Stocks', value: portfolioData.categoryBreakdown.stocks.currentValue },
      { name: 'Gold', value: portfolioData.categoryBreakdown.gold.currentValue },
      { name: 'Real Estate', value: portfolioData.categoryBreakdown.realEstate.currentValue },
      { name: 'Mutual Funds', value: portfolioData.categoryBreakdown.mutualFunds.currentValue },
    ];
  };

  const getGrowthData = () => {
    if (!portfolioData) return [];
    
    return [
      { name: 'Stocks', growth: portfolioData.categoryBreakdown.stocks.growth },
      { name: 'Gold', growth: portfolioData.categoryBreakdown.gold.growth },
      { name: 'Real Estate', growth: portfolioData.categoryBreakdown.realEstate.growth },
      { name: 'Mutual Funds', growth: portfolioData.categoryBreakdown.mutualFunds.growth },
    ];
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-gray-700">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500">
            {((payload[0].value / portfolioData.totalCurrentValue) * 100).toFixed(1)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Dummy asset lists for each category
  const stocksData = [
    { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 50, buyPrice: 2400, currentPrice: 2650, growth: 10.42 },
    { id: 2, symbol: 'HDFCBANK', name: 'HDFC Bank', quantity: 100, buyPrice: 1600, currentPrice: 1750, growth: 9.38 },
    { id: 3, symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 25, buyPrice: 3300, currentPrice: 3450, growth: 4.55 },
    { id: 4, symbol: 'INFY', name: 'Infosys', quantity: 75, buyPrice: 1450, currentPrice: 1620, growth: 11.72 },
    { id: 5, symbol: 'SBIN', name: 'State Bank of India', quantity: 200, buyPrice: 450, currentPrice: 490, growth: 8.89 }
  ];

  const goldData = [
    { id: 1, type: 'coin', purity: '24K', quantity: 10, buyPrice: 5000, currentPrice: 5270, growth: 5.4 },
    { id: 2, type: 'bar', purity: '24K', quantity: 20, buyPrice: 4950, currentPrice: 5270, growth: 6.46 },
  ];

  const mutualFundsData = [
    { id: 1, schemeName: 'Axis Bluechip Fund', units: 500, investmentAmount: 25000, currentValue: 28500, growth: 14 },
    { id: 2, schemeName: 'SBI Small Cap Fund', units: 200, investmentAmount: 20000, currentValue: 24000, growth: 20 },
    { id: 3, schemeName: 'HDFC Mid-Cap Opportunities', units: 750, investmentAmount: 30000, currentValue: 33750, growth: 12.5 },
  ];

  const realEstateData = [
    { id: 1, propertyName: 'Apartment in Pune', propertyType: 'residential', area: 1200, purchasePrice: 4500000, currentValuation: 5200000, growth: 15.56 },
  ];

  const getAssetList = () => {
    let assetList;
    switch(activeTab) {
      case 'stocks': assetList = stocksData; break;
      case 'gold': assetList = goldData; break;
      case 'mutualFunds': assetList = mutualFundsData; break;
      case 'realEstate': assetList = realEstateData; break;
      default: assetList = [];
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return assetList.filter(asset => {
        if (activeTab === 'stocks') {
          return asset.symbol.toLowerCase().includes(term) || 
                 asset.name.toLowerCase().includes(term);
        } else if (activeTab === 'gold') {
          return asset.type.toLowerCase().includes(term) || 
                 asset.purity.toLowerCase().includes(term);
        } else if (activeTab === 'mutualFunds') {
          return asset.schemeName.toLowerCase().includes(term);
        } else if (activeTab === 'realEstate') {
          return asset.propertyName.toLowerCase().includes(term) || 
                 asset.propertyType.toLowerCase().includes(term);
        }
        return false;
      });
    }
    
    return assetList;
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const Header = () => (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">FinTrack</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button 
                  className="p-1 border-2 border-transparent text-gray-500 rounded-full hover:text-blue-600 focus:outline-none focus:text-blue-600 focus:bg-gray-100" 
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1 border-b border-gray-200">
                      <div className="flex justify-between items-center px-4 py-2">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4">No notifications</p>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`px-4 py-3 hover:bg-gray-50 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button className="ml-4 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Navigation = () => (
    <div className="border-b border-gray-200 py-4 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          <button
            className={`px-1 py-2 font-medium text-sm border-b-2 ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-1 py-2 font-medium text-sm border-b-2 ${activeTab === 'stocks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('stocks')}
          >
            Stocks
          </button>
          <button
            className={`px-1 py-2 font-medium text-sm border-b-2 ${activeTab === 'mutualFunds' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('mutualFunds')}
          >
            Mutual Funds
          </button>
          <button
            className={`px-1 py-2 font-medium text-sm border-b-2 ${activeTab === 'gold' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('gold')}
          >
            Gold
          </button>
          <button
            className={`px-1 py-2 font-medium text-sm border-b-2 ${activeTab === 'realEstate' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('realEstate')}
          >
            Real Estate
          </button>
        </nav>
      </div>
    </div>
  );

  const renderSummaryTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Allocation</h2>
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getPieChartData()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {getPieChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {getPieChartData().map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Growth by Category</h2>
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getGrowthData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Growth']} />
              <Bar dataKey="growth" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Investment</h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(portfolioData.totalInvestedValue)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-500">Current Value</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(portfolioData.totalCurrentValue)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-500">Overall Growth</h3>
            {portfolioData.overallGrowth > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className={`text-2xl font-bold mt-2 ${portfolioData.overallGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioData.overallGrowth > 0 ? '+' : ''}{portfolioData.overallGrowth.toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
            <PlusCircle className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {portfolioData.categoryBreakdown.stocks.count + 
             portfolioData.categoryBreakdown.gold.count + 
             portfolioData.categoryBreakdown.realEstate.count + 
             portfolioData.categoryBreakdown.mutualFunds.count}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Stocks</h3>
            <button
              onClick={() => setActiveTab('stocks')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              View <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(portfolioData.categoryBreakdown.stocks.currentValue)}
              </p>
            </div>
            <div className={`flex items-center ${portfolioData.categoryBreakdown.stocks.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.categoryBreakdown.stocks.growth > 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              <span className="font-medium">
                {portfolioData.categoryBreakdown.stocks.growth > 0 ? '+' : ''}
                {portfolioData.categoryBreakdown.stocks.growth.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Gold</h3>
            <button
              onClick={() => setActiveTab('gold')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              View <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(portfolioData.categoryBreakdown.gold.currentValue)}
              </p>
            </div>
            <div className={`flex items-center ${portfolioData.categoryBreakdown.gold.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.categoryBreakdown.gold.growth > 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              <span className="font-medium">
                {portfolioData.categoryBreakdown.gold.growth > 0 ? '+' : ''}
                {portfolioData.categoryBreakdown.gold.growth.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Real Estate</h3>
            <button
              onClick={() => setActiveTab('realEstate')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              View <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(portfolioData.categoryBreakdown.realEstate.currentValue)}
              </p>
            </div>
            <div className={`flex items-center ${portfolioData.categoryBreakdown.realEstate.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.categoryBreakdown.realEstate.growth > 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              <span className="font-medium">
                {portfolioData.categoryBreakdown.realEstate.growth > 0 ? '+' : ''}
                {portfolioData.categoryBreakdown.realEstate.growth.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Mutual Funds</h3>
            <button
              onClick={() => setActiveTab('mutualFunds')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              View <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(portfolioData.categoryBreakdown.mutualFunds.currentValue)}
              </p>
            </div>
            <div className={`flex items-center ${portfolioData.categoryBreakdown.mutualFunds.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.categoryBreakdown.mutualFunds.growth > 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              <span className="font-medium">
                {portfolioData.categoryBreakdown.mutualFunds.growth > 0 ? '+' : ''}
                {portfolioData.categoryBreakdown.mutualFunds.growth.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssetList = () => {
    const assets = getAssetList();
    
    return (
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
            {activeTab === 'stocks' && 'Your Stocks'}
            {activeTab === 'gold' && 'Your Gold Investments'}
            {activeTab === 'mutualFunds' && 'Your Mutual Funds'}
            {activeTab === 'realEstate' && 'Your Real Estate'}
          </h2>
          
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button className="bg-white p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
            </button>
            
            <button className="bg-white p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" />
            </button>
            
            <button 
              className="bg-blue-600 p-2 rounded-md text-white hover:bg-blue-700 flex items-center"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>Add</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'stocks' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Buy Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  
                  {activeTab === 'gold' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (g)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Buy Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  
                  {activeTab === 'mutualFunds' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  
                  {activeTab === 'realEstate' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area (sq.ft)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      {activeTab === 'stocks' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.buyPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.currentPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {asset.growth > 0 ? '+' : ''}{asset.growth.toFixed(2)}%
                            </span>
                          </td>
                        </>
                      )}
                      
                      {activeTab === 'gold' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.purity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.buyPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.currentPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {asset.growth > 0 ? '+' : ''}{asset.growth.toFixed(2)}%
                            </span>
                          </td>
                        </>
                      )}
                      
                      {activeTab === 'mutualFunds' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.schemeName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.units}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.investmentAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.currentValue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {asset.growth > 0 ? '+' : ''}{asset.growth.toFixed(2)}%
                            </span>
                          </td>
                        </>
                      )}
                      
                      {activeTab === 'realEstate' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.propertyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.propertyType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.area}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.purchasePrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(asset.currentValuation)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {asset.growth > 0 ? '+' : ''}{asset.growth.toFixed(2)}%
                            </span>
                          </td>
                        </>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {assets.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{assets.length}</span> of <span className="font-medium">{assets.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button className="px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal for adding new assets
  const AddAssetModal = () => {
    if (!showAddModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Add New {activeTab === 'stocks' ? 'Stock' : activeTab === 'gold' ? 'Gold' : activeTab === 'realEstate' ? 'Property' : 'Mutual Fund'}
                  </h3>
                  
                  {/* Form fields would depend on asset type */}
                  {activeTab === 'stocks' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stock Symbol</label>
                        <input type="text" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input type="number" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                        <input type="number" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                        <input type="date" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      </div>
                    </div>
                  )}
                  
                  {/* Similar form fields for other asset types would go here */}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Add Asset
              </button>
              <button 
                type="button" 
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'summary' ? renderSummaryTab() : renderAssetList()}
      </main>
      
      <AddAssetModal />
    </div>
  );
};

export default PortfolioDashboard;
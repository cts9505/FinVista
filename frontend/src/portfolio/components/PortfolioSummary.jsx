import React, { useState, useEffect } from 'react';
import { portfolioApi } from '../services/api';

const PortfolioSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await portfolioApi.getSummary();
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching portfolio summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Portfolio Summary</h2>
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>Total Invested: ₹{summary.totalInvestedValue.toLocaleString()}</p>
            <p>Current Value: ₹{summary.totalCurrentValue.toLocaleString()}</p>
            <p className={summary.overallGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              Overall Growth: {summary.overallGrowth.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Category Breakdown:</h3>
            {Object.entries(summary.categoryBreakdown).map(([key, value]) => (
              <p key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}: ₹{value.currentValue.toLocaleString()} 
                ({value.growth.toFixed(2)}%)
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;
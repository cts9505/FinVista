import React, { useState } from 'react';

const AssetForm = ({ assetType, initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fields = {
    stocks: ['symbol', 'name', 'buyDate', 'buyPrice', 'quantity', 'sector', 'notes'],
    gold: ['type', 'purity', 'buyDate', 'buyPrice', 'quantity', 'description'],
    mutualFunds: ['schemeName', 'schemeCode', 'purchaseDate', 'investmentAmount', 'notes'],
    realEstate: ['propertyName', 'propertyType', 'location', 'area', 'purchaseDate', 'purchasePrice', 'currentValuation', 'notes'],
    fixedDeposits: ['bankName', 'depositAmount', 'interestRate', 'startDate', 'maturityDate', 'interestType', 'compoundFrequency', 'notes'],
    ppf: ['accountNumber', 'bankName', 'openDate', 'currentInterestRate', 'totalInvestment', 'notes'],
    crypto: ['coinId', 'name', 'symbol', 'buyDate', 'buyPrice', 'quantity', 'platform', 'walletAddress', 'notes'],
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{initialData._id ? 'Edit' : 'Add'} {assetType}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields[assetType.toLowerCase()].map((field) => (
          <div key={field}>
            <label className="block mb-1 capitalize">{field}</label>
            <input
              type={field.includes('Date') ? 'date' : 'text'}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </form>
  );
};

export default AssetForm;
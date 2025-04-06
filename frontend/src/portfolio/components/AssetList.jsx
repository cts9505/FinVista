import React from 'react';

const AssetList = ({ assets, assetType, onEdit, onDelete, onSell }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">{assetType} List</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Value</th>
              <th className="p-3 text-left">Growth</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset._id} className="border-b">
                <td className="p-3">{asset.name || asset.propertyName || asset.schemeName || asset.bankName}</td>
                <td className="p-3">₹{(asset.currentValue || asset.currentValuation || asset.depositAmount)?.toLocaleString()}</td>
                <td className={`p-3 ${asset.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(asset.profitPercentage || asset.growth)?.toFixed(2)}%
                </td>
                <td className="p-3">
                  <button onClick={() => onEdit(asset)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => onDelete(asset._id)} className="text-red-600 mr-2">Delete</button>
                  <button onClick={() => onSell(asset)} className="text-yellow-600">Sell</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetList;
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';
import axios from 'axios'
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ChangePasswordForm = ({ onClose }) => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } 

    if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentPassword = formData.currentPassword;
      const newPassword = formData.newPassword;
      
      const response = await axios.put(`${BASE_URL}/api/auth/change-password`,{currentPassword,newPassword});
      
      if (response.data.success) {
        toast.success(response.data.message);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        onClose(); // Close the form after successful password change
      } else {
        toast.error(response.data.message);
        return null;
      }
    } catch (error) {
      // Network or unexpected error
      toast.error('An error occurred while changing password');
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Lock className="mr-2 text-gray-500" size={20} />
          Change Password
        </h2>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.currentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 border rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  ${errors.currentPassword 
                    ? 'border-red-500 text-red-900' 
                    : 'border-gray-300'}
                `}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('currentPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {passwordVisibility.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.newPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 border rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  ${errors.newPassword 
                    ? 'border-red-500 text-red-900' 
                    : 'border-gray-300'}
                `}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('newPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {passwordVisibility.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.confirmNewPassword ? 'text' : 'password'}
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 border rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  ${errors.confirmNewPassword 
                    ? 'border-red-500 text-red-900' 
                    : 'border-gray-300'}
                `}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmNewPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {passwordVisibility.confirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-2 rounded-md transition-colors
                ${isSubmitting 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
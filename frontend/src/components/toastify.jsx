import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

// Custom toast styles
const toastStyle = {
  success: {
    icon: <CheckCircle className="text-green-500 mr-2" />,
    className: 'bg-green-50 border-l-4 border-green-500 text-gray-800',
  },
  error: {
    icon: <XCircle className="text-red-500 mr-2" />,
    className: 'bg-red-50 border-l-4 border-red-500 text-gray-800',
  },
  info: {
    icon: <Info className="text-blue-500 mr-2" />,
    className: 'bg-blue-50 border-l-4 border-blue-500 text-gray-800',
  },
  warning: {
    icon: <AlertTriangle className="text-orange-500 mr-2" />,
    className: 'bg-orange-50 border-l-4 border-orange-500 text-gray-800',
  }
};

// Enhanced toast methods
const enhancedToast = {
  success: (message, options = {}) => {
    toast.success(
      <div className="flex items-center">
        {toastStyle.success.icon}
        {message}
      </div>,
      {
        className: toastStyle.success.className,
        ...options
      }
    );
  },
  error: (message, options = {}) => {
    toast.error(
      <div className="flex items-center">
        {toastStyle.error.icon}
        {message}
      </div>,
      {
        className: toastStyle.error.className,
        ...options
      }
    );
  },
  info: (message, options = {}) => {
    toast.info(
      <div className="flex items-center">
        {toastStyle.info.icon}
        {message}
      </div>,
      {
        className: toastStyle.info.className,
        ...options
      }
    );
  },
  warning: (message, options = {}) => {
    toast.warning(
      <div className="flex items-center">
        {toastStyle.warning.icon}
        {message}
      </div>,
      {
        className: toastStyle.warning.className,
        ...options
      }
    );
  }
};

// Custom Toast Container
export const BeautifulToastContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
    toastClassName="relative flex p-1 rounded-md justify-between overflow-hidden cursor-pointer"
    bodyClassName="flex items-center"
    style={{ 
      zIndex: 9999, 
      maxWidth: '400px', 
      width: '100%' 
    }}
  />
);

// Export enhanced toast
export { enhancedToast as toast };
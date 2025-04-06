import React, { useContext, useState } from 'react'
import Navbar from '../components/Navbar'
import { assets } from '../assets/assets'
import axios from 'axios'
import { AppContent } from '../context/AppContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const ResetPassword = () => {

  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [email,setEmail]=useState('');
  const [newPassword,setPassword]=useState('');

  const[isEmailSent,setIsEmailSent]=useState(false);
  const[isOtpSubmited,setIsOtpSubmited]=useState(false);

  const{backendUrl} = useContext(AppContent)
  axios.defaults.withCredentials=true;

  const handleChange = (e) => {
    let value = e.target.value;
    if (value.length > 6) return; 
    setOtp(value);
  };
  
  const onSubmitEmail = async(e)=>{
    e.preventDefault();
    try{
      const {data} = await axios.post(backendUrl+'/api/auth/send-reset-otp',{email})
      data.success ? toast.success(data.message) : toast.error(data.message);
      data.success && setIsEmailSent(true);
    }
    catch(error){
      toast.error(error.message);
    }
  }

  const onSubmitOtp = async(e)=>{
    e.preventDefault();
    try{
      setOtp(otp);
      setIsOtpSubmited(true);
    }
    catch(error){
      toast.error(error.message);
    }
  }

  const onSubmitNewPassword =async(e) =>{
    e.preventDefault();
    try{
      const {data} = await axios.post(backendUrl+'/api/auth/reset-password',{email,otp,newPassword})
      data.success ? toast.success(data.message) : toast.error(data.message);
      data.success && navigate('/login');
    }catch(error){
      toast.error(error.message);
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-gray-50 to bg-gray-100'>
      <Navbar/>
      {/* {email} */}
      {!isEmailSent &&
      <form onSubmit={onSubmitEmail} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
        <h1 className='text-center mb-4 font-semibold text-3xl text-white '>
          Reset Password
        </h1>
        <p className='text-center mb-6 text-indigo-300'>
          Enter your registered email address.
        </p>
        <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
          <img src={assets.mail_icon} alt="email icon" />
          <input
            className="bg-transparent outline-none text-white w-full"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Enter your Email"
            required
          />
        </div>
        <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Send OTP</button>
      </form>
      }
      {/* Otp */}
      {!isOtpSubmited && isEmailSent &&
      <form onSubmit={onSubmitOtp} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
        <h1 className='text-center mb-4 font-semibold text-3xl text-white w-full '>
          Reset Password OTP
        </h1>
        <p className='text-center mb-6 text-indigo-300'>
          Enter the 6-digit code sent to your email.
        </p>
        <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
        <img className='h-5 w-6' src={assets.otp_icon} alt="otp icon" />
          <input
          type="text"
          value={otp}
          onChange={handleChange}
          placeholder="Enter 6-digit OTP"
          className="bg-transparent outline-none text-white"
          maxLength={6}
          minLength={6}
          inputMode="numeric"
          style={{
            letterSpacing: otp ? "1.2em" : "normal", // Spacing only when user types
          }}
          required
        />
        </div>
        <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Verify Otp</button>
       </form>
        }
       {/* password */}
       {isEmailSent && isOtpSubmited &&
       <form onSubmit={onSubmitNewPassword} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
        <h1 className='text-center mb-4 font-semibold text-3xl text-white '>
          New Password
        </h1>
        <p className='text-center mb-6 text-indigo-300'>
          Enter your New Password
        </p>
        <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
          <img src={assets.lock_icon} alt="password icon" />
          <input
            className="bg-transparent outline-none text-white w-full"
            onChange={(e) => setPassword(e.target.value)}
            value={newPassword}
            type="password"
            placeholder="Enter your New Password"
            required
          />
        </div>
        <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>
          Confirm Change Password
        </button>
      </form>
      }
    </div>
  )
}

export default ResetPassword

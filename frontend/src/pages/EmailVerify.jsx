import React, { useContext, useEffect, useState } from 'react'
import { CheckCircle2, Mail, ShieldCheck, Key } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import Navbar from '../components/Navbar'

const EmailVerify = () => {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const { backendUrl, userData, getUserData } = useContext(AppContent)
  
  // Resend OTP state
  const [canResendOtp, setCanResendOtp] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer
    if (resendCountdown > 0 && !canResendOtp) {
      timer = setInterval(() => {
        setResendCountdown(prev => prev - 1)
      }, 1000)
    } else if (resendCountdown === 0) {
      setCanResendOtp(true)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCountdown, canResendOtp])

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d$/.test(value) && value !== '') return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto focus next input
    if (value !== '' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus()
    }
  }

  // Handle backspace to move to previous input
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus()
    }
  }

  // Submit OTP
  const onSubmitHandler = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      toast.error('Please enter a complete 6-digit OTP')
      return
    }

    try {
      const { data } = await axios.post(backendUrl + '/api/auth/verify-otp', { otp: otpCode })
      
      if (data.success) {
        await getUserData()
        toast.success('Email verified successfully!', {
          icon: <CheckCircle2 className="text-green-500" />
        })
        navigate('/')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    }
  }

  // Resend OTP
  const resendOtp = async () => {
    if (!canResendOtp) return

    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp')
      if (data.success) {
        toast.info('New OTP sent to your email', {
          icon: <Mail className="text-blue-500" />
        })
        // Reset OTP inputs and resend timer
        setOtp(['', '', '', '', '', ''])
        setCanResendOtp(false)
        setResendCountdown(60)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-15 w-15 text-blue-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-800">Verify Your Email</h2>
            <p className="mt-2 text-gray-500">
              Enter the 6-digit verification code sent to 
              <span className="font-semibold text-blue-600 ml-1">
                {userData?.email || 'your email'}
              </span>
            </p>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl border-2 border-gray-300 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-300 uppercase"
                  pattern="\d*"
                  inputMode="numeric"
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={resendOtp}
                disabled={!canResendOtp}
                className={`flex items-center gap-2 ${
                  canResendOtp 
                    ? 'text-blue-600 hover:underline' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Mail className="h-5 w-5" />
                {canResendOtp 
                  ? 'Resend OTP' 
                  : `Resend in ${resendCountdown}s`
                }
              </button>
              <p className="text-gray-500 text-sm">Didn't receive? Check spam folder</p>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-colors duration-300 
                flex items-center justify-center gap-2"
            >
              <Key className="h-5 w-5" />
              Verify Account
            </button>
          </form>

          <div className="text-center text-gray-500 text-sm">
            OTP is valid for 10 minutes
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerify
import './index.css'
import { Routes,Route,Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import EmailVerify from './pages/EmailVerify'
import Dashboard from './pages/Dashboard'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FooterContainer } from './components/Footer'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from 'react';
import RefreshHandler from './context/RefreshHandler';
import NotFound from './pages/NotFound';
import { GlobalContextProvider } from "./context/GlobalContext";
import BudgetsDashboard from './pages/Budget'
import Navbar from './components/Navbar'
import IncomePage from './pages/Income'
import ExpensePage from './pages/expense'
import {Toaster} from 'react-hot-toast'
import BillPage from './pages/BillPage'
import UpgradePage from './pages/Upgrade'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/Profile'
import ChatPage from './pages/Chat'
import PortfolioDashboard from './pages/Portfolio'
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
	const GoogleWrapper = ()=>(
		<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
			<Login></Login>
		</GoogleOAuthProvider>
	)
  
  return (
    <>
  <ToastContainer />
  {/* <Navbar/> */}
  {/* <RefreshHandler setIsAuthenticated={setIsAuthenticated} /> */}
  <GlobalContextProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets" element={<BudgetsDashboard/>}/>
        <Route path="/incomes" element={<IncomePage/>}/>
        <Route path="/expenses" element={<ExpensePage/>}/>
        <Route path="/bills" element={<BillPage/>}/>
        <Route path="/upgrade" element={<UpgradePage/>}/>
        <Route path="/onboarding" element={<OnboardingPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path='/chat' element={<ChatPage/>}/>
        <Route path='/portfolio' element={<PortfolioDashboard/>}/>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster  toastOptions={{className:'',style:{fontSize:'15px'}}} />
    </GoogleOAuthProvider>
  </GlobalContextProvider>
  {/* <FooterContainer /> */}
</>

  )
}

export default App

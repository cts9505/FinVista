import React, { useContext,useEffect, useRef } from 'react'
import { gsap } from "gsap";
import{assets} from '../assets/assets'
import { AppContent } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';
const Header = () => {

  const {userData}=useContext(AppContent);
  const textRef = useRef(null);
  const navigate=useNavigate();
  useEffect(() => {
    gsap.to(textRef.current, {
      x: 25, // Move 20px sideways
      duration: 0.8,
      repeat: -1, // Infinite loop
      yoyo: true, // Move back and forth
      ease: "power1.inOut",
    });
  }, []);

  return (
    <div className='flex flex-col items-center mt-20 px-4 text-center text-gray-700'>
      <img src={assets.header_img} className='w-36 h-36 rounnded-full mb-6'/>
      <h1 className='flex items-center gap-2 justify-center sm:text-3x1 font-medium mb-2 text-transform: capitalize' style={{fontSize:"2rem"}} ref={textRef} >Hey {userData ? userData.name :'Developers'}!<img className="w-8 aspect-square" src={assets.hand_wave}/> </h1>
      <h2 className='text-lg sm:text-xl font-light'>Welcome to the world of code</h2>
      <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4' onClick={()=>{navigate('/dashboard')}}>Dashboard</button>
    </div>
  )
}

export default Header

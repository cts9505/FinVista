import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets';

function NotFound() {
  const navigate = useNavigate();

  return (
    <>
        
        <button onClick={()=> navigate('/')}><img className='w-500 max-h-full' src={assets.notfound}/></button>
    </>
  )
}

export default NotFound
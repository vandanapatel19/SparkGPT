import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext.jsx'

const Loading = ({ redirectTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser, token } = useAppContext();

 useEffect(() => {
  const isStripeReturn = new URLSearchParams(location.search).has('session_id');

  const timeout = setTimeout(async () => {
    if (token && fetchUser) {
      await fetchUser();
    }

    if (isStripeReturn) {
      toast.success('Payment completed successfully!');
    }

    if (redirectTo) {
      navigate(redirectTo);
    }
  }, 500);

  return () => clearTimeout(timeout);
}, [fetchUser, navigate, token, location.search, redirectTo]);



  return (
    <div className='bg-linear-to-b from-[#531B81] to-[#29184B] backdrop-opacity-60 flex items-center justify-center h-screen w-screen text-white text-2xl'>
      <div className='h-10 w-10 border-3 rounded-full border-white border-t-transparent animate-spin '></div>
      
    </div>
  )
}

export default Loading

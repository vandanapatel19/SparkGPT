import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Loading = () => {
  const navigate = useNavigate()

  useEffect(()=>{
    const timeout = setTimeout(()=>{
      navigate('/')
    },5000)
    return () => clearTimeout(timeout)
  },[])

  return (
    <div className='bg-linear-to-b from-[#531B81] to-[#29184B] backdrop-opacity-60 flex items-center justify-center h-screen w-screen text-white text-2xl'>
      <div className='h-10 w-10 border-3 rounded-full border-white border-t-transparent animate-spin '></div>
      
    </div>
  )
}

export default Loading

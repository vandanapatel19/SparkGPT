import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Sidebar = () => {

  const { chats, setSelectedChats, theme, setTheme, user } = useAppContext()
  const [search, setSearch] = useState('')

  return (
    <div className='flex flex-col h-screen min-w-72 p-5 dark:bg-linear-to-b from-[#242124] to-[#000000]/30 border-r border-[#80609F]/30 backdrop:blur-3xl transition-all duration-500 max-md:absolute left-0 z-1 '>
      {/* logo */}
      <img src={theme === 'dark' ? assets.logo_full : assets.sparklight} alt="" className='w-full max-w-48' />

      {/* new chat button */}
      <button className='flex items-center justify-center mt-10 py-2 w-full text-white bg-linear-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer '>
        <span className='mr-2 text-xl'>+</span> New Chat
      </button>
      
      {/* search conversation */}
      <div className='flex items-center gap-2 mt-4 p-3 border border-gray-400 dark:border-white/20 rounded-md'>
        <img className='w-4 not-dark:invert' src={assets.search_icon} alt="search" />
        <input onChange={(e)=>setSearch(e.target.value)} value={search} type="text" placeholder='Search conversations' className='text-xs placeholder:text-gray-400 outline-none' />
      </div>
    </div>
  )
}

export default Sidebar

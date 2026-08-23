import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';

const ChatBox = () => {

  const {theme, selectedChat} = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState();

  const onSubmit = (e)=>{
    e.preventDefault();
  }

  useEffect(()=>{
      if(selectedChat){
        setMessages(selectedChat.messages)
      }  
  },[selectedChat])

  return (
    <div className='flex flex-1 flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>

      {/* Chat message */}
      <div className='flex-1 mb-5 overflow-y-scroll'>
        {messages.length === 0 && (
        <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
          <img src={theme === 'dark'? assets.sparkdark : assets.sparklight } alt="" className='w-full max-w-56 sm:max-w-68' />
          <p className=' mt-5 text-4xl sm:text-6xl dark:text-white text-gray-400 text-center '>Ask me anything.</p>
        </div>
        )}
        {messages.map((message, index)=> <Message key={index} message={message}/>)}
        {
          loading && <div className='loader flex flex-center gap-1.5'>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
          </div>
        }
      </div>

      {/* Prompt  */}

      <form onSubmit={onSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>
        <select onChange={(e)=>setMode(e.target.value)} value={mode} className='ml-2 mr-3 '>
          <option className='dark:bg-purple-900' value="text">Text</option>
          <option className='dark:bg-purple-900' value="image">Image</option>
        </select>
        <input onChange={(e)=> setPrompt(e.target.value)} value={prompt} type="text" placeholder='Enter your prompt here...' className='flex-1 w-full text-sm outline-none' /> 
        <button disabled={loading}>
          <img src={loading ? assets.stop_icon : assets.send_icon} alt="" className='cursor-pointer w-8' />
        </button>
      </form>


    </div>
  )
}

export default ChatBox

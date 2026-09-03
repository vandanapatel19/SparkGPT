import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

const ChatBox = () => {

  const { theme, selectedChat, user, setUser, token, axios } = useAppContext();
  const chatContainerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [isPublished, setIsPublished] = useState(false)

  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!user) return toast('Login to send message')
      if (!selectedChat?._id) return toast.error('Please create or select a chat first')
      setLoading(true);
      const promptCopy = prompt;
      const currentPrompt = prompt;
      setPrompt('')
      setMessages(prev => [...prev, { content: currentPrompt, role: 'user', timeStamp: Date.now(), isImage: false }]);

      const requestMode = mode.toLowerCase();
      const { data } = await axios.post(`/api/message/${requestMode}`, {
        chatId: selectedChat._id,
        prompt: currentPrompt,
        isPublished,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setMessages(prev => [...prev, data.reply])
        //deduct credits
        if (requestMode === 'image') {
          setUser(prev => ({ ...prev, credits: prev.credits - 2 }))
        }
        else {
          setUser(prev => ({ ...prev, credits: prev.credits - 1 }))
        }
      }
      else {
        toast.error(data.message)
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
    finally {
      setPrompt('')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages)
    }
  }, [selectedChat])

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, loading]);

  return (
    <div className='flex flex-1 flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>

      {/* Chat message */}
      <div ref={chatContainerRef} className='flex-1 mb-5 overflow-y-scroll'>
        {messages.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <img src={theme === 'dark' ? assets.sparkdark : assets.sparklight} alt="" className='w-full max-w-56 sm:max-w-68' />
            <p className=' mt-5 text-4xl sm:text-6xl dark:text-white text-gray-400 text-center '>Ask me anything.</p>
          </div>
        )}
        {messages.map((message, index) => <Message key={index} message={message} />)}
        {
          loading && <div className='loader flex flex-center gap-1.5'>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
            <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce dark:bg-white"></div>
          </div>
        }
      </div>

      {/* Prompt input box */}
      {
        mode === 'image' && (
          <label className='inline-flex items-center gap-2 mb-3 text-sm mx-auto'>
            <p className='text-xs'>Publish generated images to community</p>
            <input className='cursor-pointer' type="checkbox" onChange={(e) => setIsPublished(e.target.checked)} checked={isPublished} />
          </label>

        )
      }

      <form onSubmit={onSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full gap w-full max-w-2xl flex items-center gap-4 p-3 pl-4 mx-auto'>
        <select onChange={(e) => setMode(e.target.value)} value={mode} className=' text-sm pl-3 pr-2 outline-none'>
          <option className='dark:bg-purple-900' value="text">Text</option>
          <option className='dark:bg-purple-900' value="image">Image</option>
        </select>
        <input onChange={(e) => setPrompt(e.target.value)} value={prompt} className='flex-1 w-full text-sm outline-none ' type="text" placeholder='Type your prompt here' />
        <button>
          <img className='w-8 cursor-pointer' src={loading ? assets.stop_icon : assets.send_icon} alt="" />
        </button>
      </form>

    </div>
  )
}

export default ChatBox

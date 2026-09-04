import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";


export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [token, setTokenState] = useState(localStorage.getItem('token'));
  const [userLoading, setUserLoading] = useState(true);

  const setToken = (newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const fetchUser = async () => {
    try {
      console.log("TOKEN:", token);

      const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setUser(data.user)
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    finally {
      setUserLoading(false)
    }
  }

  const createNewChat = async () => {
    try {
      if (!user) return toast('Login to create chat');
      navigate('/');
      await axios.get('/api/chat/create', { headers: { Authorization: `Bearer ${token}` } })
      fetchUserChats();

    } catch (error) {
      toast.error(error.message)

    }
  }

  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get('/api/chat/get', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        setChats(data.chats);
        //if there is no chat then user can create new chat
        if (data.chats.length === 0) {
          await createNewChat();
          return;
        }
        else {
          setSelectedChat(data.chats[0]);
        }
      }
      else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setUser(null)
      setUserLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (user) {
      fetchUserChats()
    }
    else {
      setChats([])
      setSelectedChat(null)
    }
  }, [user])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme);

  }, [theme])


  const value = { navigate, user, setUser, chats, setChats, selectedChat, setSelectedChat, theme, setTheme, axios, token, setToken, fetchUser, fetchUserChats, createNewChat, userLoading }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext);
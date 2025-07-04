import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: number;
  content: string;
  timestamp: string;
  user: {
    id: number;
    username: string;
  };
}

interface Room {
  id: number;
  name: string;
  created_by: {
    username: string;
  };
}

// Helper to group messages by date
function groupMessagesByDate(messages: Message[]) {
  return messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.timestamp);
    // Only keep the date part (YYYY-MM-DD)
    const dateKey = date.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(message);
    return groups;
  }, {});
}

// Helper to get WhatsApp-style date label
function getDateLabel(dateString: string) {
  const today = new Date();
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  // Otherwise, return formatted date (e.g., 12 Mar 2024)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [messageAnimIds, setMessageAnimIds] = useState<number[]>([]);
  const [countAnim, setCountAnim] = useState(false);

  useEffect(() => {
    fetchRoom();
    fetchMessages();

    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/?token=${token}`);

    ws.onopen = () => {
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'online_users_count') {
        setOnlineUsersCount(data.count);
      } else {
        const shouldScroll = isUserAtBottom();
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            content: data.message,
            timestamp: new Date().toISOString(),
            user: {
              id: data.user_id,
              username: data.username,
            },
          },
        ]);
        if (shouldScroll) {
          setTimeout(() => scrollToBottom(), 0);
        }
      }
    };

    ws.onclose = (event) => {
    };

    ws.onerror = (error) => {
      console.error('WebSocket error for room:', roomId, error);
    };

    setWebsocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setMessageAnimIds((ids) => [...ids, messages[messages.length - 1].id]);
      setTimeout(() => {
        setMessageAnimIds((ids) => ids.slice(1));
      }, 400);
    }
  }, [messages]);

  useEffect(() => {
    if (onlineUsersCount !== null) {
      setCountAnim(true);
      setTimeout(() => setCountAnim(false), 400);
    }
  }, [onlineUsersCount]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rooms/${roomId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
      navigate('/');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/rooms/${roomId}/messages/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMessages(response.data);
      setTimeout(() => scrollToBottom(), 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && websocket) {
      websocket.send(
        JSON.stringify({
          message: newMessage,
          user_id: user?.id,
        })
      );
      setNewMessage('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isUserAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 10;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center relative">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img src="/logo1.png" alt="App Logo" className="h-12 w-auto" />
            </Link>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Rooms
            </button>
          </div>
          <h1 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <span className="flex items-center justify-center space-x-3">
              <span className="text-2xl font-bold text-gray-900 pb-[4%]">{room?.name}</span>
              {onlineUsersCount !== null && (
                <span className={`flex items-center ml-1 text-sm font-medium text-gray-500 ${countAnim ? 'text-green-600' : ''} bg-black bg-opacity-10 px-2 py-0.5 rounded`}>
                  <span className="inline-block w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                  {onlineUsersCount} online
                </span>
              )}
            </span>
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow sm:rounded-lg flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 p-4 overflow-y-auto" ref={messagesContainerRef}>
            {/* Group messages by date and render date headers */}
            {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
              <React.Fragment key={date}>
                <div className="flex justify-center my-4">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full shadow-sm">
                    {getDateLabel(date)}
                  </span>
                </div>
                {msgs.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${
                      message.user.id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-sm transition-all duration-300 ${
                        message.user.id === user?.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } ${messageAnimIds.includes(message.id) ? 'animate-fadeInUp' : ''}`}
                    >
                      {message.user.id !== user?.id && (
                        <p className="text-sm font-bold mb-1 text-indigo-600">
                          {message.user.username}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95 transition-transform duration-100"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
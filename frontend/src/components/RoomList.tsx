import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

interface Room {
  id: number;
  name: string;
  created_by: {
    username: string;
  };
}

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/rooms/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:8000/api/rooms/',
        { name: newRoomName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setNewRoomName('');
      setShowCreateRoomModal(false);
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const deleteRoom = async (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`http://localhost:8000/api/rooms/${roomId}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room. You might not have permission.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img src="/logo1.png" alt="App Logo" className="h-12 w-auto" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Chat Rooms</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.username}!</span>
            <button
              onClick={() => setShowUserProfileModal(true)}
              className="px-3 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="User Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6 w-full">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rooms..."
                className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Room
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg w-full">
            <ul className="divide-y divide-gray-200">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <li key={room.id} className="flex items-center justify-between transition-transform duration-200 hover:scale-[1.02] hover:bg-indigo-50 animate-fadeInUp">
                    <Link
                      to={`/room/${room.id}`}
                      className="block flex-grow px-4 py-4 sm:px-6 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {room.name}
                        </p>
                      </div>
                    </Link>
                    <div className="ml-2 flex-shrink-0 flex items-center space-x-2 pr-4 sm:pr-6">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Created by {room.created_by.username}
                      </p>
                      {user?.username === room.created_by.username && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteRoom(room.id);
                          }}
                          className="px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="p-4 text-gray-500">No rooms found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>

      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full transform transition-all duration-200 opacity-100 scale-100 animate-fadeInUp">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Create New Room</h2>
            <form onSubmit={createRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name"
                className="mb-4 flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserProfileModal && (
        <UserProfile onClose={() => setShowUserProfileModal(false)} onProfileUpdate={fetchRooms} />
      )}
    </div>
  );
};

export default RoomList; 
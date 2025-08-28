import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Download, Eye, Minimize2, Maximize2, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

interface Chat {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  messages: Message[];
  unreadCount: number;
}

export function MiniMessenger() {
  const { user, users } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Инициализация чатов
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Админ видит всех сотрудников
      const employeeChats = users
        .filter(u => u.id !== user.id)
        .map(employee => ({
          id: employee.id,
          participantId: employee.id,
          participantName: employee.name,
          participantRole: employee.role,
          messages: [],
          unreadCount: 0
        }));
      setChats(employeeChats);
    } else if (user) {
      // Сотрудники видят только админов
      const adminChats = users
        .filter(u => u.role === 'admin')
        .map(admin => ({
          id: admin.id,
          participantId: admin.id,
          participantName: admin.name,
          participantRole: admin.role,
          messages: [],
          unreadCount: 0
        }));
      setChats(adminChats);
    }
  }, [user, users]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [activeChat, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!activeChat || !user) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.name,
      content: newMessage.trim(),
      timestamp: new Date(),
      file: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile)
      } : undefined
    };

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));

    setNewMessage('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const activeChats = chats.filter(chat => chat.messages.length > 0);
  const availableChats = chats.filter(chat => chat.messages.length === 0);
  const currentChat = chats.find(chat => chat.id === activeChat);
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Messenger Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-200 ${
          isMinimized ? 'h-14' : 'h-96 w-80'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">
                {currentChat ? currentChat.participantName : 'Сообщения'}
              </h3>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat List or Messages */}
              <div className="flex h-80">
                {/* Sidebar */}
                <div className="w-24 border-r border-gray-200 bg-gray-50">
                  <div className="p-2 space-y-1">
                    {/* Active Chats */}
                    {activeChats.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className={`w-full p-2 rounded-lg text-left transition-colors ${
                          activeChat === chat.id 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xs font-medium truncate">
                          {chat.participantName.split(' ')[0]}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {chat.participantRole}
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                        )}
                      </button>
                    ))}
                    
                    {/* Available Chats */}
                    {availableChats.slice(0, 3).map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className="w-full p-2 rounded-lg text-left hover:bg-gray-100 transition-colors opacity-60"
                      >
                        <div className="text-xs font-medium truncate">
                          {chat.participantName.split(' ')[0]}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {chat.participantRole}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                  {activeChat ? (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {currentChat?.messages.map(message => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                message.senderId === user.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.content && (
                                <p className="text-sm">{message.content}</p>
                              )}
                              {message.file && (
                                <div className="mt-2 p-2 bg-black bg-opacity-10 rounded">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="h-3 w-3" />
                                    <span className="text-xs truncate">{message.file.name}</span>
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {formatFileSize(message.file.size)}
                                  </div>
                                  <div className="flex space-x-1 mt-2">
                                    {message.file.type.startsWith('image/') && (
                                      <button
                                        onClick={() => {
                                          const modal = document.createElement('div');
                                          modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                          modal.innerHTML = `
                                            <div class="relative max-w-4xl max-h-full">
                                              <img src="${message.file!.url}" alt="${message.file!.name}" class="max-w-full max-h-full object-contain rounded-lg">
                                              <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75">
                                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                              </button>
                                            </div>
                                          `;
                                          modal.onclick = (e) => {
                                            if (e.target === modal || e.target.closest('button')) {
                                              document.body.removeChild(modal);
                                            }
                                          };
                                          document.body.appendChild(modal);
                                        }}
                                        className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = message.file!.url;
                                        link.download = message.file!.name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                    >
                                      <Download className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="text-xs opacity-75 mt-1">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input Area */}
                      <div className="border-t border-gray-200 p-3">
                        {selectedFile && (
                          <div className="mb-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 truncate">
                                {selectedFile.name}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Сообщение..."
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() && !selectedFile}
                            className="text-blue-500 hover:text-blue-600 disabled:text-gray-300 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Выберите чат</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
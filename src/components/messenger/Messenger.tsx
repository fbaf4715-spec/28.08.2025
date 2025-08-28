import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Download, Eye, Users, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
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

export function Messenger() {
  const { user, users } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем чаты из localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('messenger_chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        const chatsWithDates = parsedChats.map((chat: any) => ({
          ...chat,
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(chatsWithDates);
      } catch (error) {
        console.error('Ошибка при загрузке чатов:', error);
        initializeChats();
      }
    } else {
      initializeChats();
    }
  }, [user, users]);

  // Инициализация чатов
  const initializeChats = () => {
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
      localStorage.setItem('messenger_chats', JSON.stringify(employeeChats));
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
      localStorage.setItem('messenger_chats', JSON.stringify(adminChats));
    }
  };

  // Сохраняем чаты в localStorage при изменении
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('messenger_chats', JSON.stringify(chats));
    }
  }, [chats]);

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

    setChats(prev => {
      const updatedChats = prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      );
      localStorage.setItem('messenger_chats', JSON.stringify(updatedChats));
      return updatedChats;
    });

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

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.participantRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChat = chats.find(chat => chat.id === activeChat);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Мессенджер</h1>
        <p className="text-gray-600 mt-1">
          Общение с коллегами и обмен файлами
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Список чатов */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Чаты
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск контактов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    activeChat === chat.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {chat.participantName}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {chat.participantRole}
                      </p>
                      {chat.messages.length > 0 && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {chat.messages[chat.messages.length - 1].content || 'Файл'}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Область сообщений */}
        <Card className="lg:col-span-2">
          {activeChat && currentChat ? (
            <>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {currentChat.participantName}
                  <span className="ml-2 text-sm font-normal text-gray-500 capitalize">
                    ({currentChat.participantRole})
                  </span>
                </CardTitle>
              </CardHeader>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                {currentChat.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Начните общение</p>
                  </div>
                ) : (
                  currentChat.messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(currentChat.messages[index - 1].timestamp);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            message.senderId === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.senderId !== user.id && (
                              <p className="text-xs opacity-75 mb-1">{message.senderName}</p>
                            )}
                            {message.content && (
                              <p className="text-sm break-words">{message.content}</p>
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
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Область ввода */}
              <div className="border-t border-gray-200 p-4">
                {selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(selectedFile.size)})
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
                <div className="flex items-end space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Введите сообщение..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !selectedFile}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите чат</h3>
                <p className="text-gray-600">
                  Выберите контакт из списка слева, чтобы начать общение
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
import React from 'react';
import { 
  Home, 
  FolderOpen, 
  Upload, 
  Calendar, 
  Users, 
  Camera,
  Palette,
  UserPlus,
  DollarSign,
  MessageCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  
  // Проверяем наличие непрочитанных сообщений
  const getUnreadMessagesCount = () => {
    try {
      const savedChats = localStorage.getItem('messenger_chats');
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        return chats.reduce((total: number, chat: any) => total + (chat.unreadCount || 0), 0);
      }
    } catch (error) {
      console.error('Ошибка при подсчете непрочитанных сообщений:', error);
    }
    return 0;
  };

  const unreadCount = getUnreadMessagesCount();

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Главная', icon: Home },
      { id: 'projects', label: 'Проекты', icon: FolderOpen },
      { id: 'reports', label: 'Отчеты', icon: MessageCircle },
    ];

    const roleSpecificItems = {
      photographer: [],
      designer: [],
      admin: [
        { id: 'add-employee', label: 'Добавить сотрудника', icon: UserPlus },
      ]
    };

    const commonItems = [
      { id: 'employees', label: 'Сотрудники', icon: Users },
      { id: 'salary', label: 'Зарплаты', icon: DollarSign },
      { id: 'calendar', label: 'Календарь', icon: Calendar },
      { id: 'messenger', label: 'Мессенджер', icon: MessageCircle, badge: unreadCount },
      { id: 'script', label: 'Скрипт', icon: FileText },
    ];

    return [
      ...baseItems,
      ...(roleSpecificItems[user?.role || 'photographer'] || []),
      ...commonItems
    ];
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PhotoAlbums</h1>
            <p className="text-sm text-gray-500">Управление проектами</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {getNavigationItems().map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    (user?.role !== 'admin' && item.id === 'add-employee')
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  )}
                  disabled={user?.role !== 'admin' && item.id === 'add-employee'}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, Menu, User, LogOut, Settings, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import Notifications from '../Notifications';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sticky top-0 z-40 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Leaf className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
            </div>
            <h1 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 hidden xs:block sm:block">{title}</h1>
            <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 xs:hidden">CL</h1>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Search - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex relative">
            <input
              type="text"
              placeholder={t('Search...')}
              className="pl-9 pr-3 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32 sm:w-48 lg:w-64 text-sm"
            />
            <Search className="absolute left-2.5 sm:left-3 top-1.5 sm:top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Mobile search button */}
          <button className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Notifications />

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:block">{user?.name}</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="py-2">
                <button
                  onClick={() => navigate(user?.role?.toUpperCase() === 'ADMIN' ? '/admin/settings' : '/settings')}
                  className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-700 dark:text-gray-200"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('Settings')}</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('Logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

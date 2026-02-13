import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Camera, 
  Users, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/detect', icon: Camera, label: 'Detect' },
    { path: '/feed', icon: Users, label: 'Feed' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chat' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center px-2 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all flex-1
                ${isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Settings button for admin/users */}
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin/settings' : '/settings')}
          className={`
            flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all flex-1
            ${location.pathname.includes('/settings')
              ? 'text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
            }
          `}
        >
          <Settings className={`h-5 w-5 mb-1 ${location.pathname.includes('/settings') ? 'text-primary-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${location.pathname.includes('/settings') ? 'text-primary-600' : 'text-gray-400'}`}>
            Settings
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;

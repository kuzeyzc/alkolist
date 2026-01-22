import { motion } from 'framer-motion';
import { Home, Search, Plus, User, Bell, Gamepad2, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

const navItems = [
  { icon: Home, label: 'Ana Sayfa', path: '/' },
  { icon: Search, label: 'Ara', path: '/search' },
  { icon: Gamepad2, label: 'Oyunlar', path: '/minigames' },
  { icon: Plus, label: 'Ekle', path: '/add', isMain: true },
  { icon: Bell, label: 'Bildirim', path: '/notifications', hasNotification: true },
  { icon: Settings, label: 'Ayarlar', path: '/settings' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDrunkMode } = useApp();
  const { unreadCount } = useUnreadNotifications();

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="glass-card rounded-3xl px-1 py-2 flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative -mt-8 gradient-amber rounded-full shadow-lg glow-amber ${
                  isDrunkMode ? 'p-5' : 'p-4'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className={`text-primary-foreground ${isDrunkMode ? 'h-8 w-8' : 'h-6 w-6'}`} />
                <motion.div
                  className="absolute inset-0 rounded-full gradient-amber opacity-50"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-colors ${
                isDrunkMode ? 'px-1.5 py-2.5' : ''
              } ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon className={isDrunkMode ? 'h-5 w-5' : 'h-4 w-4'} />
                {item.hasNotification && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-white bg-destructive rounded-full px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {isActive && (
                <>
                  <span className={`font-medium ${isDrunkMode ? 'text-[10px]' : 'text-[9px]'} whitespace-nowrap`}>
                    {item.label}
                  </span>
                  <motion.div
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    layoutId="activeTab"
                  />
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
import { motion } from 'framer-motion';
import { Sun, Moon, Wine, Bell } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
export const Header = () => {
  const {
    isDarkMode,
    setIsDarkMode,
    isDrunkMode,
    setIsDrunkMode,
    user
  } = useApp();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadNotifications();
  return <motion.header className="fixed top-0 left-0 right-0 z-50 px-4 py-3" initial={{
    y: -100
  }} animate={{
    y: 0
  }} transition={{
    type: 'spring',
    stiffness: 100
  }}>
      <div className="glass-card rounded-2xl px-4 py-2 flex items-center justify-between max-w-lg mx-auto">
        <motion.h1 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
        >
          <img 
            src="/alkolistsite2.png" 
            alt="Alkolist Logo" 
            className="h-8 w-auto object-contain" 
          />
        </motion.h1>

        <div className="flex items-center gap-2">
          {/* Notifications Bell - Pikselli Style */}
          {user && (
            <motion.button
              onClick={() => navigate('/notifications')}
              className="relative glass-button rounded-xl h-9 w-9 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={unreadCount > 0 ? {
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: unreadCount > 0 ? Infinity : 0,
                  repeatDelay: 2
                }}
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '16px',
                  imageRendering: 'pixelated',
                }}
              >
                🔔
              </motion.div>
              
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '8px',
                    boxShadow: '0 0 0 2px #1e293b, 0 2px 4px rgba(0,0,0,0.3)',
                    imageRendering: 'pixelated',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </motion.button>
          )}

          {/* Dark/Light Mode Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="glass-button rounded-xl h-9 w-9">
            <motion.div initial={false} animate={{
            rotate: isDarkMode ? 0 : 180
          }} transition={{
            duration: 0.3
          }}>
              {isDarkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            </motion.div>
          </Button>

          {/* Drunk Mode Toggle */}
          <Button variant={isDrunkMode ? 'default' : 'ghost'} size="icon" onClick={() => setIsDrunkMode(!isDrunkMode)} className={`rounded-xl h-9 w-9 transition-all duration-300 ${isDrunkMode ? 'gradient-amber glow-amber' : 'glass-button'}`}>
            <motion.div animate={{
            rotate: isDrunkMode ? [0, -10, 10, -10, 10, 0] : 0,
            scale: isDrunkMode ? 1.1 : 1
          }} transition={{
            rotate: {
              duration: 0.5,
              repeat: isDrunkMode ? Infinity : 0,
              repeatDelay: 2
            }
          }}>
              <Wine className={`h-4 w-4 ${isDrunkMode ? 'text-primary-foreground' : 'text-secondary'}`} />
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.header>;
};
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { X } from 'lucide-react';

interface DrinkLog {
  id: string;
  category: string;
  drink_name: string | null;
  quantity: number;
  logged_at: string;
  promil_score?: number;
}

const categoryEmojis: Record<string, string> = {
  beer: '🍺',
  wine: '🍷',
  raki: '🥛',
  vodka: '🧊',
  whiskey: '🥃',
  tequila: '🌵',
  gin: '🍸',
  rum: '🏴‍☠️',
  cocktails: '🍹',
  cider: '🍎',
  liqueur: '🍬',
  sake: '🍶',
  soju: '🇰🇷',
  spirits: '🥃',
};

const CalendarView = () => {
  const { user, isDrunkMode } = useApp();
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDayLogs, setSelectedDayLogs] = useState<DrinkLog[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDrinkLogs();
    }
  }, [user]);

  const fetchDrinkLogs = async () => {
    const { data } = await supabase
      .from('drink_logs')
      .select('id, category, drink_name, quantity, logged_at, promil_score')
      .eq('user_id', user?.id)
      .order('logged_at', { ascending: false });

    if (data) {
      setDrinkLogs(data);
    }
  };

  // Get dates that have drink logs
  const datesWithLogs = drinkLogs.reduce((acc, log) => {
    const date = format(parseISO(log.logged_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, DrinkLog[]>);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const logs = drinkLogs.filter((log) => 
      format(parseISO(log.logged_at), 'yyyy-MM-dd') === dateStr
    );
    
    if (logs.length > 0) {
      setSelectedDayLogs(logs);
      setShowModal(true);
    }
  };

  // Custom day content to show drink emoji on days with logs
  const modifiers = {
    hasLogs: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return !!datesWithLogs[dateStr];
    },
  };

  const modifiersStyles = {
    hasLogs: {
      backgroundColor: 'hsl(var(--primary) / 0.2)',
      borderRadius: '50%',
    },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10">
        <motion.div
          className="glass-card rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className={`font-display font-bold text-foreground mb-4 ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
            Drinking Calendar 📅
          </h2>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-xl border-0"
              classNames={{
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20" />
              <span>Days with drinks</span>
            </div>
          </div>

          {/* Stats summary */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-4xl' : 'text-3xl'}`}>
                {Object.keys(datesWithLogs).length}
              </p>
              <p className="text-muted-foreground text-sm">Drinking Days</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-4xl' : 'text-3xl'}`}>
                {drinkLogs.reduce((sum, log) => sum + log.quantity, 0)}
              </p>
              <p className="text-muted-foreground text-sm">Total Drinks</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {showModal && selectedDate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              className="relative glass-card rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <h3 className={`font-display font-bold text-foreground mb-4 ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                {format(selectedDate, 'MMMM d, yyyy')} 🍻
              </h3>

              <div className="space-y-3">
                {selectedDayLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <span className={isDrunkMode ? 'text-4xl' : 'text-3xl'}>
                      {categoryEmojis[log.category] || '🍺'}
                    </span>
                    <div className="flex-1">
                      <p className={`font-medium text-foreground ${isDrunkMode ? 'text-lg' : ''}`}>
                        {log.drink_name || log.category}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {format(parseISO(log.logged_at), 'h:mm a')}
                      </p>
                    </div>
                    <span className={`font-bold text-primary ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                      x{log.quantity}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-1">
                <p className="text-center text-muted-foreground">
                  Total: <span className="font-bold text-foreground">{selectedDayLogs.reduce((s, l) => s + l.quantity, 0)}</span> drinks 🍻
                </p>
                {selectedDayLogs.some(l => l.promil_score) && (
                  <p className="text-center text-[#f59e0b] text-sm">
                    Toplam: <span className="font-bold">{(selectedDayLogs.reduce((s, l) => s + (l.promil_score || 0), 0) / 100).toFixed(1)} promil</span>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CalendarView;
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardUser {
  username: string;
  avatarUrl?: string;
  drinkCount: number;
  totalPromil: number;
  rank: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  period?: 'week' | 'month';
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600'];

export const Leaderboard = ({ users, period = 'week' }: LeaderboardProps) => {
  const periodText = period === 'week' ? 'Bu Hafta' : 'Bu Ay';

  return (
    <motion.div
      className="glass-card rounded-2xl p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg text-foreground">
          EN ALKOLİK 🏆
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {periodText}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Henüz arkadaş ekleyin 👥
        </p>
      ) : (
        <div className="space-y-2">
          {users.slice(0, 5).map((user, index) => {
            const RankIcon = rankIcons[index] || null;
            const rankColor = rankColors[index] || 'text-muted-foreground';

            return (
              <motion.div
                key={user.username}
                className={`flex items-center gap-3 p-2 rounded-xl ${
                  index === 0 ? 'bg-primary/10 border border-primary/20' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-8 h-8 flex items-center justify-center font-bold ${rankColor}`}>
                  {RankIcon ? (
                    <RankIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>

                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>

                <span className="flex-1 font-medium text-foreground text-sm truncate">
                  @{user.username}
                </span>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-[#f59e0b]">
                      {(user.totalPromil / 100).toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-[#f59e0b]">promil</span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">{user.drinkCount} içki</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
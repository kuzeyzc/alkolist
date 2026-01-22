import { motion } from 'framer-motion';

interface StatItem {
  category: string;
  count: number;
  emoji: string;
}

interface StatsCardProps {
  stats: StatItem[];
  totalDrinks: number;
  year?: number;
}

export const StatsCard = ({ stats, totalDrinks, year = new Date().getFullYear() }: StatsCardProps) => {
  return (
    <motion.div
      className="glass-card rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-foreground">
          {year} Stats 📊
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-display font-bold text-primary">{totalDrinks}</span>
          <span className="text-muted-foreground text-sm">total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.category}
            className={`p-3 rounded-xl border badge-${stat.category}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stat.emoji}</span>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {stat.count}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {stat.category}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

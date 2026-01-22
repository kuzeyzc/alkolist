import { motion } from 'framer-motion';

interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface BadgeDisplayProps {
  badges: Badge[];
}

export const BadgeDisplay = ({ badges }: BadgeDisplayProps) => {
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <motion.div
      className="glass-card rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-display font-bold text-lg text-foreground mb-4">
        Badges 🏅
      </h3>

      {earnedBadges.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Earned</p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.nameEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {lockedBadges.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Locked</p>
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border opacity-50 grayscale"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: index * 0.02 }}
              >
                <span className="text-xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

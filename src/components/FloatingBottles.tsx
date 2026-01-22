import { motion } from 'framer-motion';

const bottles = [
  { emoji: '🍺', delay: 0, x: '10%', duration: 6 },
  { emoji: '🍷', delay: 1, x: '25%', duration: 8 },
  { emoji: '🥃', delay: 2, x: '40%', duration: 7 },
  { emoji: '🍸', delay: 0.5, x: '55%', duration: 9 },
  { emoji: '🍻', delay: 1.5, x: '70%', duration: 6.5 },
  { emoji: '🥂', delay: 2.5, x: '85%', duration: 7.5 },
  { emoji: '🍾', delay: 0.8, x: '15%', duration: 8.5 },
  { emoji: '🧉', delay: 1.8, x: '60%', duration: 7.2 },
  { emoji: '🍹', delay: 3, x: '80%', duration: 6.8 },
  { emoji: '🥤', delay: 2.2, x: '35%', duration: 8.2 },
];

export const FloatingBottles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bottles.map((bottle, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl md:text-5xl opacity-[0.07]"
          style={{ left: bottle.x }}
          initial={{ y: '110vh', rotate: 0 }}
          animate={{
            y: '-10vh',
            rotate: [0, 10, -10, 5, -5, 0],
          }}
          transition={{
            y: {
              duration: bottle.duration,
              repeat: Infinity,
              delay: bottle.delay,
              ease: 'linear',
            },
            rotate: {
              duration: bottle.duration / 2,
              repeat: Infinity,
              delay: bottle.delay,
              ease: 'easeInOut',
            },
          }}
        >
          {bottle.emoji}
        </motion.div>
      ))}
    </div>
  );
};

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FlyingPaperProps {
  onComplete: () => void;
  startPosition?: { x: number; y: number };
}

export const FlyingPaper = ({ onComplete, startPosition }: FlyingPaperProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 40 - 20,
      y: Math.random() * 40 - 20,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Main Flying Paper */}
      <motion.div
        className="absolute"
        initial={{
          x: startPosition?.x || window.innerWidth / 2,
          y: startPosition?.y || window.innerHeight / 2,
          scale: 1,
          opacity: 1,
          rotate: 0,
        }}
        animate={{
          x: window.innerWidth + 100,
          y: -100,
          scale: 0,
          opacity: 0,
          rotate: 360,
        }}
        transition={{
          duration: 1.2,
          ease: [0.34, 1.56, 0.64, 1], // Elastic easing
          x: {
            duration: 1.2,
            ease: "easeInOut",
          },
          y: {
            duration: 1.2,
            ease: "easeIn",
          },
          rotate: {
            duration: 1.2,
            ease: "easeOut",
          },
        }}
        style={{
          filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))',
        }}
        onAnimationComplete={onComplete}
      >
        {/* Pikselli Kağıt İkonu */}
        <motion.div
          className="relative"
          animate={{
            rotate: [0, -15, 15, -10, 10, -5, 5, 0], // Sallanma efekti
          }}
          transition={{
            duration: 1.2,
            times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
            ease: "easeInOut",
          }}
        >
          {/* Pikselli Kağıt SVG */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              imageRendering: 'pixelated',
            }}
          >
            {/* Kağıt Gövdesi */}
            <rect x="15" y="10" width="50" height="60" fill="#f59e0b" />
            <rect x="12" y="13" width="56" height="54" fill="#fbbf24" />
            
            {/* Pikselli Çizgiler */}
            <rect x="20" y="25" width="40" height="3" fill="#f59e0b" opacity="0.6" />
            <rect x="20" y="35" width="35" height="3" fill="#f59e0b" opacity="0.6" />
            <rect x="20" y="45" width="38" height="3" fill="#f59e0b" opacity="0.6" />
            <rect x="20" y="55" width="30" height="3" fill="#f59e0b" opacity="0.6" />
            
            {/* Pikselli Gölge */}
            <rect x="15" y="70" width="50" height="3" fill="#000" opacity="0.2" />
            
            {/* Pikselli Kalem İzi */}
            <circle cx="55" cy="20" r="4" fill="#f59e0b" opacity="0.8" />
            <circle cx="58" cy="22" r="3" fill="#fbbf24" />
          </svg>

          {/* Emoji Fallback (mobilde SVG render sorunları için) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-6xl"
            style={{ mixBlendMode: 'multiply' }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            📝
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Pikselli Partikül Efektleri */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-amber-500 rounded-none"
          initial={{
            x: (startPosition?.x || window.innerWidth / 2) + particle.x,
            y: (startPosition?.y || window.innerHeight / 2) + particle.y,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: (startPosition?.x || window.innerWidth / 2) + particle.x + Math.random() * 200 - 100,
            y: (startPosition?.y || window.innerHeight / 2) + particle.y - Math.random() * 150,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            ease: "easeOut",
            delay: Math.random() * 0.2,
          }}
          style={{
            boxShadow: '0 0 4px rgba(245, 158, 11, 0.8)',
          }}
        />
      ))}

      {/* Pikselli Yıldızlar */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute text-2xl"
          initial={{
            x: (startPosition?.x || window.innerWidth / 2) + (i - 2) * 20,
            y: (startPosition?.y || window.innerHeight / 2),
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: (startPosition?.x || window.innerWidth / 2) + (i - 2) * 40,
            y: (startPosition?.y || window.innerHeight / 2) - 60 - i * 10,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.1 + i * 0.05,
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
};

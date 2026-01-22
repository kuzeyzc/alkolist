import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  mode?: 'fullscreen' | 'profile';
  originPosition?: { x: number; y: number };
}

export const ImageModal = ({ imageUrl, onClose, mode = 'fullscreen' }: ImageModalProps) => {
  const [dragY, setDragY] = useState(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Close on significant downward drag (mobile friendly)
    if (info.offset.y > 100) {
      onClose();
    }
  };

  if (mode === 'fullscreen') {
    const modalContent = (
      <AnimatePresence>
        {imageUrl && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed' }}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[10000]"
              onClick={onClose}
              aria-label="Kapat"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image */}
            <motion.img
              src={imageUrl}
              alt="Büyük görünüm"
              className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              onDrag={(_, info) => setDragY(info.offset.y)}
              onDragEnd={handleDragEnd}
              style={{ 
                cursor: dragY !== 0 ? 'grabbing' : 'grab',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );

    // Render using Portal to escape any container overflow constraints
    return createPortal(modalContent, document.body);
  }

  // Profile mode - elegant zoom in place
  const profileModalContent = (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed' }}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[10000]"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image - Profile Mode (200% larger, elegant zoom) */}
          <motion.div
            className="relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.2 }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt="Profil fotoğrafı"
              className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-cover rounded-full border-4 border-white/20 shadow-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render using Portal to escape any container overflow constraints
  return createPortal(profileModalContent, document.body);
};

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteEventDialogProps {
  isOpen: boolean;
  eventName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteEventDialog = ({
  isOpen,
  eventName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteEventDialogProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-[#F5E6D3] w-full max-w-md shadow-2xl border-4 border-[#D4B896]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            imageRendering: 'pixelated',
            clipPath: 'polygon(2% 0%, 98% 0%, 100% 2%, 100% 98%, 98% 100%, 2% 100%, 0% 98%, 0% 2%)',
          }}
        >
          {/* Header */}
          <div
            className="bg-[#E8D4B8] border-b-4 border-[#D4B896] px-6 py-4 flex items-center justify-between"
            style={{ imageRendering: 'pixelated' }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-mono font-bold text-[#3E2723]">
                Etkinliği Sil
              </h2>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-2 hover:bg-[#D4B896] transition-colors disabled:opacity-50"
              style={{ imageRendering: 'pixelated' }}
            >
              <X className="h-6 w-6 text-[#3E2723]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div
                className="p-4 bg-red-100 border-4 border-red-600"
                style={{ imageRendering: 'pixelated' }}
              >
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
              <p className="text-lg font-mono font-bold text-[#3E2723]">
                Bu etkinliği silmek istediğine emin misin?
              </p>
              <div
                className="p-3 bg-white border-2 border-[#D4B896]"
                style={{ imageRendering: 'pixelated' }}
              >
                <p className="text-sm font-mono text-gray-700 break-words">
                  "{eventName}"
                </p>
              </div>
              <p className="text-sm font-mono text-red-600">
                ⚠️ Bu işlem geri alınamaz!
              </p>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                onClick={onCancel}
                disabled={isDeleting}
                className="bg-gray-500 hover:bg-gray-600 text-white font-mono font-bold py-3 border-4 border-gray-700 disabled:opacity-50"
                style={{ imageRendering: 'pixelated' }}
              >
                İptal
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-mono font-bold py-3 border-4 border-red-800 disabled:opacity-50"
                style={{ imageRendering: 'pixelated' }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Siliniyor...
                  </>
                ) : (
                  '🗑️ Sil'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AddDrinkModal } from '@/components/AddDrinkModal';
import { useApp } from '@/contexts/AppContext';

const AddDrink = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(true);

  // Eğer kullanıcı yoksa ana sayfaya at
  if (!user) {
    navigate('/');
  }

  const handleClose = () => {
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />
      <BottomNav />

      {/* Burada doğrudan gelişmiş AddDrinkModal kullanılıyor.
          İçinde:
          - Rakı/Votka vs. tüm kategoriler (categories.map ile)
          - Promil hesabı (estimatedPromil & currentPromil)
          - Fotoğraf yükleme (input ref ile gizli file input) */}
      <AddDrinkModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </div>
  );
};

export default AddDrink;

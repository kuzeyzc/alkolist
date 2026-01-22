import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { Zap, RefreshCw, Lock, X, RotateCcw, Keyboard, Flame, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type GameStage = 'intro' | 'waiting' | 'ready' | 'result';
type RouletteStage = 'lobby' | 'spinning' | 'result';
type TypingStage = 'intro' | 'playing' | 'result';
type HotCocktailStage = 'intro' | 'playing' | 'exploded';

const games = [
  {
    id: 'reaction',
    title: 'Reaksiyon Testi',
    emoji: '⚡',
    description: 'Reflekslerini test et! Sarhoşken hala tepki verebiliyor musun?',
    color: 'from-amber-500 to-orange-600',
    icon: Zap,
    comingSoon: false,
    shadowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] border-amber-500/50'
  },
  {
    id: 'roulette',
    title: 'Kader Çarkı',
    emoji: '🎲',
    description: 'Çarkı çevir, kaderini belirle! Kim shot atacak?',
    color: 'from-blue-600 to-blue-800',
    icon: RefreshCw,
    comingSoon: false,
    shadowClass: 'shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] border-blue-500/50'
  },
  {
    id: 'keyboard',
    title: 'Klavye Delikanlısı',
    emoji: '⌨️',
    description: 'Hızlı yazma yarışması. En hızlı kim?',
    color: 'from-purple-500 to-indigo-600',
    icon: Keyboard,
    comingSoon: false,
    shadowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] border-purple-500/50'
  },
  {
    id: 'hotcocktail',
    title: 'Sıcak Kokteyl',
    emoji: '🔥',
    description: 'Sıcak sorular, soğuk içkiler. Cesaret ister!',
    color: 'from-orange-600 to-red-600',
    icon: Flame,
    comingSoon: false,
    shadowClass: 'shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] border-red-500/50'
  },
];

// Kader Çarkı için esprili mesajlar
const rouletteMessages = [
  'Afiyet olsun paşam! 🥃',
  'Yarasın! 🍻',
  'İtiraz istemez! ⚖️',
  'Kader böyleymiş! 🎯',
  'Şansına küsmüş! 😅',
  'Hayırlısı olsun! 🙏',
  'Gözün aydın! 🎉',
  'Sağlığına! 🥂',
];

// Klavye Delikanlısı - Cümle Havuzu
const typingSentences = [
  'Şu yoğurdu sarımsaklasak da mı saklasak, sarımsaklamasak da mı saklasak?',
  'Abi ben sarhoş değilim sadece yerçekimi bugün biraz fazla',
  'Ben iyiyim ya sadece gözlerim biraz dinlenmek istiyor',
  'Vallahi içmedim yediğim patates kızartması dokundu',
  'Yer sallanıyor mu yoksa bana mı öyle geliyor',
  'Ben sarhoş olmam sadece biraz çakırkeyifim o kadar',
  'Eski sevgilime asla mesaj atmayacağım bu son kararım',
  'Uyudun mu Sadece sesini duymak istedim valla bak',
  'Seni hala seviyorum desem sabah pişman olur muyum',
  'Telefonumu elimden alın yoksa çok büyük hata yapacağım',
  'Bu saatte mesaj atıyorsam bil ki çok önemlisin',
  'Yarın kesin diyete başlıyorum bu yediğim son hamburger',
  'Bir daha asla içmeyeceğim tövbe ettim bu son',
  'Hesabı ben ödeyeceğim dedim cüzdanı evde unutmuşum',
  'Yarın sabah 8de kesin kalkıp spora gidiyorum uyandırın',
  'Bu son bardak bundan sonra sadece su içiyoruz söz',
  'Abi şimdi bi işkembe çorbası içsek kendimize geliriz',
  'Eve dönerken kokoreççi açık mıdır acaba',
  'Taksici abi müziğin sesini açsana, efkarlanalım biraz',
  'Konum at geliyorum ama önce hangi şehirdeyim onu bulayım',
  'Şarkıyı değiştirmeyin bu benim şarkım ben yazdım bunu',
];

// Sıcak Kokteyl - Soru Havuzu
const cocktailQuestions = [
  "İçinde 'A' harfi olmayan bir hayvan söyle.",
  "Eski sevgilinin adını bağırarak söyle.",
  "Sağındaki kişinin en sevmediğin huyunu söyle.",
  "Telefonundaki son fotoğrafı herkese göster.",
  "3 tane kırmızı meyve say.",
  "En son ne zaman yalan söyledin? Neydi?",
  "Masadaki en çapkın kişi kim? Göster.",
  "Hiç tutuklandın mı veya polisle başın derde girdi mi?",
  "Alfabeyi tersten 5 harf say.",
  "Şu anki ilişki durumunu 3 kelimeyle açıkla.",
  "Çocukken lakabın neydi?",
  "Asla yapmam dediğin ama yaptığın bir şey söyle.",
  "5 tane Avrupa başkenti say.",
  "En utanç verici sarhoş anını anlat."
];

// Mesaj havuzları
const reactionMessages = {
  legendary: [
    'Formula 1 Pilotu musun? 🏎️',
    'Flash mısın be mübarek? ⚡',
    'Gözle görülemeyen hız! 🚀',
    'Refleks değil, önsezi bu! 🔮',
    'Masayı devirdin sakin ol! 🤯',
  ],
  good: [
    'Zıpkın Gibisin 👍',
    'Gayet iyisin, formundasın. 🔥',
    'Refleksler tıkırında. ✅',
    'Henüz sarhoş değilsin, devam! 🍻',
    'Beton gibisin, sapa sağlam! 💪',
  ],
  tipsy: [
    'Çakırkeyif Refleksler... 🥴',
    'Ping var galiba? 📶',
    'Gözler hafif kayıyor sanki? 👀',
    'Frene basma vakti geliyor... 🛑',
    'Algılar biraz açılmış (yavaşça) 🐢',
  ],
  dangerous: [
    'Taksi Çağıralım 🚕',
    'Telefonu yavaşça yere bırak... 📱',
    'Senin internet kopmuş usta 🔌',
    'Yarın sabah pişmanlık yükleniyor... 🤮',
    'Game Over. Yatağa git. 🛌',
  ],
};

// Erken tıklama (faul) mesajları
const earlyClickMessages = [
  'Sanırım taksi çağırmamız gerek... 🚕',
  'Bence sen bugünlük daha fazla içme 🥃',
  'Anahtarı arkadaşına ver istersen 🔑',
  'Gözler gidiyor, taksi yolda! 🛑',
];

const getEarlyClickMessage = (): string => {
  return earlyClickMessages[Math.floor(Math.random() * earlyClickMessages.length)];
};

const getReactionComment = (ms: number): string => {
  let messages: string[];
  
  if (ms <= 280) {
    messages = reactionMessages.legendary;
  } else if (ms <= 450) {
    messages = reactionMessages.good;
  } else if (ms <= 600) {
    messages = reactionMessages.tipsy;
  } else {
    messages = reactionMessages.dangerous;
  }
  
  // Rastgele mesaj seç
  return messages[Math.floor(Math.random() * messages.length)];
};

const Minigames = () => {
  const { isDrunkMode } = useApp();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameStage, setGameStage] = useState<GameStage>('intro');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [reactionMessage, setReactionMessage] = useState<string>('');
  const [waitStartTime, setWaitStartTime] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [earlyClickMessage, setEarlyClickMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const earlyClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Kader Çarkı state'leri
  const [rouletteStage, setRouletteStage] = useState<RouletteStage>('lobby');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [rouletteMessage, setRouletteMessage] = useState<string>('');
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinDuration, setSpinDuration] = useState<number>(4000);

  // Klavye Delikanlısı state'leri
  const [typingStage, setTypingStage] = useState<TypingStage>('intro');
  const [targetSentence, setTargetSentence] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingEndTime, setTypingEndTime] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [drunkEffect, setDrunkEffect] = useState<boolean>(false);

  // Sıcak Kokteyl state'leri
  const [hotCocktailStage, setHotCocktailStage] = useState<HotCocktailStage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const hotCocktailTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const openGame = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (game && !game.comingSoon) {
      setSelectedGame(gameId);
      if (gameId === 'reaction') {
        setGameStage('intro');
        setReactionTime(null);
        setReactionMessage('');
        setEarlyClickMessage('');
        setIsShaking(false);
      } else if (gameId === 'roulette') {
        setRouletteStage('lobby');
        setPlayers([]);
        setPlayerInput('');
        setWinner(null);
        setRouletteMessage('');
        setRotation(0);
        setIsSpinning(false);
      } else if (gameId === 'keyboard') {
        setTypingStage('intro');
        setTargetSentence('');
        setTypedText('');
        setTypingStartTime(null);
        setTypingEndTime(null);
        setHasError(false);
        setDrunkEffect(false);
      } else if (gameId === 'hotcocktail') {
        setHotCocktailStage('intro');
        setCurrentQuestion('');
        setTimeLeft(0);
        setTotalTime(0);
      }
    }
  };

  const closeGame = () => {
    setSelectedGame(null);
    setGameStage('intro');
    setReactionTime(null);
    setReactionMessage('');
    setEarlyClickMessage('');
    setIsShaking(false);
    startTimeRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (earlyClickTimeoutRef.current) {
      clearTimeout(earlyClickTimeoutRef.current);
      earlyClickTimeoutRef.current = null;
    }
    // Kader Çarkı reset
    setRouletteStage('lobby');
    setPlayers([]);
    setPlayerInput('');
    setWinner(null);
    setRouletteMessage('');
    setRotation(0);
    setIsSpinning(false);
    setSpinDuration(4000);
    // Klavye Delikanlısı reset
    setTypingStage('intro');
    setTargetSentence('');
    setTypedText('');
    setTypingStartTime(null);
    setTypingEndTime(null);
    setHasError(false);
    setDrunkEffect(false);
    // Sıcak Kokteyl reset
    setHotCocktailStage('intro');
    setCurrentQuestion('');
    setTimeLeft(0);
    setTotalTime(0);
    if (hotCocktailTimerRef.current) {
      clearInterval(hotCocktailTimerRef.current);
      hotCocktailTimerRef.current = null;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
  };

  const startGame = () => {
    setGameStage('waiting');
    setWaitStartTime(Date.now());
    // Rastgele 2-5 saniye arası bekleme
    const waitTime = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      // ÖNCE zamanı kaydet (anlık, senkron)
      startTimeRef.current = Date.now();
      // SONRA state'i güncelle (asenkron ama zaman zaten kaydedildi)
      setGameStage('ready');
    }, waitTime);
  };

  const handleClick = () => {
    // startTimeRef kontrolü ile senkron çalış - state'e bağlı değil
    if (!startTimeRef.current) {
      // Henüz yeşil olmadı - erken basıldı (waiting aşaması)
      if (gameStage === 'waiting') {
        // Erken tıklama - oyun bitmesin, sadece uyarı göster
        setIsShaking(true);
        setEarlyClickMessage(getEarlyClickMessage());
        
        // 1 saniye sonra mesajı kaldır ve tekrar bekle moduna dön
        if (earlyClickTimeoutRef.current) {
          clearTimeout(earlyClickTimeoutRef.current);
        }
        earlyClickTimeoutRef.current = setTimeout(() => {
          setIsShaking(false);
          setEarlyClickMessage('');
        }, 1000);
      }
      return;
    }

    // startTimeRef varsa, oyun aktif demektir (yeşil ekran) - hemen hesapla
    const time = Date.now() - startTimeRef.current;
    setReactionTime(time);
    // Mesajı oyun bittiği anda belirle
    setReactionMessage(getReactionComment(time));
    setGameStage('result');
    // startTimeRef'i sıfırla (bir sonraki oyun için)
    startTimeRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (earlyClickTimeoutRef.current) {
      clearTimeout(earlyClickTimeoutRef.current);
      earlyClickTimeoutRef.current = null;
    }
  };

  const resetGame = () => {
    setGameStage('waiting');
    setReactionTime(null);
    setReactionMessage('');
    setEarlyClickMessage('');
    setIsShaking(false);
    setWaitStartTime(Date.now());
    // startTimeRef'i sıfırla (yeniden başlatma için)
    startTimeRef.current = null;
    if (earlyClickTimeoutRef.current) {
      clearTimeout(earlyClickTimeoutRef.current);
      earlyClickTimeoutRef.current = null;
    }
    const waitTime = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      // ÖNCE zamanı kaydet (anlık, senkron)
      startTimeRef.current = Date.now();
      // SONRA state'i güncelle
      setGameStage('ready');
    }, waitTime);
  };

  // Kader Çarkı fonksiyonları
  const addPlayer = () => {
    const trimmed = playerInput.trim();
    if (trimmed && !players.includes(trimmed)) {
      setPlayers([...players, trimmed]);
      setPlayerInput('');
    }
  };

  const removePlayer = (name: string) => {
    setPlayers(players.filter(p => p !== name));
  };

  const addPreset = (presetPlayers: string[]) => {
    const unique = [...new Set([...players, ...presetPlayers])];
    setPlayers(unique);
  };

  const startRoulette = () => {
    if (players.length >= 2) {
      setRouletteStage('spinning');
      setIsSpinning(true);
      setWinner(null);
      setRouletteMessage('');
      
      // 8 saniyelik animasyon süresi
      const duration = 8000;
      setSpinDuration(duration);
      const baseRotation = rotation || 0;
      const randomRotation = 360 * (5 + Math.random() * 5); // 5-10 tam tur
      // İbre üstte (0 derece), segment açısını hesaplarken offset ekle
      const segmentOffset = 360 / players.length / 2; // Segment ortasına denk gelsin
      const finalRotation = baseRotation + randomRotation + segmentOffset;
      
      setRotation(finalRotation);
      
      // Dönüş bitince kazananı belirle
      setTimeout(() => {
        setIsSpinning(false);
        // İbre üstte (0 derece), çarkın dönüş açısını normalize et
        const normalizedAngle = (360 - (finalRotation % 360)) % 360;
        const segmentAngle = 360 / players.length;
        // Hangi segment üstte (0-360 arası normalize edilmiş açı)
        let winnerIndex = Math.floor(normalizedAngle / segmentAngle);
        // Sınır kontrolü
        if (winnerIndex >= players.length) winnerIndex = 0;
        if (winnerIndex < 0) winnerIndex = players.length - 1;
        
        const selectedWinner = players[winnerIndex];
        setWinner(selectedWinner);
        setRouletteMessage(rouletteMessages[Math.floor(Math.random() * rouletteMessages.length)]);
        setRouletteStage('result');
      }, duration);
    }
  };

  const resetRoulette = () => {
    setRouletteStage('spinning');
    setIsSpinning(true);
    setWinner(null);
    setRouletteMessage('');
    
    const duration = 8000;
    setSpinDuration(duration);
    const baseRotation = rotation || 0;
    const randomRotation = 360 * (5 + Math.random() * 5);
    const segmentOffset = 360 / players.length / 2;
    const finalRotation = baseRotation + randomRotation + segmentOffset;
    
    setRotation(finalRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      const normalizedAngle = (360 - (finalRotation % 360)) % 360;
      const segmentAngle = 360 / players.length;
      let winnerIndex = Math.floor(normalizedAngle / segmentAngle);
      if (winnerIndex >= players.length) winnerIndex = 0;
      if (winnerIndex < 0) winnerIndex = players.length - 1;
      
      const selectedWinner = players[winnerIndex];
      setWinner(selectedWinner);
      setRouletteMessage(rouletteMessages[Math.floor(Math.random() * rouletteMessages.length)]);
      setRouletteStage('result');
    }, duration);
  };

  // Klavye Delikanlısı fonksiyonları
  const startTypingGame = () => {
    const randomSentence = typingSentences[Math.floor(Math.random() * typingSentences.length)];
    setTargetSentence(randomSentence);
    setTypedText('');
    setTypingStartTime(Date.now());
    setTypingEndTime(null);
    setHasError(false);
    setTypingStage('playing');
  };

  const handleTypingInput = (value: string) => {
    if (typingStage !== 'playing') return;
    
    // Karakter kontrolü - sadece doğru olan kadar yazılabilir
    const maxLength = targetSentence.length;
    if (value.length > maxLength) {
      return;
    }
    
    // Son karakteri kontrol et (case-insensitive)
    if (value.length > typedText.length) {
      const lastChar = value[value.length - 1].toLowerCase();
      const expectedChar = targetSentence[value.length - 1].toLowerCase();
      
      if (lastChar !== expectedChar) {
        // Yanlış karakter - hata efekti göster
        setHasError(true);
        setTimeout(() => setHasError(false), 300);
        return; // Yanlış karakteri ekleme
      }
    }
    
    setTypedText(value);
    
    // Tamamlandı mı? (case-insensitive)
    if (value.toLowerCase() === targetSentence.toLowerCase()) {
      setTypingEndTime(Date.now());
      setTypingStage('result');
    }
  };

  const getTypingResult = (duration: number) => {
    const seconds = duration / 1000;
    if (seconds < 10) {
      return { level: 'Ayıksın!', promil: '0 promil', emoji: '💧', color: 'text-green-500' };
    } else if (seconds < 20) {
      return { level: 'Çakırkeyif', promil: '50 promil', emoji: '🍺', color: 'text-blue-500' };
    } else if (seconds < 40) {
      return { level: 'Sarhoşsun', promil: '100 promil', emoji: '🍷', color: 'text-orange-500' };
    } else {
      return { level: 'Klavye sana küsmüş', promil: '200 promil', emoji: '🤮', color: 'text-red-500' };
    }
  };

  const resetTypingGame = () => {
    const randomSentence = typingSentences[Math.floor(Math.random() * typingSentences.length)];
    setTargetSentence(randomSentence);
    setTypedText('');
    setTypingStartTime(Date.now());
    setTypingEndTime(null);
    setHasError(false);
    setTypingStage('playing');
  };

  // Sıcak Kokteyl fonksiyonları
  const startHotCocktail = () => {
    // Rastgele süre belirle (20-60 saniye arası)
    const duration = Math.floor(Math.random() * 41000) + 20000; // 20000-60000ms
    setTotalTime(duration);
    setTimeLeft(duration);
    
    // İlk soruyu göster
    const randomQuestion = cocktailQuestions[Math.floor(Math.random() * cocktailQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setHotCocktailStage('playing');
    
    // 100ms'de bir süreyi azalt
    hotCocktailTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          // PATLAMA!
          explodeHotCocktail();
          return 0;
        }
        return newTime;
      });
    }, 100);

    // Titreşim efekti - süre azaldıkça hızlanır
    if (navigator.vibrate) {
      vibrateIntervalRef.current = setInterval(() => {
        setTimeLeft(current => {
          const progress = current / duration;
          if (progress > 0.5) {
            // İlk yarı - hafif titreşim, seyrek
            navigator.vibrate(50);
          } else if (progress > 0.25) {
            // İkinci çeyrek - orta titreşim
            navigator.vibrate(100);
          } else {
            // Son çeyrek - güçlü titreşim
            navigator.vibrate(150);
          }
          return current;
        });
      }, 2000); // Başlangıçta her 2 saniyede bir
    }
  };

  const explodeHotCocktail = () => {
    // Timer'ları temizle
    if (hotCocktailTimerRef.current) {
      clearInterval(hotCocktailTimerRef.current);
      hotCocktailTimerRef.current = null;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }

    // Uzun titreşim
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    setHotCocktailStage('exploded');
  };

  const nextQuestion = () => {
    // Yeni rastgele soru göster
    const randomQuestion = cocktailQuestions[Math.floor(Math.random() * cocktailQuestions.length)];
    setCurrentQuestion(randomQuestion);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (earlyClickTimeoutRef.current) {
        clearTimeout(earlyClickTimeoutRef.current);
      }
      if (hotCocktailTimerRef.current) {
        clearInterval(hotCocktailTimerRef.current);
      }
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
      }
    };
  }, []);

  // Klavye Delikanlısı - Sarhoşluk efekti (her 2 saniyede bir)
  useEffect(() => {
    if (typingStage === 'playing') {
      const interval = setInterval(() => {
        setDrunkEffect(true);
        setTimeout(() => setDrunkEffect(false), 500);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [typingStage]);

  const currentGame = games.find((g) => g.id === selectedGame);
  const Icon = currentGame?.icon || Zap;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10">
        <motion.h1
          className={`font-display font-bold text-foreground mb-2 ${isDrunkMode ? 'text-3xl' : 'text-2xl'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Mini Oyunlar 🎮
        </motion.h1>
        <motion.p
          className={`text-muted-foreground mb-6 ${isDrunkMode ? 'text-lg' : 'text-sm'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          İçerken arkadaşlarınla oynayabileceğin parti oyunları!
        </motion.p>

        <div className="space-y-4">
          {games.map((game, index) => {
            const GameIcon = game.icon;
            return (
              <motion.div
                key={game.id}
                className={`glass-card rounded-2xl border transition-all duration-300 ${
                  game.comingSoon 
                    ? 'cursor-not-allowed opacity-60' 
                    : `cursor-pointer group hover:scale-[1.02] ${game.shadowClass || ''}` 
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!game.comingSoon ? { scale: 1.02 } : {}}
                whileTap={!game.comingSoon ? { scale: 0.98 } : {}}
                onClick={() => !game.comingSoon && openGame(game.id)}
              >
                <div className="overflow-hidden rounded-2xl">
                  <div className={`h-2 bg-gradient-to-r ${game.color}`} />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${game.color} text-white`}>
                        <GameIcon className={isDrunkMode ? 'h-8 w-8' : 'h-6 w-6'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={isDrunkMode ? 'text-3xl' : 'text-2xl'}>{game.emoji}</span>
                          <h2 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
                            {game.title}
                          </h2>
                        </div>
                        <p className={`text-muted-foreground mt-1 ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {game.comingSoon && (
                      <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-muted/50 border border-border">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                          Çok Yakında
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-8 glass-card rounded-2xl p-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-4xl block mb-2">🎉</span>
          <p className={`text-foreground font-medium ${isDrunkMode ? 'text-lg' : 'text-base'}`}>
            Daha fazla oyun çok yakında!
          </p>
          <p className={`text-muted-foreground mt-1 ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
            Oyun fikrin mi var? Bize söyle!
          </p>
        </motion.div>
      </main>

      {/* Kader Çarkı Modal */}
      <Dialog open={selectedGame === 'roulette'} onOpenChange={(open) => !open && closeGame()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-border bg-gradient-to-b from-slate-900 to-slate-950">
          <AnimatePresence mode="wait">
            {/* LOBBY STAGE - Oyuncu Ekleme */}
            {rouletteStage === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-4 sm:p-6 min-h-[500px] flex flex-col bg-gradient-to-b from-slate-900 to-slate-950"
              >
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-display font-bold text-foreground text-center">
                    🎲 Kader Çarkı
                  </DialogTitle>
                  <p className="text-muted-foreground text-center text-xs sm:text-sm mt-2">
                    Oyuncuları ekle ve çarkı çevir!
                  </p>
                </DialogHeader>

                {/* Oyuncu Ekleme Input */}
                <div className="flex gap-2 mb-3">
                  <Input
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPlayer();
                      }
                    }}
                    placeholder="Oyuncu adı..."
                    className="flex-1 bg-slate-800/50 border-slate-700 text-foreground placeholder:text-muted-foreground text-base"
                    autoComplete="off"
                  />
                  <Button
                    onClick={addPlayer}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preset Butonları */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button
                    onClick={() => addPreset(['Masadaki Herkes'])}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 h-9"
                  >
                    Masadaki Herkes
                  </Button>
                  <Button
                    onClick={() => addPreset(['Sadece Erkekler'])}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-blue-900/30 border-blue-700 hover:bg-blue-900/50 h-9"
                  >
                    Sadece Erkekler
                  </Button>
                  <Button
                    onClick={() => addPreset(['Sadece Kadınlar'])}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-pink-900/30 border-pink-700 hover:bg-pink-900/50 h-9"
                  >
                    Sadece Kadınlar
                  </Button>
                </div>

                {/* Oyuncu Listesi */}
                <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] max-h-[300px]">
                  {players.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Henüz oyuncu eklenmedi</p>
                      <p className="text-xs mt-1">En az 2 oyuncu ekle</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {players.map((player) => (
                          <motion.div
                            key={player}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-sm"
                          >
                            <span className="text-foreground">{player}</span>
                            <button
                              onClick={() => removePlayer(player)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Çarkı Oluştur Butonu */}
                <Button
                  onClick={startRoulette}
                  disabled={players.length < 2}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                  size="lg"
                >
                  Çarkı Oluştur 🎲
                </Button>
              </motion.div>
            )}

            {/* SPINNING STAGE - Çark Çevirme */}
            {rouletteStage === 'spinning' && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 min-h-[500px] flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-slate-950"
              >
                {/* İbre (Ok) - Üstte sabit - ▼ */}
                <div className="absolute top-8 z-30 flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      filter: [
                        'drop-shadow(0 0 15px hsl(38 92% 50% / 0.7))',
                        'drop-shadow(0 0 30px hsl(38 92% 50% / 1))',
                        'drop-shadow(0 0 15px hsl(38 92% 50% / 0.7))',
                      ],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Üçgen ok */}
                    <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[48px] border-t-amber-500" />
                  </motion.div>
                </div>

                {/* Çark - Dairesel oyuncu dizilimi */}
                <div className="relative w-[300px] h-[300px] md:w-[350px] md:h-[350px] mt-12">
                  {/* Dış halka - Glow efekti */}
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 bg-slate-900/80 shadow-[0_0_30px_hsl(38_92%_50%_/_0.3)]" />
                  
                  {/* İç çark - Dönen kısım */}
                  <motion.div
                    animate={{ rotate: rotation }}
                    transition={{
                      duration: isSpinning ? spinDuration / 1000 : 0,
                      ease: [0, 0, 0.2, 1], // Yumuşak easeOut - yavaşça durur
                    }}
                    className="absolute inset-2 rounded-full overflow-hidden"
                    style={{ transformOrigin: 'center' }}
                  >
                    {/* Segmentler - Her oyuncu için bir segment */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
                      {players.map((player, index) => {
                        const segmentAngle = 360 / players.length;
                        const startAngle = (segmentAngle * index - 90) * (Math.PI / 180);
                        const endAngle = (segmentAngle * (index + 1) - 90) * (Math.PI / 180);
                        const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                        const x1 = 150 + 150 * Math.cos(startAngle);
                        const y1 = 150 + 150 * Math.sin(startAngle);
                        const x2 = 150 + 150 * Math.cos(endAngle);
                        const y2 = 150 + 150 * Math.sin(endAngle);
                        
                        return (
                          <path
                            key={index}
                            d={`M 150 150 L ${x1} ${y1} A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={index % 2 === 0 ? 'hsl(222 47% 15%)' : 'hsl(222 47% 12%)'}
                            stroke="hsl(222 30% 25%)"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>

                    {/* Oyuncu isimleri */}
                    {players.map((player, index) => {
                      const segmentAngle = 360 / players.length;
                      const angle = (segmentAngle * index) + (segmentAngle / 2) - 90; // Dilim ortasına hizala
                      const radian = (angle * Math.PI) / 180;
                      const radius = 100;
                      const x = Math.cos(radian) * radius;
                      const y = Math.sin(radian) * radius;
                      return (
                        <motion.div
                          key={player}
                          className="absolute text-sm font-display font-semibold text-foreground whitespace-nowrap"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle + 90}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          <span className="inline-block transform -rotate-90">{player}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Merkez nokta */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500 border-4 border-slate-900 shadow-[0_0_20px_hsl(38_92%_50%_/_0.8)] z-10" />
                </div>

                {isSpinning && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-xl font-display font-bold text-amber-500"
                  >
                    Çark Dönüyor... 🎲
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* RESULT STAGE - Sonuç */}
            {rouletteStage === 'result' && winner && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 min-h-[500px] flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 to-slate-950"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="space-y-6 w-full"
                >
                  {/* Kazanan İsmi - Büyük ve vurgulu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [0.5, 1.1, 1],
                    }}
                    transition={{ 
                      delay: 0.2,
                      scale: {
                        duration: 0.6,
                        times: [0, 0.7, 1],
                      }
                    }}
                    className="relative"
                  >
                    <motion.h2
                      animate={{
                        textShadow: [
                          '0 0 20px hsl(38 92% 50% / 0.5)',
                          '0 0 40px hsl(38 92% 50% / 0.8)',
                          '0 0 20px hsl(38 92% 50% / 0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl md:text-5xl font-display font-bold text-amber-500 mb-2"
                    >
                      {winner}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl md:text-3xl font-display font-bold text-foreground"
                    >
                      SHOT ATIYOR! 🥃
                    </motion.p>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg md:text-xl text-muted-foreground font-medium mt-4"
                  >
                    {rouletteMessage}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 flex flex-col sm:flex-row gap-3"
                  >
                    <Button
                      onClick={resetRoulette}
                      variant="outline"
                      className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 h-12"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Tekrar Çevir
                    </Button>
                    <Button
                      onClick={closeGame}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Kapat
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Reaksiyon Testi Modal */}
      <Dialog open={selectedGame === 'reaction'} onOpenChange={(open) => !open && closeGame()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-border">
          {/* Ana konteyner - smooth color transition ve tıklama alanı */}
          <motion.div
            className="min-h-[400px] h-[100dvh] max-h-[600px] relative cursor-pointer select-none touch-manipulation active:scale-[0.98] transition-transform"
            animate={{
              backgroundColor:
                gameStage === 'intro'
                  ? 'hsl(var(--background))'
                  : gameStage === 'waiting'
                    ? 'hsl(0, 70%, 20%)'
                    : gameStage === 'ready'
                      ? 'hsl(142, 70%, 50%)'
                      : 'hsl(var(--background))',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={handleClick}
            style={{ pointerEvents: gameStage === 'intro' || gameStage === 'result' ? 'auto' : 'auto' }}
          >
            <AnimatePresence mode="wait">
              {/* INTRO STAGE */}
              {gameStage === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 text-center space-y-6 absolute inset-0 flex flex-col justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex justify-center"
                  >
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
                      <Icon className="h-16 w-16 text-white" />
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    <h2 className="font-display font-bold text-2xl text-foreground">Refleks Testi</h2>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Ekrana dikkatli bak. Kırmızı renk Yeşile döndüğü an ekrana dokun! Bakalım ne kadar hızlısın?
                    </p>
                  </div>

                  <Button
                    onClick={startGame}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                    size="lg"
                  >
                    Hazırım, Başla! 🚀
                  </Button>
                </motion.div>
              )}

              {/* WAITING STAGE (Red) */}
              {gameStage === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex items-center justify-center ${
                    isShaking ? 'animate-shake' : ''
                  }`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-center space-y-4 pointer-events-none"
                  >
                    <h2 className="font-display font-bold text-4xl text-white drop-shadow-lg">Bekle...</h2>
                    {earlyClickMessage && (
                      <motion.p
                        key={earlyClickMessage}
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="text-red-200 text-lg font-medium px-4"
                      >
                        {earlyClickMessage}
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* READY STAGE (Green) */}
              {gameStage === 'ready' && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="text-center space-y-4 pointer-events-none"
                  >
                    <h2 className="font-display font-bold text-5xl text-white drop-shadow-lg">TIKLA!</h2>
                  </motion.div>
                </motion.div>
              )}

              {/* RESULT STAGE */}
              {gameStage === 'result' && reactionTime !== null && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 text-center space-y-6 absolute inset-0 flex flex-col justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="space-y-4"
                  >
                    <h2 className="font-display font-bold text-2xl text-foreground">Tepki Süresi</h2>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
                      className="text-6xl font-bold text-primary"
                    >
                      {reactionTime}ms
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg text-foreground font-medium"
                    >
                      {reactionMessage}
                    </motion.p>
                  </motion.div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Tekrar Dene
                    </Button>
                    <Button
                      onClick={closeGame}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Kapat
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Klavye Delikanlısı Modal */}
      <Dialog open={selectedGame === 'keyboard'} onOpenChange={(open) => !open && closeGame()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-purple-500/50 bg-gradient-to-b from-purple-900/20 to-indigo-900/20">
          <AnimatePresence mode="wait">
            {/* INTRO STAGE */}
            {typingStage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-8 text-center space-y-6 min-h-[400px] flex flex-col justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                    <Keyboard className="h-16 w-16 text-white" />
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <h2 className="font-display font-bold text-3xl text-purple-400">⌨️ Klavye Delikanlısı</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Ekrana gelen cümleyi olabildiğince hızlı yaz! Sarhoşluk seni yavaşlatacak... 🥴
                  </p>
                </div>

                <Button
                  onClick={startTypingGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 h-12 text-base font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  size="lg"
                >
                  Başla! 🚀
                </Button>
              </motion.div>
            )}

            {/* PLAYING STAGE */}
            {typingStage === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 min-h-[400px] flex flex-col justify-center space-y-6"
              >
                {/* Hedef Metin - Renkli gösterim */}
                <motion.div
                  animate={{
                    filter: drunkEffect ? 'blur(2px)' : 'blur(0px)',
                    x: drunkEffect ? [0, 2, -2, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="p-4 rounded-xl bg-purple-900/30 border border-purple-500/30 min-h-[100px] flex items-center"
                >
                  <p className="text-lg font-mono leading-relaxed">
                    {targetSentence.split('').map((char, index) => {
                      const isTyped = index < typedText.length;
                      const isCorrect = isTyped && typedText[index].toLowerCase() === char.toLowerCase();
                      return (
                        <span
                          key={index}
                          className={`${
                            isTyped
                              ? isCorrect
                                ? 'text-green-400'
                                : 'text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </p>
                </motion.div>

                {/* Input Alanı */}
                <motion.div
                  animate={{
                    filter: drunkEffect ? 'blur(1px)' : 'blur(0px)',
                    x: drunkEffect ? [0, 3, -3, 0] : 0,
                    scale: hasError ? [1, 0.95, 1] : 1,
                    borderColor: hasError ? 'rgb(239, 68, 68)' : 'rgba(168, 85, 247, 0.5)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <Input
                    value={typedText}
                    onChange={(e) => handleTypingInput(e.target.value)}
                    placeholder="Buraya yaz..."
                    className={`w-full text-xl font-mono p-4 bg-slate-900/50 border-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500 focus-visible:border-purple-500 ${
                      hasError ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    }`}
                    autoComplete="off"
                    autoFocus
                  />
                </motion.div>

                {/* İlerleme Göstergesi */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{typedText.length} / {targetSentence.length}</span>
                    <span>{Math.floor((typedText.length / targetSentence.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(typedText.length / targetSentence.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <Button
                  onClick={closeGame}
                  variant="outline"
                  className="w-full border-purple-500/30 hover:bg-purple-500/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Vazgeç
                </Button>
              </motion.div>
            )}

            {/* RESULT STAGE */}
            {typingStage === 'result' && typingStartTime && typingEndTime && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-8 text-center space-y-6 min-h-[400px] flex flex-col justify-center"
              >
                {(() => {
                  const duration = typingEndTime - typingStartTime;
                  const result = getTypingResult(duration);
                  return (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="space-y-6"
                    >
                      {/* Süre */}
                      <div className="space-y-2">
                        <h3 className="font-display font-bold text-xl text-muted-foreground">Süren</h3>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
                          className="text-6xl font-bold text-purple-400"
                        >
                          {(duration / 1000).toFixed(1)}s
                        </motion.div>
                      </div>

                      {/* Sonuç */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <div className={`text-5xl font-display font-bold ${result.color}`}>
                          {result.level}
                        </div>
                        <div className="text-3xl">
                          {result.emoji}
                        </div>
                        <div className="text-xl font-semibold text-muted-foreground">
                          {result.promil}
                        </div>
                      </motion.div>

                      {/* Butonlar */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex gap-3 pt-4"
                      >
                        <Button
                          onClick={resetTypingGame}
                          variant="outline"
                          className="flex-1 border-purple-500/30 hover:bg-purple-500/10"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Tekrar Oyna
                        </Button>
                        <Button
                          onClick={closeGame}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Kapat
                        </Button>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Sıcak Kokteyl Modal */}
      <Dialog open={selectedGame === 'hotcocktail'} onOpenChange={(open) => !open && closeGame()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-red-500/50">
          <AnimatePresence mode="wait">
            {/* INTRO STAGE */}
            {hotCocktailStage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-8 text-center space-y-6 min-h-[400px] flex flex-col justify-center bg-gradient-to-b from-orange-900/20 to-red-900/20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                    <Flame className="h-16 w-16 text-white" />
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <h2 className="font-display font-bold text-3xl text-red-400">🔥 Sıcak Kokteyl</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Soruları cevapla ve telefonu pasla! Bomba patladığında elinde olan shot atar. Süre gizli... 💣
                  </p>
                </div>

                <Button
                  onClick={startHotCocktail}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 h-12 text-base font-semibold shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  size="lg"
                >
                  Başlat! 🚀
                </Button>
              </motion.div>
            )}

            {/* PLAYING STAGE */}
            {hotCocktailStage === 'playing' && (
              <motion.div
                key="playing"
                animate={{
                  backgroundColor: (() => {
                    const progress = timeLeft / totalTime;
                    if (progress > 0.5) {
                      return 'hsl(220, 13%, 13%)'; // Normal arka plan
                    } else if (progress > 0.25) {
                      return 'hsl(20, 50%, 20%)'; // Turuncu tonu
                    } else {
                      return 'hsl(0, 60%, 25%)'; // Kırmızı tonu
                    }
                  })(),
                }}
                transition={{ duration: 0.5 }}
                className="p-6 min-h-[500px] flex flex-col justify-center items-center space-y-8 relative overflow-hidden"
              >
                {/* Shake efekti - süre azaldıkça artar */}
                <motion.div
                  animate={{
                    x: (() => {
                      const progress = timeLeft / totalTime;
                      if (progress > 0.5) return [0, 1, -1, 0];
                      if (progress > 0.25) return [0, 3, -3, 2, -2, 0];
                      return [0, 5, -5, 4, -4, 3, -3, 0];
                    })(),
                    y: (() => {
                      const progress = timeLeft / totalTime;
                      if (progress > 0.5) return [0, 1, -1, 0];
                      if (progress > 0.25) return [0, 2, -2, 1, -1, 0];
                      return [0, 4, -4, 3, -3, 2, -2, 0];
                    })(),
                  }}
                  transition={{
                    duration: (() => {
                      const progress = timeLeft / totalTime;
                      if (progress > 0.5) return 2;
                      if (progress > 0.25) return 1;
                      return 0.5;
                    })(),
                    repeat: Infinity,
                  }}
                  className="w-full space-y-8"
                >
                  {/* Bomba/Kokteyl İkonu */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: (() => {
                        const progress = timeLeft / totalTime;
                        if (progress > 0.5) return 2;
                        if (progress > 0.25) return 1;
                        return 0.3;
                      })(),
                      repeat: Infinity,
                    }}
                    className="flex justify-center"
                  >
                    <div className="text-9xl">
                      {timeLeft / totalTime > 0.5 ? '🥤' : '💣'}
                    </div>
                  </motion.div>

                  {/* Soru Kartı */}
                  <motion.div
                    className="p-6 rounded-2xl bg-slate-900/80 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] min-h-[120px] flex items-center justify-center"
                  >
                    <p className="text-xl font-display font-semibold text-foreground text-center leading-relaxed">
                      {currentQuestion}
                    </p>
                  </motion.div>

                  {/* Sıradaki Buton */}
                  <Button
                    onClick={nextQuestion}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 h-14 text-lg font-bold shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                    size="lg"
                  >
                    Tamam → Sıradaki
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* EXPLODED STAGE */}
            {hotCocktailStage === 'exploded' && (
              <motion.div
                key="exploded"
                initial={{ backgroundColor: 'hsl(0, 60%, 25%)' }}
                animate={{ backgroundColor: 'hsl(0, 100%, 35%)' }}
                transition={{ duration: 0.3 }}
                className="p-8 min-h-[500px] flex flex-col justify-center items-center text-center space-y-8"
              >
                {/* Shake efekti - patlama */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, -10, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 0.6,
                    times: [0, 0.3, 1],
                  }}
                  className="space-y-6"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      textShadow: [
                        '0 0 30px rgba(255, 255, 255, 0.8)',
                        '0 0 60px rgba(255, 255, 255, 1)',
                        '0 0 30px rgba(255, 255, 255, 0.8)',
                      ],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-9xl"
                  >
                    💥
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-display font-black text-6xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
                  >
                    BUM!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-red-100"
                  >
                    Bomba Patladı! 🔥
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xl text-red-200"
                  >
                    Elinde patlayan shot atıyor! 🥃
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-3 w-full"
                >
                  <Button
                    onClick={() => {
                      setHotCocktailStage('intro');
                      setCurrentQuestion('');
                      setTimeLeft(0);
                      setTotalTime(0);
                    }}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-100 hover:bg-red-900/30 h-12"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tekrar Oyna
                  </Button>
                  <Button
                    onClick={closeGame}
                    className="flex-1 bg-white text-red-600 hover:bg-red-50 h-12 font-bold"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Kapat
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Minigames;

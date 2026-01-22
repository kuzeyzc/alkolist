import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Heart, MessageCircle, Send, Loader2, Bookmark, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ImageModal } from '@/components/ImageModal';
import { toast } from 'sonner';

interface DrinkCardProps {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  category: string;
  drinkName?: string;
  quantity: number;
  photoUrl?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  loggedAt: string;
  recipeIngredients?: string;
  recipeInstructions?: string;
  hasRecipe?: boolean;
  location?: string;
  promilScore?: number;
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
  cognac: '🥃',
  other: '🍾',
};

const categoryNames: Record<string, string> = {
  beer: 'Bira',
  wine: 'Şarap',
  raki: 'Rakı',
  vodka: 'Votka',
  whiskey: 'Viski',
  tequila: 'Tekila',
  gin: 'Cin',
  rum: 'Rom',
  cocktails: 'Kokteyl',
  cider: 'Elma Şarabı',
  liqueur: 'Likör',
  sake: 'Sake',
  soju: 'Soju',
  spirits: 'Distile',
  cognac: 'Konyak',
  other: 'Diğer',
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { username: string; avatar_url: string | null };
}

export const DrinkCard = ({
  id,
  userId,
  username,
  avatarUrl,
  category,
  drinkName,
  quantity,
  photoUrl,
  beforePhotoUrl,
  afterPhotoUrl,
  loggedAt,
  recipeIngredients,
  recipeInstructions,
  hasRecipe,
  location,
  promilScore,
}: DrinkCardProps) => {
  const { isDrunkMode, user } = useApp();
  const navigate = useNavigate();
  const hasBeforeAfter = beforePhotoUrl && afterPhotoUrl;
  const timeAgo = formatDistanceToNow(new Date(loggedAt), { addSuffix: true, locale: tr });
  const emoji = categoryEmojis[category] || '🍺';
  const name = categoryNames[category] || category;

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetchLikes();
    fetchCommentsCount();
    fetchSavedStatus();
  }, [id, user]);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('log_id', id);
    
    setLikesCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('log_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    }
  };

  const fetchCommentsCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('log_id', id);
    
    setCommentsCount(count || 0);
  };

  const fetchSavedStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('log_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    setIsSaved(!!data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id')
      .eq('log_id', id)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const commentsWithProfiles = data.map(c => ({
        ...c,
        profiles: profileMap.get(c.user_id),
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Beğenmek için giriş yapın');
      return;
    }

    setLoadingLike(true);
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('log_id', id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase.from('likes').insert({
          log_id: id,
          user_id: user.id,
        });
        
        // Create notification for post owner (if not own post)
        if (userId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'like',
            actor_id: user.id,
          });
        }
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Kaydetmek için giriş yapın');
      return;
    }

    setLoadingSave(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('log_id', id)
          .eq('user_id', user.id);
        
        setIsSaved(false);
        toast.success('Kaydedilenlerden çıkarıldı');
      } else {
        await supabase.from('saved_posts').insert({
          log_id: id,
          user_id: user.id,
        });
        
        setIsSaved(true);
        toast.success('Kaydedildi! 📌');
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    setLoadingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({
        log_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      // Create notification for post owner (if not own post)
      if (userId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'comment',
          actor_id: user.id,
        });
      }

      setNewComment('');
      setCommentsCount(prev => prev + 1);
      fetchComments();
      toast.success('Yorum eklendi!');
    } catch (error: any) {
      toast.error('Yorum eklenemedi');
    } finally {
      setLoadingComment(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={`p-4 flex items-center gap-3 ${isDrunkMode ? 'p-5' : ''}`}>
        <div 
          onClick={handleProfileClick}
          className={`rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all ${isDrunkMode ? 'w-14 h-14' : 'w-10 h-10'}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className={isDrunkMode ? 'text-2xl' : 'text-lg'}>👤</span>
          )}
        </div>
        <div className="flex-1">
          <p 
            onClick={handleProfileClick}
            className={`font-semibold text-foreground cursor-pointer hover:text-primary transition-colors ${isDrunkMode ? 'text-lg' : ''}`}
          >
            @{username}
          </p>
          <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>{timeAgo}</p>
          {location && (
            <div className="flex items-center gap-2 mt-2">
              {/* Venue Detail Link - Navigate to Venue Detail Page */}
              <Link
                to={`/venue/${encodeURIComponent(location)}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-105 ${isDrunkMode ? 'text-sm' : 'text-xs'} font-medium`}
                onClick={(e) => e.stopPropagation()}
                title="Mekan detaylarını gör"
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="max-w-[140px] truncate">{location}</span>
              </Link>
            </div>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full font-medium border bg-primary/10 border-primary/30 text-primary ${isDrunkMode ? 'text-base px-4 py-2' : 'text-sm'}`}>
          {emoji} {quantity}x
        </div>
      </div>

      {/* Photo(s) */}
      {hasBeforeAfter ? (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            <div 
              className="relative aspect-square overflow-hidden rounded-xl border border-border/50 cursor-zoom-in"
              onClick={() => setLightboxImage(beforePhotoUrl)}
            >
              <img
                src={beforePhotoUrl}
                alt="Önce"
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-medium ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                Önce
              </span>
            </div>
            <div 
              className="relative aspect-square overflow-hidden rounded-xl border border-border/50 cursor-zoom-in"
              onClick={() => setLightboxImage(afterPhotoUrl)}
            >
              <img
                src={afterPhotoUrl}
                alt="Sonra"
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-medium ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                Sonra
              </span>
            </div>
          </div>
        </div>
      ) : photoUrl ? (
        <div className="px-4 pb-2">
          <div 
            className="aspect-video overflow-hidden rounded-2xl border border-border/50 cursor-zoom-in"
            onClick={() => setLightboxImage(photoUrl)}
          >
            <img
              src={photoUrl}
              alt="Fotoğraf"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className={`p-4 ${isDrunkMode ? 'p-5' : ''}`}>
        <p className={`text-foreground ${isDrunkMode ? 'text-lg' : ''}`}>
          <span className={`mr-2 ${isDrunkMode ? 'text-4xl' : 'text-2xl'}`}>{emoji}</span>
          {quantity} {drinkName || name} içti{quantity > 1 ? '' : ''}
        </p>
        {promilScore && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="text-[#f59e0b] text-xs font-bold">
              Etki: {(promilScore / 100).toFixed(1)} promil
            </span>
          </div>
        )}
      </div>

      {/* Recipe Section */}
      {hasRecipe && (recipeIngredients || recipeInstructions) && (
        <div className={`px-4 ${isDrunkMode ? 'px-5' : ''}`}>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="recipe" className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
                  👨‍🍳 Tarifi Gör
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted/30 rounded-xl p-3 space-y-3 border border-border/50">
                  {recipeIngredients && (
                    <div>
                      <p className={`font-semibold text-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                        🧪 Malzemeler
                      </p>
                      <p className={`text-muted-foreground whitespace-pre-wrap ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                        {recipeIngredients}
                      </p>
                    </div>
                  )}
                  {recipeInstructions && (
                    <div>
                      <p className={`font-semibold text-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                        📋 Yapılış
                      </p>
                      <p className={`text-muted-foreground whitespace-pre-wrap ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                        {recipeInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Like, Comment & Save Actions */}
      <div className={`px-4 pb-4 flex items-center gap-4 ${isDrunkMode ? 'px-5 pb-5' : ''}`}>
        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
        >
          <Heart className={`${isDrunkMode ? 'h-6 w-6' : 'h-5 w-5'} ${isLiked ? 'fill-current' : ''}`} />
          <span className={`font-medium ${isDrunkMode ? 'text-base' : 'text-sm'}`}>{likesCount}</span>
        </button>
        
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className={isDrunkMode ? 'h-6 w-6' : 'h-5 w-5'} />
          <span className={`font-medium ${isDrunkMode ? 'text-base' : 'text-sm'}`}>{commentsCount}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={loadingSave}
          className={`flex items-center gap-1.5 transition-colors ml-auto ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
        >
          <Bookmark className={`${isDrunkMode ? 'h-6 w-6' : 'h-5 w-5'} ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`px-4 pb-4 border-t border-border/50 pt-3 ${isDrunkMode ? 'px-5 pb-5' : ''}`}>
          {comments.length > 0 && (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-semibold text-foreground">@{comment.profiles?.username || 'user'}</span>{' '}
                      <span className="text-muted-foreground">{comment.content}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user && (
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorum yaz..."
                className="flex-1 h-9 text-sm bg-muted/50 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || loadingComment}
                size="sm"
                className="h-9 px-3 rounded-xl"
              >
                {loadingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Image Modal - Fullscreen for post photos */}
      <ImageModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        mode="fullscreen"
      />
    </motion.div>
  );
};
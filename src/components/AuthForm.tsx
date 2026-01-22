import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const checkUsernameAvailable = async (name: string) => {
    if (!name.trim()) {
      setUsernameError('');
      return;
    }
    
    setCheckingUsername(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', name.toLowerCase().trim())
      .maybeSingle();
    
    if (data) {
      setUsernameError('Bu kullanıcı adı alınmış');
    } else {
      setUsernameError('');
    }
    setCheckingUsername(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Validate username format and length
    if (!value.trim()) {
      setUsernameError('');
      return;
    }
    
    if (value.length < 3 || value.length > 20) {
      setUsernameError('Kullanıcı adı 3-20 karakter arasında olmalıdır');
      return;
    }
    
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError('Kullanıcı adı sadece küçük harf, rakam ve alt çizgi (_) içerebilir');
      return;
    }
    
    // Clear error and debounce check availability
    setUsernameError('');
    const timer = setTimeout(() => {
      checkUsernameAvailable(value);
    }, 500);
    
    return () => clearTimeout(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && usernameError) {
      toast.error(usernameError);
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Hoş geldin! 🍻');
      } else {
        // Double-check username availability
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase().trim())
          .maybeSingle();
        
        if (existingUser) {
          toast.error('Bu kullanıcı adı alınmış');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username.toLowerCase().trim(),
              display_name: username,
            },
          },
        });
        if (error) throw error;
        toast.success('Hesap oluşturuldu! Haydi içmeye başla! 🎉');
      }
    } catch (error: any) {
      const message = error.message || 'Bir hata oluştu';
      if (message.includes('Invalid login credentials')) {
        toast.error('Geçersiz e-posta veya şifre');
      } else if (message.includes('Email not confirmed')) {
        toast.error('E-posta adresinizi doğrulayın');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card rounded-3xl p-6 md:p-8">
        <div className="text-center mb-8">
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            🍺
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-gradient-amber mb-2">
            İçki Günlüğü
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Tekrar hoş geldin, parti canavarı!' : 'Eğlenceye katıl!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="username" className="text-foreground">Kullanıcı Adı</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="ayyas_69"
                    className={`pl-10 bg-muted/50 border-border/50 rounded-xl ${usernameError ? 'border-red-500' : ''}`}
                    required={!isLogin}
                    minLength={3}
                    maxLength={20}
                  />
                  {checkingUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {usernameError && (
                  <p className="text-red-500 text-xs mt-1">{usernameError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <Label htmlFor="email" className="text-foreground">E-posta</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sen@ornek.com"
                className="pl-10 bg-muted/50 border-border/50 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Şifre</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-muted/50 border-border/50 rounded-xl"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || (!isLogin && !!usernameError)}
            className="w-full gradient-amber text-primary-foreground rounded-xl h-12 font-semibold text-base glow-amber"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <span className="text-primary font-semibold">
              {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
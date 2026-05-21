import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল এড্রেস লিখুন'),
  password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, resendConfirmation, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [showResend, setShowResend] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [emailForResend, setEmailForResend] = React.useState('');
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setShowResend(false);
      setLoginError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (error: any) {
      console.error('Login Error:', error);
      let message = 'লগইন ব্যর্থ হয়েছে: ভুল ইমেইল বা পাসওয়ার্ড';
      
      const isNotConfirmed = 
        error.message?.toLowerCase().includes('email not confirmed') || 
        error.message?.toLowerCase().includes('email_not_confirmed') ||
        error.error_description?.toLowerCase().includes('email not confirmed') ||
        error.code === 'email_not_confirmed';
        
      const isRateLimited = 
        error.message?.toLowerCase().includes('rate limit') || 
        error.message?.toLowerCase().includes('too many requests');

      const isInvalidCredentials = 
        error.message?.toLowerCase().includes('invalid login credentials') ||
        error.error_description?.toLowerCase().includes('invalid login credentials');

      if (isNotConfirmed) {
        message = 'আপনার ইমেইলটি এখনো ভেরিফাই করা হয়নি। দয়া করে আপনার ইমেইল চেক করুন অথবা নিচের বাটনটি ব্যবহার করে পুনরায় ভেরিফিকেশন লিঙ্ক পাঠান।\n\nডেভেলপমেন্টের জন্য সহজ উপায়: সুপারবেজ ড্যাশবোর্ডে গিয়ে Authentication -> Settings থেকে "Confirm Email" অপশনটি বন্ধ করে দিন।';
        setShowResend(true);
        setEmailForResend(data.email);
      } else if (isRateLimited) {
        message = 'ইমেইল পাঠানোর সীমা অতিক্রম করেছে (Rate Limit Exceeded)। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সুপারবেজ ড্যাশবোর্ড থেকে "Confirm Email" অপশনটি বন্ধ করে দিন।';
      } else if (isInvalidCredentials) {
        message = 'ভুল ইমেইল বা পাসওয়ার্ড দিয়েছেন। দয়া করে সঠিক তথ্য দিয়ে আবার চেষ্টা করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।';
        setShowResend(true);
        setEmailForResend(data.email);
      } else if (error.message) {
        message = 'লগইন ব্যর্থ হয়েছে: ' + error.message;
      }
      setLoginError(message);
    }
  };

  const handleResend = async () => {
    if (!emailForResend) return;
    setResending(true);
    try {
      await resendConfirmation(emailForResend);
      alert('ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে। দয়া করে আপনার ইনবক্স চেক করুন।');
      setShowResend(false);
      setLoginError(null);
    } catch (error: any) {
      setLoginError('ইমেইল পাঠাতে সমস্যা হয়েছে: ' + (error.message || 'আবার চেষ্টা করুন'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 text-slate-800 font-sans">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-200 ring-4 ring-white">
              B
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight serif italic">ম্যানেজ বিডি</CardTitle>
          <CardDescription className="text-slate-500 font-medium pt-2">
            দেশি উদ্যোক্তাদের জন্য পেশাদার ব্যবসায়িক সমাধান
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium whitespace-pre-wrap">
              {loginError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-bold">
            <Input
              label="ইমেইল এড্রেস"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="পাসওয়ার্ড"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'প্রবেশ করা হচ্ছে...' : (
                <>
                  <LogIn size={18} className="mr-2" />
                  লগইন করুন
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-medium">অথবা</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
              onClick={() => {
                loginAsGuest();
                navigate('/');
              }}
            >
              ডেমো হিসেবে ব্যবহার করুন (ভেরিফিকেশন ছাড়া)
            </Button>
            {showResend && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-800 font-medium">
                <p className="mb-2 font-bold flex items-center">
                  <span className="mr-1">⚠️</span> ইমেইল ভেরিফিকেশন প্রয়োজন
                </p>
                <p className="mb-2">আপনি কি ইমেইল পাননি? পুনরায় লিঙ্ক পাঠাতে নিচের বাটনটি চাপুন।</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-8 text-xs border-amber-300 hover:bg-amber-100 text-amber-700"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'ইমেইল পাঠানো হচ্ছে...' : 'আবার ভেরিফিকেশন ইমেইল পাঠান'}
                </Button>
                <p className="mt-2 pt-2 border-t border-amber-200 opacity-80">
                  সুপারবেজ ড্যাশবোর্ড থেকে <b>Authentication ➔ Settings ➔ Confirm Email</b> বন্ধ করে দিলে ভেরিফিকেশন লাগবে না।
                </p>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-8">
          <div className="text-sm text-center text-slate-500 font-medium">
            আপনার কি কোনো অ্যাকাউন্ট নেই?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

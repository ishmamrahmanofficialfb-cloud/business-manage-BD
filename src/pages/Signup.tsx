import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/Card';

const signupSchema = z.object({
  businessName: z.string().min(2, 'ব্যবসার নাম অন্তত ২ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল এড্রেস লিখুন'),
  password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'),
  confirmPassword: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড দুটি মিলছে না",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [signupError, setSignupError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setSignupError(null);
      setSuccessMessage(null);
      await signup(data.email, data.password, data.businessName);
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.message === 'CONFIRM_EMAIL_REQUIRED') {
        setSuccessMessage('অ্যাকাউন্ট তৈরি হয়েছে! দয়া করে আপনার ইমেইল চেক করুন এবং কনফার্ম করুন।\n\nআপনি যদি কোনো ইমেইল না পেয়ে থাকেন বা ডেভেলপমেন্টের জন্য ভেরিফিকেশন এড়াতে চান, তবে সুপারবেজ ড্যাশবোর্ডে (Authentication -> Settings) থেকে "Confirm Email" বন্ধ করে দিন।');
      } else {
        setSignupError('রেজিস্ট্রেশন ব্যর্থ হয়েছে: ' + (error.message || 'আবার চেষ্টা করুন'));
      }
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
            আজই আপনার ব্যবসা পরিচালনা শুরু করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium whitespace-pre-wrap">
              {signupError}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium whitespace-pre-wrap">
              {successMessage}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-bold">
            <Input
              label="ব্যবসার নাম"
              placeholder="যেমন: ড্রিম শপ লিমিটেড"
              {...register('businessName')}
              error={errors.businessName?.message}
            />
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
            <Input
              label="পাসওয়ার্ড নিশ্চিত করুন"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  রেজিস্ট্রেশন করুন
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-8">
          <div className="text-sm text-center text-slate-500 font-medium">
            আপনার কি আগে থেকেই অ্যাকাউন্ট আছে?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold">
              লগইন করুন
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

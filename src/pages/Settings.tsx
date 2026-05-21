import React, { useState, useEffect } from 'react';
import { 
    Store, Bell, Save, Loader2
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
    const { user, updateUser } = useAuth();

    // Business Profile States
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessEmail, setBusinessEmail] = useState('');
    const [country, setCountry] = useState('বাংলাদেশ');
    const [currency, setCurrency] = useState('টাকা (BDT)');
    const [timezone, setTimezone] = useState('UTC+6');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setBusinessName(user.businessName || '');
            setBusinessEmail(user.email || '');
            setBusinessType(localStorage.getItem(`business_type_${user.id}`) || 'খুচরা বিক্রেতা');
            setCountry(localStorage.getItem(`business_country_${user.id}`) || 'বাংলাদেশ');
            setCurrency(localStorage.getItem(`business_currency_${user.id}`) || 'টাকা (BDT)');
            setTimezone(localStorage.getItem(`business_timezone_${user.id}`) || 'UTC+6');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUser({ businessName });
            
            localStorage.setItem(`business_type_${user.id}`, businessType);
            localStorage.setItem(`business_country_${user.id}`, country);
            localStorage.setItem(`business_currency_${user.id}`, currency);
            localStorage.setItem(`business_timezone_${user.id}`, timezone);
            
            toast.success('ব্যবসার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
        } catch (error: any) {
            console.error('Failed to update business profile:', error);
            toast.error(`আপডেট করতে সমস্যা হয়েছে: ${error.message || 'Error occurred'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight italic serif">সেটিংস</h1>
                <p className="text-gray-500 font-medium tracking-tight">আপনার ও আপনার ব্যবসার প্রোফাইল এবং সেটিংস পরিচালনা করুন</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <Store size={20} className="text-indigo-600" />
                             <CardTitle className="serif italic text-xl">ব্যবসার প্রোফাইল</CardTitle>
                        </div>
                        <CardDescription>আপনার ব্যবসার সার্বজনীন তথ্য আপডেট করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 font-bold">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input 
                                label="ব্যবসার নাম" 
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="যেমন: ড্রিম শপ"
                            />
                            <Input 
                                label="ব্যবসার ধরণ" 
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value)}
                                placeholder="যেমন: ইলেকট্রনিক্স, খুচরা বিক্রেতা, ইত্যাদি"
                            />
                        </div>
                        <Input 
                            label="যোগাযোগের ইমেইল" 
                            value={businessEmail}
                            onChange={(e) => setBusinessEmail(e.target.value)}
                            placeholder="support@business.com"
                            disabled
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                             <Input 
                                 label="দেশ" 
                                 placeholder="বাংলাদেশ" 
                                 value={country} 
                                 onChange={(e) => setCountry(e.target.value)}
                             />
                             <Input 
                                 label="মুদ্রা" 
                                 placeholder="টাকা (BDT)" 
                                 value={currency} 
                                 onChange={(e) => setCurrency(e.target.value)}
                             />
                             <Input 
                                 label="টাইমজোন" 
                                 placeholder="UTC+6" 
                                 value={timezone} 
                                 onChange={(e) => setTimezone(e.target.value)}
                             />
                        </div>
                        <Button 
                            className="mt-2" 
                            disabled={isSaving}
                            onClick={handleSaveProfile}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="mr-2 animate-spin" />
                                    সংরক্ষণ করা হচ্ছে...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    পরিবর্তন সংরক্ষণ করুন
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <Bell size={20} className="text-amber-500" />
                             <CardTitle className="serif italic text-xl">নোটিফিকেশন</CardTitle>
                        </div>
                        <CardDescription>আপনি কীভাবে নোটিফিকেশন পেতে চান তা কনফিগার করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">স্বল্প স্টক এলার্ট</p>
                                <p className="text-xs text-slate-500 font-medium italic">পণ্য যখন ন্যূনতম স্টকের নিচে চলে আসবে তখন নোটিফিকেশন দিন</p>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-indigo-600 p-1 flex justify-end cursor-pointer" onClick={() => toast.success('স্টক এলার্ট সেটিংস পরিবর্তন করা হয়েছে')}>
                                <div className="h-4 w-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">দৈনিক বিক্রয়ের সারাংশ</p>
                                <p className="text-xs text-slate-500 font-medium italic">প্রতিদিন সন্ধ্যায় আজকের বিক্রয়ের একটি সারাংশ ইমেইল করুন</p>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-gray-200 p-1 flex justify-start cursor-pointer" onClick={() => toast.success('দৈনিক রিপোর্ট সেটিংস পরিবর্তন করা হয়েছে')}>
                                <div className="h-4 w-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

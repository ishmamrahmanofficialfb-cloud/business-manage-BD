import React, { useState } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, Calendar, ShoppingBag, Eye, AlertTriangle, Sparkles, CheckCircle2, XCircle, Loader2, Send, Check, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/src/components/ui/Table';
import { formatCurrency, matchCustomer } from '@/src/lib/utils';
import { Customer } from '@/src/types/index';
import { useData } from '@/src/context/DataContext';
import { sendEmail } from '@/src/lib/emailService';
import { toast } from 'sonner';

interface SendProgress {
    customerName: string;
    email: string;
    status: 'idle' | 'sending' | 'success' | 'failed';
    error?: string;
}

export default function Customers() {
    const { customers, addCustomer: saveCustomer, deleteCustomer: removeCustomer, sales, products } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [offerDetails, setOfferDetails] = useState({ subject: '', message: '' });
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [viewingHistoryCustomer, setViewingHistoryCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dynamic campaign send states
    const [promoMode, setPromoMode] = useState<'simulate' | 'real'>('simulate');
    const [sendingProgress, setSendingProgress] = useState<SendProgress[]>([]);
    const [campaignCompleted, setCampaignCompleted] = useState(false);
    const [currentSendingIndex, setCurrentSendingIndex] = useState<number | null>(null);
    const [showEmailPreviewInCompleted, setShowEmailPreviewInCompleted] = useState(false);

    const handleConfirmDelete = async () => {
        if (!deletingCustomer) return;
        setIsDeleting(true);
        try {
            await removeCustomer(deletingCustomer.id);
            toast.success('কাস্টমার সফলভাবে মুছে ফেলা হয়েছে!');
            setDeletingCustomer(null);
        } catch (error: any) {
            console.error('Failed to delete customer:', error);
            toast.error(error.message || 'কাস্টমার মুছতে সমস্যা হয়েছে');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBroadcastOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        const customersWithEmail = customers.filter(c => c.email && c.email.trim() !== '');
        
        if (customersWithEmail.length === 0) {
            toast.error('ইমেইল অ্যাড্রেস আছে এমন কোনো কাস্টমার পাওয়া যায়নি');
            return;
        }

        const initialProgress = customersWithEmail.map(c => ({
            customerName: c.name,
            email: c.email,
            status: 'idle' as const
        }));

        setSendingProgress(initialProgress);
        setIsBroadcasting(true);
        setCampaignCompleted(false);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < customersWithEmail.length; i++) {
            const customer = customersWithEmail[i];
            setCurrentSendingIndex(i);
            
            // Update status to sending
            setSendingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'sending' } : item));
            
            // Staggered simulation delay for visual rhythm
            await new Promise(resolve => setTimeout(resolve, 700));

            if (promoMode === 'simulate') {
                setSendingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
                successCount++;
            } else {
                try {
                    await sendEmail({
                        to: customer.email,
                        subject: offerDetails.subject,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                                <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                                    <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ম্যানেজ বিডি — অফার ক্যাম্পেইন</h2>
                                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">আপনার বিশ্বস্ত ডিজিটাল ব্যবসা সহযোগী</p>
                                </div>
                                <p style="font-size: 16px; color: #1e293b; line-height: 1.5; margin-bottom: 10px;">প্রিয় <strong>${customer.name}</strong>,</p>
                                <div style="padding: 20px; background: #faf5ff; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; font-size: 15px; line-height: 1.6; color: #334155;">
                                    ${offerDetails.message.replace(/\n/g, '<br/>')}
                                </div>
                                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                                    <p style="font-size: 14px; color: #64748b; margin-bottom: 5px;">অফারটি পেতে শীঘ্রই আমাদের আউটলেটে ভিজিট করুন!</p>
                                    <p style="font-size: 11px; color: #94a3b8; margin: 15px 0 0 0;">এটি একটি স্বয়ংক্রিয় বাণিজ্যিক বার্তা। ম্যানেজ বিডি সিস্টেম অ্যাপ হতে প্রেরিত।</p>
                                </div>
                            </div>
                        `
                    });
                    setSendingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
                    successCount++;
                } catch (err: any) {
                    console.error(`Failed to send promo email to ${customer.email}:`, err);
                    const errMsg = err.message || 'সার্ভার বা API চাবি ত্রুটি';
                    setSendingProgress(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'failed', error: errMsg } : item));
                    failCount++;
                }
            }
        }

        setCampaignCompleted(true);
        setCurrentSendingIndex(null);
        setIsBroadcasting(false);

        if (successCount > 0) {
            toast.success(`${successCount} জন কাস্টমারকে ক্যাম্পেইন ইমেইল পাঠানো হয়েছে!`);
        } else {
            toast.error('দুঃখিত, কোনো ইমেইল পাঠানো সম্ভব হয়নি। অনুগ্রহ করে Resend সেটিং চেক করুন।');
        }
    };

    const [isSavingCustomer, setIsSavingCustomer] = useState(false);

    const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const nameVal = (formData.get('name') as string || '').trim();
        const phoneVal = (formData.get('phone') as string || '').trim();
        const emailVal = (formData.get('email') as string || '').trim();
        const addressVal = (formData.get('address') as string || '').trim();

        if (!nameVal || !phoneVal) {
            toast.error('নাম এবং ফোন নম্বর প্রদান করা আবশ্যক');
            return;
        }

        const newCustomer: Customer = {
            id: Math.random().toString(36).substr(2, 9),
            name: nameVal,
            phone: phoneVal,
            email: emailVal,
            address: addressVal,
            totalSpent: 0,
            lastVisit: 'এইমাত্র যোগ দিয়েছেন',
        };
        
        setIsSavingCustomer(true);
        try {
            await saveCustomer(newCustomer);
            toast.success('কাস্টমার সফলভাবে যোগ করা হয়েছে!');
            setIsAdding(false);
        } catch (error: any) {
            console.error('Failed to save customer:', error);
            toast.error(error.message || 'কাস্টমার যোগ করতে সমস্যা হয়েছে');
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight italic serif">কাস্টমার</h1>
                    <p className="text-slate-500 font-medium tracking-tight">আপনার মোট {customers.length}জন কাস্টমারের তথ্য রয়েছে</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-indigo-200 text-indigo-600 font-bold" onClick={() => setShowPromoModal(true)}>
                        <Mail size={18} className="mr-2" />
                        সবাইকে অফার পাঠান
                    </Button>
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus size={18} className="mr-2" />
                        নতুন কাস্টমার
                    </Button>
                </div>
            </div>

            {showPromoModal && (
                <Card className="border-amber-200 bg-amber-50/20 overflow-hidden shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-5">
                        <div className="flex justify-between items-center">
                            <CardTitle className="serif italic flex items-center gap-2 text-amber-900">
                                <Sparkles size={20} className="text-amber-600 animate-pulse" />
                                অফার ক্যাম্পেইন মডিউল
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-amber-850 font-bold bg-amber-100/80 hover:bg-amber-200" 
                                onClick={() => {
                                    setShowPromoModal(false);
                                    setCampaignCompleted(false);
                                    setIsBroadcasting(false);
                                    setSendingProgress([]);
                                }}
                            >
                                বন্ধ করুন
                            </Button>
                        </div>
                        <CardDescription className="text-amber-800 font-medium mt-1">
                            আপনার কাস্টমারদের জন্য আকর্ষণীয় প্রমোশনাল অফার বা শপ আপডেট ইমেইলে পাঠান
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {(!isBroadcasting && !campaignCompleted) ? (
                            <form onSubmit={handleBroadcastOffer} className="space-y-6 font-bold">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-700 flex items-center gap-1.5">
                                                <Mail className="text-slate-400" size={16} />
                                                ইমেইলের বিষয় (Subject)
                                            </label>
                                            <Input 
                                                placeholder="যেমন: খুশির সংবাদ! ১০% আকর্ষণীয় মূল্যছাড় পান আজই!" 
                                                value={offerDetails.subject}
                                                onChange={(e) => setOfferDetails({...offerDetails, subject: e.target.value})}
                                                required 
                                                className="border-slate-200 bg-white"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-700 flex items-center gap-1.5">
                                                <Info className="text-slate-400" size={16} />
                                                বিস্তারিত অফার বার্তা (Message)
                                            </label>
                                            <textarea 
                                                className="w-full min-h-36 p-3 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 text-sm"
                                                placeholder="হ্যালো কাস্টমার, আপনার শুভকামনায় আমাদের শপে পাবেন দারুণ অফার..."
                                                value={offerDetails.message}
                                                onChange={(e) => setOfferDetails({...offerDetails, message: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-white/60 p-4 rounded-xl border border-amber-100 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <h4 className="text-sm text-slate-700 flex items-center gap-1.5 border-b border-rose-100 pb-1.5">
                                                <Send className="text-amber-600" size={16} />
                                                ক্যাম্পেইন গেটওয়ে এবং ডেলিভারি মোড
                                            </h4>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPromoMode('simulate')}
                                                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                                        promoMode === 'simulate'
                                                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <Sparkles size={12} className="text-indigo-600" />
                                                        সিমুলেটেড টেস্ট মোড
                                                    </span>
                                                    <span className="text-[10px] font-normal leading-normal text-slate-500 mt-2">
                                                        টেস্টিং ও ডেমো দেখাতে সম্পূর্ণ পারফেক্ট। কোনো ইমেইল পাঠানো খরচ ছাড়াই সব চেক করুন।
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPromoMode('real')}
                                                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                                        promoMode === 'real'
                                                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <Mail size={12} className="text-indigo-600" />
                                                        প্রকৃত রিয়েল মোড
                                                    </span>
                                                    <span className="text-[10px] font-normal leading-normal text-slate-500 mt-2">
                                                        সরাসরি কাস্টমারদের ইনবক্সে ইমেইল পাঠাতে। আপনার Resend API কী কনফিগার আবশ্যক।
                                                    </span>
                                                </button>
                                            </div>

                                            {promoMode === 'real' && (
                                                <div className="bg-amber-100/50 p-2.5 rounded text-[11px] text-amber-900 font-semibold flex gap-1.5 items-start">
                                                    <AlertCircle size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
                                                    <span>
                                                        দ্রষ্টব্য: রিয়েল মোডে কাজ করার জন্য AI Studio settings থেকে <code>RESEND_API_KEY</code> সেট করা থাকতে হবে।
                                                    </span>
                                                </div>
                                            )}

                                            <div className="pt-2">
                                                <p className="text-xs text-slate-500">প্রাপক কাস্টমার তালিকা:</p>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto p-1 bg-slate-100/50 rounded border border-slate-100">
                                                    {customers.filter(c => c.email && c.email.trim() !== '').map(c => (
                                                        <span key={c.id} className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                                                            <Mail size={8} /> {c.name} ({c.email})
                                                        </span>
                                                    ))}
                                                    {customers.filter(c => c.email && c.email.trim() !== '').length === 0 && (
                                                        <span className="text-[10px] text-rose-500 italic">ইমেইল যুক্ত কোনো কাস্টমার নেই! কাস্টমার প্রোফাইলে ইমেইল যোগ করুন।</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                            <Button type="button" variant="ghost" onClick={() => setShowPromoModal(false)}>বাতিল</Button>
                                            <Button 
                                                type="submit" 
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                                disabled={customers.filter(c => c.email && c.email.trim() !== '').length === 0}
                                            >
                                                <Send size={14} className="mr-1.5" />
                                                ক্যাম্পেইন শুরু করুন
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 font-bold animate-in fade-in duration-300">
                                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {campaignCompleted ? (
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 size={24} className="animate-bounce" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Loader2 size={24} className="animate-spin" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-base text-slate-800">
                                                    {campaignCompleted ? 'অফার ক্যাম্পেইন সফলভাবে সম্পন্ন হয়েছে!' : 'অফার ইমেইল পাঠানো হচ্ছে...'}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {promoMode === 'simulate' ? 'সিমুলেশন মোড সক্রিয়' : 'রিয়েল ইমেইল গেটওয়ে সক্রিয়'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 font-mono rounded-full px-2.5 py-1">
                                            {sendingProgress.filter(p => p.status === 'success' || p.status === 'failed').length} / {sendingProgress.length} প্রেরিত
                                        </span>
                                    </div>

                                    {/* Beautiful Progress Bar */}
                                    <div className="w-full bg-slate-200 rounded-full h-3 mt-4 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${campaignCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-amber-500'}`}
                                            style={{ 
                                                width: `${Math.round((sendingProgress.filter(p => p.status === 'success' || p.status === 'failed').length / sendingProgress.length) * 100)}%` 
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                                        <span>০%</span>
                                        <span>{Math.round((sendingProgress.filter(p => p.status === 'success' || p.status === 'failed').length / sendingProgress.length) * 100)}% সম্পন্ন</span>
                                        <span>১০০%</span>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>কাস্টমার</TableHead>
                                                <TableHead>ইমেইল এড্রেস</TableHead>
                                                <TableHead className="text-right">স্ট্যাটাস</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-sm">
                                            {sendingProgress.map((prog, index) => (
                                                <TableRow key={index} className={index === currentSendingIndex ? 'bg-indigo-50/40' : ''}>
                                                    <TableCell className="font-bold flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        {prog.customerName}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-slate-500 font-bold">{prog.email}</TableCell>
                                                    <TableCell className="text-right">
                                                        {prog.status === 'idle' && (
                                                            <span className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded px-2 py-0.5 inline-flex items-center gap-1">
                                                                অপেক্ষমাণ
                                                            </span>
                                                        )}
                                                        {prog.status === 'sending' && (
                                                            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded px-2 py-0.5 inline-flex items-center gap-1 animate-pulse">
                                                                <Loader2 size={10} className="animate-spin" /> পাঠানো হচ্ছে...
                                                            </span>
                                                        )}
                                                        {prog.status === 'success' && (
                                                            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 inline-flex items-center gap-1">
                                                                <Check size={10} className="stroke-[3]" /> ইনবক্সে প্রেরিত
                                                            </span>
                                                        )}
                                                        {prog.status === 'failed' && (
                                                            <span title={prog.error} className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 inline-flex items-center gap-1 hover:bg-rose-100 transition-colors cursor-help">
                                                                <XCircle size={10} /> ব্যর্থ ({prog.error?.includes('API') ? 'API কী নেই' : 'ত্রুটি'})
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {campaignCompleted && (
                                    <div className="space-y-4 border-t border-slate-100 pt-4">
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-bottom duration-500">
                                            <div className="text-emerald-950 text-sm font-bold flex items-center gap-2">
                                                <Sparkles className="text-emerald-650 animate-pulse" size={18} />
                                                <span>অভিনন্দন! আপনার অফার ক্যাম্পেইনটি সুন্দরভাবে শেষ হয়েছে।</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 font-bold text-xs"
                                                    onClick={() => setShowEmailPreviewInCompleted(!showEmailPreviewInCompleted)}
                                                >
                                                    {showEmailPreviewInCompleted ? 'প্রিভিউ লুকান' : 'প্রেরিত ইমেইল প্রিভিউ'}
                                                </Button>
                                                
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-indigo-750 bg-white hover:bg-indigo-50 border border-indigo-100 font-bold text-xs"
                                                    onClick={() => {
                                                        // Reset to rebuild another offer
                                                        setCampaignCompleted(false);
                                                        setIsBroadcasting(false);
                                                        setSendingProgress([]);
                                                    }}
                                                >
                                                    নতুন অফার লিখুন
                                                </Button>

                                                <Button 
                                                    type="button" 
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                                    onClick={() => {
                                                        setShowPromoModal(false);
                                                        setCampaignCompleted(false);
                                                        setOfferDetails({ subject: '', message: '' });
                                                    }}
                                                >
                                                    সমাপ্ত করুন
                                                </Button>
                                            </div>
                                        </div>

                                        {showEmailPreviewInCompleted && (
                                            <div className="border border-indigo-100 bg-indigo-50/10 rounded-xl p-4 space-y-2 text-left font-medium max-w-2xl mx-auto animate-in duration-300 zoom-in-95">
                                                <p className="text-xs text-slate-500 font-bold border-b border-indigo-100 pb-1 flex items-center gap-1 uppercase tracking-wider">
                                                    <Mail size={12} className="text-indigo-600" />
                                                    ইমেইল ডিজাইন টেমপ্লেট প্রিভিউ
                                                </p>
                                                <div className="bg-white border rounded-lg p-5 shadow-inner leading-relaxed text-slate-700 text-sm">
                                                    <div className="border-b border-slate-100 pb-3 mb-3">
                                                        <p className="text-xs text-slate-400">বিষয়: <span className="font-bold text-slate-800">{offerDetails.subject}</span></p>
                                                    </div>
                                                    <h3 className="text-indigo-650 font-extrabold text-base border-b-2 border-slate-100 pb-2 mb-3">ম্যানেজ বিডি — অফার ক্যাম্পেইন</h3>
                                                    <p className="mb-3">প্রিয় <strong>কাস্টমারের নাম</strong>,</p>
                                                    <div className="p-3.5 bg-purple-50/70 border-l-4 border-indigo-600 rounded text-slate-800">
                                                        {offerDetails.message.split('\n').map((line, i) => (
                                                            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                                        ))}
                                                    </div>
                                                    <div className="text-center mt-6 pt-3 border-t border-slate-100 text-xs text-slate-400">
                                                        <p>অফারটি পেতে শীঘ্রই আমাদের আউটলেটে ভিজিট করুন!</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {isAdding && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic">কাস্টমার যোগ করুন</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCustomer} className="grid gap-4 md:grid-cols-4 font-bold">
                            <Input name="name" label="পুরো নাম" placeholder="যেমন: করিম উল্লাহ" required />
                            <Input name="phone" label="ফোন নম্বর" placeholder="017..." required />
                            <Input name="email" label="ইমেইল (ঐচ্ছিক)" placeholder="customer@example.com" />
                            <Input name="address" label="ঠিকানা (ঐচ্ছিক)" placeholder="যেমন: ঢাকা, বাংলাদেশ" />
                            <div className="md:col-span-4 flex justify-end gap-2 text-sm">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSavingCustomer}>বাতিল</Button>
                                <Button type="submit" disabled={isSavingCustomer}>
                                    {isSavingCustomer ? 'সংরক্ষণ করা হচ্ছে...' : 'কাস্টমার সেভ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {viewingHistoryCustomer && (
                <Card className="border-indigo-200 bg-indigo-50/20">
                    <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between border-b border-indigo-100 gap-4">
                        <div>
                            <CardTitle className="serif italic text-indigo-900 flex items-center gap-2">
                                <ShoppingBag className="text-indigo-600" size={20} />
                                {viewingHistoryCustomer.name} এর ক্রয় ইতিহাস
                            </CardTitle>
                            <CardDescription className="text-indigo-700 font-medium">
                                ফোন: {viewingHistoryCustomer.phone} | মোট খরচ: <span className="font-mono font-bold">{formatCurrency(viewingHistoryCustomer.totalSpent)}</span>
                            </CardDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold" 
                            onClick={() => setViewingHistoryCustomer(null)}
                        >
                            বন্ধ করুন
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-indigo-50/50">
                                        <TableHead className="font-bold">অর্ডার আইডি</TableHead>
                                        <TableHead className="font-bold">আইটেম / পণ্য</TableHead>
                                        <TableHead className="font-bold text-center">পরিমাণ</TableHead>
                                        <TableHead className="font-bold text-right">মোট মূল্য</TableHead>
                                        <TableHead className="font-bold text-right">তারিখ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.filter(s => matchCustomer(viewingHistoryCustomer, s)).map((sale) => {
                                        const originalProduct = products.find(p => p.id === sale.productId);
                                        return (
                                            <TableRow key={sale.id} className="hover:bg-indigo-50/10 transition-colors">
                                                <TableCell className="font-mono text-xs text-slate-500 font-bold">{sale.id.slice(0, 8)}</TableCell>
                                                <TableCell className="font-bold text-slate-800">{originalProduct ? originalProduct.name : 'ডিলিটকৃত পণ্য'}</TableCell>
                                                <TableCell className="text-center font-bold font-mono">{sale.quantity}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-indigo-600">{formatCurrency(sale.totalPrice)}</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-slate-500 font-bold">
                                                    {new Date(sale.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {sales.filter(s => matchCustomer(viewingHistoryCustomer, s)).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-slate-400 italic font-medium">
                                                এই কাস্টমারের কোনো কেনাকাটার রেকর্ড পাওয়া যায়নি।
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {deletingCustomer && (
                <Card className="border-rose-200 bg-rose-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-rose-800 flex items-center gap-2">
                            <AlertTriangle className="text-rose-600" size={20} />
                            কাস্টমার ডিলিট সতর্কবার্তা
                        </CardTitle>
                        <CardDescription className="text-rose-700 font-bold">
                            আপনি কি নিশ্চিত যে আপনি <span className="underline">{deletingCustomer.name}</span> কাস্টমারটির প্রোফাইল মুছে ফেলতে চান?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-700 font-semibold">
                            ⚠️ সতর্কীকরণ: এই কাস্টমার প্রোফাইল স্থায়ীভাবে মুছে যাবে। আপনি কাস্টমার লিস্টে আর তার বিবরণ দেখতে পারবেন না। তবে ব্যবসার পূর্ববর্তী বিক্রয় রিপোর্ট অপরিবর্তিত থাকবে।
                        </p>
                        <div className="flex justify-end gap-2 text-sm font-bold border-t border-rose-100 pt-3">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setDeletingCustomer(null)} 
                                disabled={isDeleting}
                            >
                                বাতিল করুন
                            </Button>
                            <Button 
                                type="button" 
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold" 
                                onClick={handleConfirmDelete} 
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত মুছুন'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..." 
                            className="pl-10 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>কাস্টমার</TableHead>
                                <TableHead>যোগাযোগ</TableHead>
                                <TableHead className="text-right">মোট কেনাকাটা</TableHead>
                                <TableHead className="text-right">সর্বশেষ ভিজিট</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                {customer.name[0]}
                                            </div>
                                            <span className="font-bold text-slate-900">{customer.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Phone size={12} />
                                                {customer.phone}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Mail size={12} />
                                                {customer.email || 'ইমেইল নেই'}
                                            </div>
                                            {customer.address && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <MapPin size={12} />
                                                    {customer.address}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-indigo-600">
                                        {formatCurrency(customer.totalSpent)}
                                    </TableCell>
                                    <TableCell className="text-right text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{customer.lastVisit}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-indigo-600 font-bold px-2 py-1 flex items-center gap-1 hover:bg-indigo-50"
                                                onClick={() => {
                                                    setViewingHistoryCustomer(customer);
                                                    setDeletingCustomer(null);
                                                }}
                                            >
                                                <Eye size={14} />
                                                ইতিহাস
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700 px-2 py-1 flex items-center gap-1"
                                                onClick={() => {
                                                    setDeletingCustomer(customer);
                                                    setViewingHistoryCustomer(null);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                মুছুন
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic font-medium">
                                        কোনো কাস্টমার পাওয়া যায়নি। নতুন কাস্টমার যোগ করা শুরু করুন।
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

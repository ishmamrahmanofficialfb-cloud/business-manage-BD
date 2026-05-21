import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Calendar, User } from 'lucide-react';
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
import { formatCurrency, cn } from '@/src/lib/utils';
import { useData } from '@/src/context/DataContext';
import { Sale } from '@/src/types/index';
import { sendEmail } from '@/src/lib/emailService';
import { toast } from 'sonner';

export default function Sales() {
    const { sales, products, customers, addSale: saveSale } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);

    const handleAddSale = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const product = products.find(p => p.id === selectedProductId);
        
        if (!product) return;

        setIsProcessing(true);
        const customerName = formData.get('customer') as string;
        const customerPhone = formData.get('customerPhone') as string;
        
        const newSale: Sale = {
            id: `S-${Math.floor(1000 + Math.random() * 9000)}`,
            productId: selectedProductId,
            customerName,
            customerPhone,
            quantity: Number(quantity),
            totalPrice: product.price * Number(quantity),
            createdAt: new Date().toISOString(),
        };
        
        try {
            await saveSale(newSale);
            toast.success('বিক্রয়টি সফলভাবে রেকর্ড করা হয়েছে!');

            // Automated Email Notification
            const customer = customers.find(c => c.name === customerName && c.phone === customerPhone);
            if (customer?.email) {
                try {
                    await sendEmail({
                        to: customer.email,
                        subject: `আপনার অর্ডার নিশ্চিত করা হয়েছে - ${newSale.id}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <h2 style="color: #4f46e5;">ম্যানেজ বিডি - অর্ডার কনফার্মেশন</h2>
                                <p>প্রিয় ${customer.name},</p>
                                <p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। নিচে অর্ডারের বিবরণ দেওয়া হলো:</p>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">পূর্বের অর্ডার আইডি:</td>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${newSale.id}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">পণ্য:</td>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${product.name} x ${newSale.quantity}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">মোট মূল্য:</td>
                                        <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${formatCurrency(newSale.totalPrice)}</td>
                                    </tr>
                                </table>
                                <p style="margin-top: 20px; font-size: 14px; color: #64748b;">আমাদের সাথে থাকার জন্য ধন্যবাদ!</p>
                            </div>
                        `
                    });
                    toast.success('অটোমেটেড ইমেইল পাঠানো হয়েছে!');
                } catch (err) {
                    console.error('Failed to send automated email:', err);
                    toast.error('অটোমেটেড ইমেইল পাঠানো সম্ভব হয়নি');
                }
            }
            setIsAdding(false);
            setSelectedProductId('');
            setQuantity(1);
        } catch (error: any) {
            console.error('Failed to save sale:', error);
            toast.error(error.message || 'বিক্রয় রেকর্ড করতে সমস্যা হয়েছে');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredSales = sales.filter(s => 
        (s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getProductName = (id: string) => {
        return products.find(p => p.id === id)?.name || 'অজানা পণ্য';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight italic serif text-slate-900">বিক্রয়</h1>
                    <p className="text-slate-500 font-medium tracking-tight">আপনার প্রতিদিনের বিক্রয় এবং লেনদেন ট্র্যাক করুন</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus size={18} className="mr-2" />
                        নতুন বিক্রয়
                    </Button>
                </div>
            </div>

            {isAdding && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-xl">নতুন বিক্রয় রেকর্ড করুন</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddSale} className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">পণ্য নির্বাচন করুন</label>
                                <select 
                                    className="w-full h-10 border border-slate-200 rounded-lg px-3 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    required
                                >
                                    <option value="">পণ্য পছন্দ করুন...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                            {p.name} ({p.stock}টি স্টকে আছে)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input 
                                type="number" 
                                label="পরিমাণ" 
                                value={quantity} 
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                min="1"
                                required 
                            />
                            <Input name="customer" label="কাস্টমারের নাম" placeholder="যেমন: করিম উল্লাহ" required />
                            <Input name="customerPhone" label="কাস্টমারের ফোন (ঐচ্ছিক)" placeholder="017..." />
                            <div className="md:col-span-2 flex justify-end gap-2 items-center bg-slate-50 p-2 rounded-lg">
                                <div className="mr-auto px-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase">মোট আনুমানিক মূল্য:</span>
                                    <span className="ml-2 font-mono font-bold text-indigo-600">
                                        {formatCurrency((products.find(p => p.id === selectedProductId)?.price || 0) * quantity)}
                                    </span>
                                </div>
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>বাতিল</Button>
                                <Button type="submit" disabled={!selectedProductId || isProcessing}>
                                    {isProcessing ? 'রেকর্ড করা হচ্ছে...' : 'বিক্রয় যোগ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">মোট বিক্রয় সংখ্যা</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-slate-900">{sales.length}টি অর্ডার</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">মোট আয়</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-indigo-600">{formatCurrency(totalRevenue)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            placeholder="আইডি বা কাস্টমার দিয়ে বিক্রয় খুঁজুন..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>অর্ডার আইডি</TableHead>
                                <TableHead>পণ্য</TableHead>
                                <TableHead>কাস্টমার</TableHead>
                                <TableHead>তারিখ ও সময়</TableHead>
                                <TableHead className="text-right">মোট</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-indigo-600 font-bold text-xs">{sale.id}</TableCell>
                                    <TableCell className="font-bold text-slate-800">
                                        {getProductName(sale.productId)}
                                        <span className="ml-2 text-[10px] text-slate-400">x{sale.quantity}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                <User size={12} />
                                            </div>
                                            <span className="font-bold text-slate-900">{sale.customerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-[10px] font-bold uppercase">{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {formatCurrency(sale.totalPrice)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredSales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic font-medium">
                                        এখনো কোনো বিক্রয়ের তথ্য নেই। শুরু করতে "নতুন বিক্রয়" বাটনে ক্লিক করুন।
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

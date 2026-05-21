import React, { useState } from 'react';
import { Wallet, Plus, Search, Filter, ArrowUpRight } from 'lucide-react';
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
import { Expense } from '@/src/types/index';
import { toast } from 'sonner';

export default function Expenses() {
    const { expenses, addExpense: saveExpense, updateExpense, deleteExpense } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            category: formData.get('category') as string,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
            date: new Date().toISOString().split('T')[0],
        };

        setIsSaving(true);
        try {
            await saveExpense(newExpense);
            toast.success('খরচটি সফলভাবে রেকর্ড করা হয়েছে!');
            setIsAdding(false);
        } catch (error: any) {
            console.error('Failed to save expense:', error);
            toast.error(error.message || 'খরচ রেকর্ড করতে সমস্যা হয়েছে');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingExpense) return;

        const formData = new FormData(e.currentTarget);
        const updated: Expense = {
            ...editingExpense,
            category: formData.get('category') as string,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
        };

        setIsSaving(true);
        try {
            await updateExpense(updated);
            toast.success('খরচের বিবরণ সফলভাবে সম্পাদন করা হয়েছে!');
            setEditingExpense(null);
        } catch (error: any) {
            console.error('Failed to update expense:', error);
            toast.error(error.message || 'খরচ আপডেট করতে সমস্যা হয়েছে');
        } finally {
            setIsSaving(false);
        }
    };

    const executeDeleteExpense = async (id: string) => {
        try {
            await deleteExpense(id);
            toast.success('খরচটি সফলভাবে মুছে ফেলা হয়েছে!');
            setDeletingId(null);
        } catch (error: any) {
            console.error('Failed to delete expense:', error);
            toast.error(error.message || 'খরচ মুছতে সমস্যা হয়েছে');
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const filteredExpenses = expenses.filter(e => 
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight italic serif">খরচপাতি</h1>
                    <p className="text-slate-500 font-medium tracking-tight">আপনার ব্যবসার টাকা কোথায় খরচ হচ্ছে তার হিসাব রাখুন</p>
                </div>
                <Button variant="danger" onClick={() => { setIsAdding(true); setEditingExpense(null); }}>
                    <Plus size={18} className="mr-2" />
                    খরচ রেকর্ড করুন
                </Button>
            </div>

            {isAdding && (
                <Card className="border-rose-200 bg-rose-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-rose-800">নতুন খরচের বিবরণ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddExpense} className="grid gap-4 md:grid-cols-3 font-bold">
                            <Input name="category" label="ক্যাটাগরি" placeholder="যেমন: ভাড়া, বিদ্যুৎ বিল" required />
                            <Input name="amount" type="number" label="টাকা (৳)" placeholder="0.00" required />
                            <Input name="description" label="বিবরণ" placeholder="এই খরচটি কিসের জন্য?" required />
                            <div className="md:col-span-3 flex justify-end gap-2 text-sm">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSaving}>বাতিল</Button>
                                <Button type="submit" variant="danger" disabled={isSaving}>
                                    {isSaving ? 'রেকর্ড করা হচ্ছে...' : 'খরচ যোগ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {editingExpense && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-indigo-800">খরচের বিবরণ সম্পাদন করুন</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEditExpenseSubmit} className="grid gap-4 md:grid-cols-3 font-bold">
                            <Input name="category" label="ক্যাটাগরি" defaultValue={editingExpense.category} required />
                            <Input name="amount" type="number" label="টাকা (৳)" defaultValue={editingExpense.amount} required />
                            <Input name="description" label="বিবরণ" defaultValue={editingExpense.description} required />
                            <div className="md:col-span-3 flex justify-end gap-2 text-sm">
                                <Button type="button" variant="ghost" onClick={() => setEditingExpense(null)} disabled={isSaving}>বাতিল</Button>
                                <Button type="submit" variant="primary" disabled={isSaving}>
                                    {isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-rose-50/30 border-rose-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-widest text-rose-600 font-bold">মোট রেকর্ডকৃত খরচ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-rose-700">{formatCurrency(totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">বাজেট অবস্থা</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">সরাইয়া রাখুন</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            placeholder="ক্যাটাগরি বা বিবরণ দিয়ে খুঁজুন..." 
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
                                <TableHead>ক্যাটাগরি</TableHead>
                                <TableHead>বিবরণ</TableHead>
                                <TableHead>তারিখ</TableHead>
                                <TableHead className="text-right">পরিমাণ</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-widest">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-700 font-bold text-sm tracking-tight">{expense.description}</TableCell>
                                    <TableCell className="text-slate-500 text-[10px] font-bold font-mono uppercase">{expense.date}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-rose-600">
                                        {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            {deletingId === expense.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        className="py-1 px-2.5 h-7 text-[10px] font-bold" 
                                                        onClick={() => executeDeleteExpense(expense.id)}
                                                    >
                                                        নিশ্চিত
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="py-1 px-2 h-7 text-[10px] font-medium text-slate-500 hover:bg-slate-100" 
                                                        onClick={() => setDeletingId(null)}
                                                    >
                                                        বাতিল
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-indigo-600 font-bold hover:bg-indigo-50 hover:text-indigo-700"
                                                        onClick={() => {
                                                            setEditingExpense(expense);
                                                            setIsAdding(false);
                                                            setDeletingId(null);
                                                        }}
                                                    >
                                                        এডিট
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700"
                                                        onClick={() => {
                                                            setDeletingId(expense.id);
                                                            setEditingExpense(null);
                                                        }}
                                                    >
                                                        ডিলেট
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic font-medium">
                                        ব্যবসার কোনো খরচ পাওয়া যায়নি।
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

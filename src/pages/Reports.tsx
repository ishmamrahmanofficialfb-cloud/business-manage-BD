import React from 'react';
import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { formatCurrency } from '@/src/lib/utils';
import { useData } from '@/src/context/DataContext';

const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f97316', '#10b981'];

export default function Reports() {
    const { sales, expenses } = useData();

    const expenseByCategory = expenses.reduce((acc: any, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    const expenseBreakdown = Object.keys(expenseByCategory).map(key => ({
        name: key,
        value: expenseByCategory[key]
    }));

    // Group sales by day for a simple chart
    const salesByDay = sales.reduce((acc: any, sale) => {
        const day = new Date(sale.createdAt).toLocaleDateString('bn-BD', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + sale.totalPrice;
        return acc;
    }, {});

    const dailyPerformance = Object.keys(salesByDay).map(day => ({
        day,
        revenue: salesByDay[day],
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight italic serif">রিপোর্ট এবং এনালিটিকিক্স</h1>
                    <p className="text-gray-500 font-medium tracking-tight">আপনার ব্যবসার গ্রোথ এবং বিভিন্ন হিসাব-নিকাশ পর্যালোচনা করুন</p>
                </div>
                <div className="flex gap-3 text-sm font-bold">
                    <Button variant="outline">
                        <Download size={18} className="mr-2" />
                        পিডিএফ এক্সপোর্ট
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="serif italic text-xl">প্রতিদিনের আয়</CardTitle>
                        <CardDescription>সপ্তাহের প্রতিদিনের বিক্রয়ের হিসাব</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {dailyPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(val) => `৳${val/1000}k`}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="প্রতিদিনের আয়" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic font-medium">আয়ের কোনো তথ্য নেই।</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="serif italic">খরচের বিবরণ</CardTitle>
                        <CardDescription>আপনার টাকা কোথায় খরচ হচ্ছে</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {expenseBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenseBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic font-medium">খরচের কোনো তথ্য নেই।</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="serif italic">তথ্য ওভারভিউ</CardTitle>
                        <CardDescription>মোট হিসাবের এক ঝলক</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-[300px] space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">মোট বিক্রয় সংখ্যা</p>
                            <p className="text-2xl font-mono font-bold text-indigo-700">{sales.length}</p>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                            <p className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">মোট খরচ</p>
                            <p className="text-2xl font-mono font-bold text-rose-700">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  Wallet,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, cn } from '../lib/utils';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { sales, products, customers, expenses } = useData();

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const stats = [
    { title: 'মোট বিক্রয়', value: formatCurrency(totalRevenue), icon: ShoppingCart, trend: `${sales.length} অর্ডার`, trendUp: true },
    { title: 'ইনভেন্টরি', value: `${products.length} পণ্য`, icon: Package, trend: `${lowStockCount} স্বল্প স্টক`, trendUp: lowStockCount === 0 },
    { title: 'কাস্টমার', value: customers.length.toString(), icon: Users, trend: 'মোট সক্রিয়', trendUp: true },
    { title: 'খরচপাতি', value: formatCurrency(totalExpenses), icon: Wallet, trend: 'মোট খরচ', trendUp: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 serif italic">আপনাকে স্বাগতম!</h1>
        <p className="text-slate-500 font-medium tracking-tight">আপনার ব্যবসার সংক্ষিপ্ত বিবরণ এবং পারফরম্যান্স সামারি।</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="group hover:border-indigo-200 transition-colors cursor-default">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">{stat.value}</div>
              <p className={cn(
                "text-[10px] mt-2 flex items-center gap-1 font-bold uppercase tracking-wider",
                stat.trendUp ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full w-fit"
              )}>
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 p-2 transition-all hover:shadow-md">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="serif italic text-xl">রাজস্ব ওভারভিউ</CardTitle>
                    <CardDescription>সময়ের সাথে পারফরম্যান্সের ধরণ</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pl-2 flex items-center justify-center text-slate-400 italic font-medium">
            {sales.length > 0 ? (
                <div className="w-full text-center">
                    <p className="not-italic text-indigo-600 font-bold mb-2">বিস্তারিত তথ্য শীঘ্রই আসছে...</p>
                    <p className="text-xs">{sales.length}টি লেনদেনের ওপর ভিত্তি করে।</p>
                </div>
            ) : "এখনো কোনো বিক্রয়ের তথ্য নেই।"}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-6">
            <Card className="flex-1 bg-indigo-900 border-indigo-800 text-white p-2">
                <CardHeader>
                    <CardTitle className="text-white serif italic">সহজ কাজ</CardTitle>
                    <CardDescription className="text-indigo-200">আপনার ব্যবসা পরিচালনা শুরু করুন</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Link to="/sales">
                        <Button variant="outline" className="w-full bg-white text-indigo-900 border-white hover:bg-indigo-50 rounded-xl justify-start mb-3">
                            <Plus size={18} className="mr-2" />
                            নতুন বিক্রয় যোগ করুন
                        </Button>
                    </Link>
                    <Link to="/inventory">
                        <Button variant="outline" className="w-full bg-indigo-800 border-indigo-700 text-white hover:bg-indigo-700 rounded-xl justify-start mb-3">
                            <Package size={18} className="mr-2" />
                            নতুন পণ্য যোগ করুন
                        </Button>
                    </Link>
                    <Link to="/expenses">
                        <Button variant="outline" className="w-full bg-indigo-800 border-indigo-700 text-white hover:bg-indigo-700 rounded-xl justify-start">
                            <Wallet size={18} className="mr-2" />
                            খরচ রেকর্ড করুন
                        </Button>
                    </Link>
                </CardContent>
                <div className="p-6 pt-0 mt-auto border-t border-indigo-800/50">
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">সিস্টেম প্রস্তুত</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <CardTitle className="serif italic text-xl">সাম্প্রতিক বিক্রয় লেনদেন</CardTitle>
            <CardDescription>আপনার নতুন বিক্রয় এখানে দেখা যাবে।</CardDescription>
          </div>
          <Link to="/sales">
            <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50">সব বিক্রয় দেখুন</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
            {sales.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 tracking-widest font-bold">
                            <tr>
                                <th className="px-6 py-4">লেনদেন আইডি</th>
                                <th className="px-6 py-4">কাস্টমার</th>
                                <th className="px-6 py-4 text-right">মোট টাকা</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {sales.slice(0, 5).map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{sale.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{sale.customerName}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold font-mono text-indigo-600">{formatCurrency(sale.totalPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 italic font-medium">
                    সাম্প্রতিক কোনো লেনদেন পাওয়া যায়নি।
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

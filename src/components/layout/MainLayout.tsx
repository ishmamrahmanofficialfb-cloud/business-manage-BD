import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { 
  Menu, ShieldCheck, ShieldAlert, Sparkles, Key, Lock, 
  Mail, Smartphone, CheckCircle2, ArrowRight, Shield, Loader2 
} from 'lucide-react';
import { cn, getTOTPCode } from '@/src/lib/utils';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/src/hooks/useAuth';
import { useData } from '@/src/context/DataContext';
import { sendEmail } from '@/src/lib/emailService';
import { toast } from 'sonner';

export function MainLayout() {
  const { user, isLoading, logout } = useAuth();
  const { products } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 5));
  const notifications = [
    ...lowStockProducts.map(p => ({
      id: `stock-${p.id}`,
      type: 'warning',
      message: `${p.name} এর স্টক ফুরিয়ে যাচ্ছে! মাত্র ${p.stock} টি অবশিষ্ট রয়েছে।`,
      time: 'এইমাত্র'
    }))
  ];

  if (notifications.length === 0) {
    notifications.push({
      id: 'welcome',
      type: 'info',
      message: 'আপনার সব পণ্যের স্টক পর্যাপ্ত রয়েছে। ডাটাবেজ আপডেট করার জন্য ধন্যবাদ!',
      time: 'আজ'
    });
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-800 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-300 ease-in-out shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center shrink-0 border-b border-slate-200 bg-white px-8 transition-all">
          <div className="flex flex-1 items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">ড্যাশবোর্ড ওভারভিউ</h2>
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
            <span className="hidden sm:inline text-slate-500 text-sm italic serif">{user?.businessName || 'ম্যানেজ বিডি'}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative cursor-pointer group p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none flex items-center justify-center border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-600"
              >
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>
                )}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl py-3 z-50 font-sans transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">নোটিফিকেশনসমূহ ({notifications.length})</span>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto pt-2">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "px-4 py-2.5 hover:bg-slate-50 transition-colors flex gap-3 text-xs border-b border-slate-50 last:border-0",
                          notif.type === 'warning' ? 'bg-rose-50/10' : ''
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'warning' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 block"></span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-700 font-semibold leading-relaxed text-[11px] text-left">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 font-bold block text-left">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none text-slate-900">{user?.businessName || 'আমার ব্যবসা'}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  {user?.id === 'guest' ? 'ডেমো অ্যাকাউন্ট' : 'ব্যবসার মালিক'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold hover:border-indigo-200 transition-colors cursor-pointer">
                {(user?.businessName?.[0] || user?.email?.[0] || 'B').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


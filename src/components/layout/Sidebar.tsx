import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

const navItems = [
  { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard },
  { name: 'ইনভেন্টরি', href: '/inventory', icon: Package },
  { name: 'বিক্রয়', href: '/sales', icon: ShoppingCart },
  { name: 'কাস্টমার', href: '/customers', icon: Users },
  { name: 'খরচ', href: '/expenses', icon: Wallet },
  { name: 'রিপোর্ট', href: '/reports', icon: BarChart3 },
  { name: 'সেটিংস', href: '/settings', icon: Settings },
];

export function Sidebar({ onClose, className }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <aside className={cn("flex h-full w-64 flex-col bg-[#1E293B] border-r border-slate-800", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-1 ring-white/10">
              B
            </div>
            <span className="font-bold text-white text-lg leading-tight italic serif">ম্যানেজ বিডি</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
              isActive 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold border border-slate-600">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.businessName || 'আমার ব্যবসা'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onClose?.();
          }}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm font-semibold text-rose-400 rounded-lg hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          লগআউট
        </button>
      </div>
    </aside>
  );
}

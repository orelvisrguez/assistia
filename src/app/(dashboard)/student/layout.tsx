'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, QrCode, BookOpen, Clock, User, LogOut, Menu, X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/student', label: 'Inicio', icon: Home },
  { href: '/student/scan', label: 'Escanear', icon: QrCode, primary: true },
  { href: '/student/courses', label: 'Cursos', icon: BookOpen },
  { href: '/student/history', label: 'Historial', icon: Clock },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col">
      {/* Top Header - Mobile */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            QR Attendance
          </span>
        </div>
        <button 
          onClick={() => setShowProfile(!showProfile)}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>
      </header>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 right-4 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px]"
            >
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesion
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        <div className="px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            if (item.primary) {
              return (
                <Link key={item.href} href={item.href} className="-mt-6">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-lg opacity-50" />
                    <div className={cn(
                      "relative p-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg",
                      isActive && "ring-4 ring-indigo-200 dark:ring-indigo-800"
                    )}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </motion.div>
                </Link>
              );
            }
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors",
                    isActive 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

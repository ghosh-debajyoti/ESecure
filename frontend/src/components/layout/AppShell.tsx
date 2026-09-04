'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, FolderOpen, Zap, Settings, Hexagon } from 'lucide-react';

const navItems = [
  { name: 'Command Center', href: '/', icon: Activity },
  { name: 'Investigations', href: '/cases', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800/60 bg-slate-950 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
              <Hexagon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-wider">ESECURE-AI</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Forensics Console</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-900/80 text-indigo-400 font-medium border border-slate-800/80 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>SYS_STAT</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-500/80">ONLINE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}

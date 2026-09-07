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
  const [privacyActive, setPrivacyActive] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('aarohan_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrivacyActive(Boolean(parsed.privacyMode));
      }
    } catch (e) {}
  }, [pathname]);

  return (
    <div className="flex h-screen w-full text-foreground font-sans overflow-hidden bg-transparent">
      {/* Sidebar - Glassmorphism style */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-background/30 backdrop-blur-xl flex flex-col justify-between z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-1.5 bg-primary/20 border border-primary/30 rounded-md shadow-[0_0_12px_var(--primary)]">
              <Hexagon className="w-6 h-6 text-primary glow-primary" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-widest glow-text">ESECURE</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">Threat Forensics</p>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/10 text-white font-medium border border-primary/20 shadow-[inset_0_0_12px_rgba(0,0,0,0.2)]' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary glow-primary' : 'opacity-70 group-hover:opacity-100'}`} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/5 space-y-3 bg-background/20 backdrop-blur-md">
          {privacyActive && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold tracking-widest flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              PRIVACY MODE ACTIVE
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>SYSTEM</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-emerald-400 tracking-widest">ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent relative z-0">
        {children}
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sprout, LayoutDashboard, ClipboardList, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import ThemeToggle from './theme-toggle';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load sidebar expanded/collapsed state from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    setMounted(true);
  }, []);

  // Sync collapsed state changes to local storage
  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Case Queue', href: '/cases', icon: ClipboardList },
  ];

  // Integration variables (derived in client for simplicity)
  const isGoogleSheetsConfigured = mounted && process.env.NEXT_PUBLIC_STORAGE_MODE === 'sheets';
  const isN8NConnected = mounted && process.env.NEXT_PUBLIC_N8N_CONNECTED === 'true';

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className={`flex h-16 items-center px-4 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/" className="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Sprout className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">OLAM AGRI</span>
              <span className="text-[10px] font-semibold text-[#2E7D32] tracking-wider uppercase mt-1 leading-none">Expert Portal</span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Button inside Sidebar Header (only visible when expanded) */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCollapse}
            className="hidden lg:flex w-7 h-7 hover:bg-zinc-150 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-md cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isActive
                  ? 'bg-emerald-50 text-[#2E7D32] dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#2E7D32] dark:text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Connection Indicator Info */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isGoogleSheetsConfigured ? 'bg-emerald-500' : 'bg-blue-400'}`} title={`Storage: ${isGoogleSheetsConfigured ? 'Google Sheets' : 'Local JSON'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${isN8NConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} title={`Outbound n8n: ${isN8NConnected ? 'Active' : 'Mock Mode'}`} />
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-100/60 p-3 border border-zinc-200/40 dark:bg-zinc-900/60 dark:border-zinc-850 animate-fade-in">
            <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Integration</h4>
            <div className="space-y-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Storage:</span>
                <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${isGoogleSheetsConfigured ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                  {isGoogleSheetsConfigured ? 'Sheets' : 'JSON'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outbound:</span>
                <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${isN8NConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {isN8NConnected ? 'n8n Live' : 'Mock'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expand trigger toggle at bottom for collapsed desktop sidebar */}
      {isCollapsed && (
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 shrink-0 hidden lg:flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCollapse}
            className="w-8 h-8 rounded-md cursor-pointer hover:bg-zinc-150 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex w-full relative overflow-x-hidden">
      {/* 1. DESKTOP SIDEBAR (fixed layout on screens >= 1024px) */}
      <aside 
        className={`hidden lg:block fixed inset-y-0 left-0 bg-white border-r border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800 transition-all duration-350 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Desktop navigation sidebar"
      >
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (screens < 1024px) */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <div 
            className="relative flex w-64 max-w-xs flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-850 h-full animate-slide-in shadow-xl focus:outline-hidden"
            tabIndex={-1}
          >
            {/* Close Button Inside Drawer */}
            <div className="absolute right-3 top-3.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                aria-label="Close drawer"
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>

            {/* Sidebar content forced to show full details on mobile drawer */}
            <div className="flex-1 min-h-0">
              {React.cloneElement(sidebarContent, { 
                // Force uncollapsed inside the mobile drawer
                children: React.Children.map(sidebarContent.props.children, (child) => {
                  if (child && child.props && child.props.className && child.props.className.includes('h-16')) {
                    // Filter out collapse button inside brand header in mobile view
                    return (
                      <div className="flex h-16 items-center px-4 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
                        <Link href="/" className="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <Sprout className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">OLAM AGRI</span>
                            <span className="text-[10px] font-semibold text-[#2E7D32] tracking-wider uppercase mt-1 leading-none">Expert Portal</span>
                          </div>
                        </Link>
                      </div>
                    );
                  }
                  return child;
                }) 
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div 
        className={`flex flex-col flex-1 min-w-0 transition-all duration-350 ease-in-out ${
          mounted ? (isCollapsed ? 'lg:pl-20' : 'lg:pl-64') : 'lg:pl-64'
        }`}
      >
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer border border-zinc-200/40 dark:border-zinc-800"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Desktop Quick Header Details (Title context) */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">Olam AgriConnect</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full select-none border border-emerald-100 dark:border-emerald-900/20">POC v1.0</span>
            </div>
            
            {/* Mobile Brand Title (Only shown on mobile toolbar) */}
            <div className="flex lg:hidden items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-100 select-none">
              <Sprout className="h-4.5 w-4.5 text-[#2E7D32]" />
              <span className="text-xs font-black tracking-tight leading-none">OLAM AGRI</span>
            </div>
          </div>

          {/* Right Topbar actions */}
          <div className="flex items-center gap-3">
            {/* Dynamic system alerts indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mr-2 select-none font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Services Operational</span>
            </div>
            
            {/* Theme switcher */}
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic page container (No horizontal overflow) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

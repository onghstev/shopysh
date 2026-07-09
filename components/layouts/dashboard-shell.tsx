'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight, Bell, Bot,
  CreditCard, Megaphone, BarChart3, Search, Shield, FolderTree, KeyRound,
  UsersRound, FileBarChart, BookOpen, Presentation, ExternalLink, Code,
  Sparkles, Wallet, TrendingUp, TrendingDown, Landmark, FileText, PieChart,
  Layers, Building2, Scale, UserCheck, UserX, HardDrive, RefreshCw, CreditCard as BankCard,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: { href: string; label: string; icon: any }[];
}

interface NavGroup {
  key: string;
  label: string;
  external?: boolean;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'main',
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: FolderTree },
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/team', label: 'Team', icon: UsersRound },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    items: [
      { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    items: [
      { href: '/conversations', label: 'Conversations', icon: MessageSquare },
      { href: '/chat-widget', label: 'Chat Widget', icon: Code },
      { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { href: '/finance',                           label: 'Dashboard',           icon: Wallet },
      { href: '/finance/accounts',                  label: 'Chart of Accounts',   icon: Layers },
      { href: '/finance/journal',                   label: 'Journal Entries',     icon: BookOpen },
      { href: '/finance/sales-book',                label: 'Sales Book',          icon: TrendingUp },
      { href: '/finance/purchase-book',             label: 'Purchase Book',       icon: TrendingDown },
      { href: '/finance/cash-book',                 label: 'Cash Book',           icon: Landmark },
      { href: '/finance/bank-book',                 label: 'Bank Book',           icon: CreditCard },
      { href: '/finance/receivables',               label: 'Debtors / AR',        icon: UserCheck },
      { href: '/finance/payables',                  label: 'Creditors / AP',      icon: UserX },
      { href: '/finance/vendors',                   label: 'Vendors',             icon: Building2 },
      { href: '/finance/expenses',                   label: 'Expenses',            icon: TrendingDown },
      { href: '/finance/fixed-assets',              label: 'Fixed Assets',        icon: HardDrive },
      { href: '/finance/budget',                    label: 'Budget',              icon: PieChart },
      { href: '/finance/recurring-journals',        label: 'Recurring Journals',  icon: RefreshCw },
      { href: '/finance/bank-reconciliation',       label: 'Bank Reconciliation', icon: BankCard },
      { href: '/finance/cash-forecast',             label: 'Cash Flow Forecast',  icon: TrendingUp },
      {
        href: '/finance/reports', label: 'Reports', icon: BarChart3,
        children: [
          { href: '/finance/reports/trial-balance',    label: 'Trial Balance',    icon: Scale },
          { href: '/finance/reports/income-statement', label: 'Income Statement', icon: PieChart },
          { href: '/finance/reports/balance-sheet',    label: 'Balance Sheet',    icon: FileBarChart },
          { href: '/finance/reports/vat-summary',      label: 'VAT Summary',      icon: FileText },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    external: true,
    items: [
      { href: '/guide', label: 'User Guide', icon: BookOpen },
      { href: '/pitch', label: 'About Platform', icon: Presentation },
    ],
  },
];

export function DashboardShell({ children, session }: { children: React.ReactNode; session: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const pathname = usePathname();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // All collapsed by default; the active group is expanded via useEffect
    return { main: false, finance: false, marketing: false, communication: false, resources: false, platform: false };
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };



  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data?.notifications ?? []);
        setLowStockCount(data?.lowStockCount ?? 0);
        setUrgentCount(data?.urgentCount ?? 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Clear the dot the moment the user opens the dropdown
  useEffect(() => {
    if (notifOpen) setUrgentCount(0);
  }, [notifOpen]);

  const user = session?.user ?? {};
  const initials = `${(user?.firstName ?? user?.name?.[0] ?? 'U')?.[0] ?? 'U'}${(user?.lastName ?? '')?.[0] ?? ''}`;
  const displayName = user?.firstName ?? user?.name ?? 'User';
  const businessName = user?.tenantName ?? 'Business';

  const NavLink = ({ item, external, indent }: { item: { href: string; label: string; icon: any }; external?: boolean; indent?: boolean }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith?.(item.href));
    const linkProps = external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};
    return (
      <Link
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'group/link flex items-center gap-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative',
          indent ? 'px-3 pl-8' : 'px-3',
          isActive
            ? 'bg-white/[0.12] text-white shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
        )}
        {...linkProps}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        )}
        <item.icon className={cn(
          'w-[18px] h-[18px] shrink-0 transition-colors duration-200',
          isActive ? 'text-emerald-300' : 'text-white/60 group-hover/link:text-white'
        )} />
        {item.label}
        {external && <ExternalLink className="w-3 h-3 ml-auto opacity-40" />}
      </Link>
    );
  };

  const SubNavItem = ({ item }: { item: NavItem }) => {
    const childActive = item.children?.some(c => pathname === c.href || pathname?.startsWith?.(c.href)) ?? false;
    const parentActive = pathname === item.href;
    const [open, setOpen] = useState(childActive || parentActive);

    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full group/link flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative',
            (parentActive || childActive)
              ? 'bg-white/[0.12] text-white'
              : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
          )}
        >
          {(parentActive || childActive) && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          )}
          <item.icon className={cn(
            'w-[18px] h-[18px] shrink-0',
            (parentActive || childActive) ? 'text-emerald-300' : 'text-white/60 group-hover/link:text-white'
          )} />
          <span className="flex-1 text-left">{item.label}</span>
          {open
            ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            : <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          }
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5 border-l border-white/10 ml-[22px]">
            {item.children!.map(child => (
              <NavLink key={child.href} item={child} indent />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-[264px] sidebar-gradient transition-transform duration-300 lg:translate-x-0 flex flex-col border-r border-white/[0.06]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 backdrop-blur flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-white/10">
            <Sparkles className="w-[18px] h-[18px] text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-[13px] text-white tracking-tight">SHOPYSH</p>
            <p className="text-[11px] text-white/65 truncate">{businessName}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.key] ?? false;
            const hasActive = group.items.some((item) =>
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith?.(item.href)) ||
              item.children?.some(c => pathname === c.href || pathname?.startsWith?.(c.href))
            );
            return (
              <div key={group.key} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.08em] transition-colors duration-200',
                    hasActive ? 'text-emerald-300' : 'text-white/80 hover:text-white'
                  )}
                >
                  {group.label}
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 opacity-60" />
                    : <ChevronRight className="w-3 h-3 opacity-60" />
                  }
                </button>
                {isExpanded && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) =>
                      item.children ? (
                        <SubNavItem key={item.href} item={item} />
                      ) : (
                        <NavLink key={item.href} item={item} external={group.external} />
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="mb-1">
              <button
                onClick={() => toggleGroup('platform')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.08em] transition-colors duration-200',
                  pathname?.startsWith?.('/admin') ? 'text-emerald-300' : 'text-white/80 hover:text-white'
                )}
              >
                Platform
                {expandedGroups['platform']
                  ? <ChevronDown className="w-3 h-3 opacity-60" />
                  : <ChevronRight className="w-3 h-3 opacity-60" />
                }
              </button>
              {expandedGroups['platform'] && (
                <div className="space-y-0.5 mt-0.5">
                  <NavLink item={{ href: '/admin', label: 'Admin Panel', icon: Shield }} />
                  <NavLink item={{ href: '/admin/access-codes', label: 'Access Codes', icon: KeyRound }} />
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom user + settings */}
        <div className="px-3 py-3 border-t border-white/[0.08] space-y-1">
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
              pathname === '/settings'
                ? 'bg-white/[0.12] text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
            )}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            Settings
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-white/[0.04]">
            <Avatar className="w-8 h-8 ring-2 ring-emerald-400/20 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 text-white text-[11px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-white/60 truncate">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-[68px] border-b bg-card/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground w-[300px] border border-transparent hover:border-border/50 transition-colors cursor-pointer">
                <Search className="w-4 h-4 shrink-0 opacity-50" />
                <span className="text-sm">Search anything...</span>
                <kbd className="ml-auto text-[10px] bg-background/80 px-1.5 py-0.5 rounded font-mono text-muted-foreground/60 border">⌘K</kbd>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-muted/60">
                    <Bell className="w-[18px] h-[18px]" />
                    {urgentCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse-dot ring-2 ring-card" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto rounded-xl shadow-xl border">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-bold">Notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {urgentCount > 0 ? `${urgentCount} item${urgentCount > 1 ? 's' : ''} need attention` : 'No urgent alerts'}
                    </p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n: any) => (
                      <DropdownMenuItem key={n.id} asChild>
                        <Link href={n.href} className="flex flex-col items-start gap-1 px-4 py-3 cursor-pointer">
                          <span className="text-sm font-semibold">{n.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2.5 px-2.5 h-10 rounded-xl hover:bg-muted/60">
                    <Avatar className="w-8 h-8 ring-1 ring-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-semibold">{displayName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                  <div className="px-4 py-3">
                    <p className="text-sm font-bold">{user?.name ?? displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user?.email ?? ''}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-[1400px] page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

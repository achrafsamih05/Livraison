'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MapPin, User, LogOut, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ConnectivityBanner } from '@/components/connectivity-banner';
import { useLogout, useMe } from '@/lib/hooks';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/shipments', label: 'Shipments', icon: Package },
  { href: '/route', label: 'Route', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-primary" aria-hidden="true" />
          <span className="font-semibold">Driver</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="me-1 text-sm text-muted-foreground">{me ? me.firstName : ''}</span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      <ConnectivityBanner />

      <main id="main" className="flex-1 px-4 py-4 pb-24">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-background/95 backdrop-blur"
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

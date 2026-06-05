'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  ShieldCheck,
  ScrollText,
  LogOut,
  Menu,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { DirectionToggle } from '@/components/direction-toggle';
import { useLogout, useMe } from '@/lib/hooks';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/tenants', label: 'Tenants', icon: Building2 },
  { href: '/shipments', label: 'Shipments', icon: Package },
  { href: '/roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { href: '/audit', label: 'Audit Logs', icon: ScrollText },
] as const;

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 z-40 w-64 border-e bg-card transition-transform md:static md:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:rtl:translate-x-0',
          )}
          aria-label="Primary"
        >
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Truck className="size-6 text-primary" aria-hidden="true" />
            <span className="text-lg font-semibold">Livraison</span>
            <span className="ms-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
              Admin
            </span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        {/* Main column */}
        <div className="flex min-h-dvh flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {me ? `${me.firstName} ${me.lastName}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DirectionToggle />
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

          <main id="main" className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

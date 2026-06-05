import { redirect } from 'next/navigation';
import { requireAdmin } from '@/server/guard';
import { AppShell } from '@/components/app-shell';

/**
 * Server-side guard for the authenticated admin area: requires an active
 * session AND a platform admin role before rendering any protected UI.
 */
export default function AppLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const guard = requireAdmin();
  if (!guard.ok) {
    redirect('/login');
  }
  return <AppShell>{children}</AppShell>;
}

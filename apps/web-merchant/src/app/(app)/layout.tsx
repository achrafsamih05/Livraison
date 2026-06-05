import { redirect } from 'next/navigation';
import { readSession } from '@/server/session';
import { AppShell } from '@/components/app-shell';

/**
 * Server-side guard for the authenticated area: if the session cookie is
 * missing or malformed, redirect to login before rendering any protected UI.
 */
export default function AppLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const session = readSession();
  if (session === null) {
    redirect('/login');
  }
  return <AppShell>{children}</AppShell>;
}

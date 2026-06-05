import { redirect } from 'next/navigation';
import { isDriver, readSession } from '@/server/session';
import { AppShell } from '@/components/app-shell';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const session = readSession();
  if (session === null) {
    redirect('/login');
  }
  if (!isDriver(session.user)) {
    redirect('/login');
  }
  return <AppShell>{children}</AppShell>;
}

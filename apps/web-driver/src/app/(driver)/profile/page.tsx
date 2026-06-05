'use client';

import * as React from 'react';
import { LogOut, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout, useMe } from '@/lib/hooks';

function useDirection(): ['ltr' | 'rtl', () => void] {
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>('ltr');
  React.useEffect(() => {
    const stored = window.localStorage.getItem('lv-dir');
    const initial = stored === 'rtl' ? 'rtl' : 'ltr';
    setDir(initial);
    document.documentElement.setAttribute('dir', initial);
  }, []);
  const toggle = (): void => {
    const next = dir === 'ltr' ? 'rtl' : 'ltr';
    setDir(next);
    document.documentElement.setAttribute('dir', next);
    window.localStorage.setItem('lv-dir', next);
  };
  return [dir, toggle];
}

export default function ProfilePage(): React.JSX.Element {
  const me = useMe();
  const logout = useLogout();
  const [dir, toggleDir] = useDirection();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {me.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : me.data ? (
            <>
              <p className="font-medium">
                {me.data.firstName} {me.data.lastName}
              </p>
              <p className="text-muted-foreground">{me.data.email}</p>
              <p className="text-muted-foreground">Roles: {me.data.roles.join(', ')}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Not signed in.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggleDir}>
            <Languages className="size-4" /> Direction: {dir.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        size="lg"
        className="w-full"
        onClick={() => logout.mutate()}
        loading={logout.isPending}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}

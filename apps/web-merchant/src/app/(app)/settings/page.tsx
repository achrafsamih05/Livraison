'use client';

import * as React from 'react';
import { Moon, Sun, Languages, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function useDirection(): ['ltr' | 'rtl', (d: 'ltr' | 'rtl') => void] {
  const [dir, setDirState] = React.useState<'ltr' | 'rtl'>('ltr');
  React.useEffect(() => {
    const stored = window.localStorage.getItem('lv-dir');
    setDirState(stored === 'rtl' ? 'rtl' : 'ltr');
  }, []);
  const setDir = (d: 'ltr' | 'rtl'): void => {
    setDirState(d);
    document.documentElement.setAttribute('dir', d);
    window.localStorage.setItem('lv-dir', d);
  };
  return [dir, setDir];
}

export default function SettingsPage(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [dir, setDir] = useDirection();

  return (
    <div>
      <PageHeader title="Settings" description="Appearance and accessibility preferences." />

      <div className="grid max-w-2xl grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
            <CardDescription>Choose how the portal looks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              <Sun className="size-4" /> Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              <Moon className="size-4" /> Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
            >
              <Monitor className="size-4" /> System
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading direction</CardTitle>
            <CardDescription>
              Switch between left-to-right and right-to-left layouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={dir === 'ltr' ? 'default' : 'outline'} onClick={() => setDir('ltr')}>
              <Languages className="size-4" /> LTR
            </Button>
            <Button variant={dir === 'rtl' ? 'default' : 'outline'} onClick={() => setDir('rtl')}>
              <Languages className="size-4" /> RTL
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

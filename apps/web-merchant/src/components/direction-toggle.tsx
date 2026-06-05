'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Toggles document direction between LTR and RTL by setting the `dir`
 * attribute on <html>. All components use logical properties (start/end), so
 * the layout mirrors automatically. The choice is persisted to localStorage.
 */
export function DirectionToggle(): React.JSX.Element {
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

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle reading direction" onClick={toggle}>
      <Languages className="size-5" />
    </Button>
  );
}

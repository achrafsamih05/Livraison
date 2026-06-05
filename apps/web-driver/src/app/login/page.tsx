'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/schemas';
import { useLogin } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage(): React.JSX.Element {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="size-7 text-primary" aria-hidden="true" />
              <span className="text-xl font-semibold">Driver sign in</span>
            </div>
            <CardTitle className="text-base font-normal text-muted-foreground">
              Sign in to manage your deliveries.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit((v) => login.mutate(v))} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email ? (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                {errors.password ? (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

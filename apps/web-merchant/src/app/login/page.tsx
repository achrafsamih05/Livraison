'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/schemas';
import { useLogin } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { ThemeToggle } from '@/components/theme-toggle';
import { DirectionToggle } from '@/components/direction-toggle';

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
      <div className="flex items-center justify-end gap-1 p-4">
        <DirectionToggle />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="size-7 text-primary" aria-hidden="true" />
              <span className="text-xl font-semibold">Livraison</span>
            </div>
            <CardTitle>Sign in to your merchant account</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => login.mutate(values))}
              noValidate
            >
              <FormField
                label="Email"
                required
                error={errors.email?.message}
                render={(p) => (
                  <Input
                    {...p}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                )}
              />
              <FormField
                label="Password"
                required
                error={errors.password?.message}
                render={(p) => (
                  <Input
                    {...p}
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                )}
              />
              <Button type="submit" className="w-full" loading={login.isPending}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

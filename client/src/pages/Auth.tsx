import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp, resetPassword } from '@/lib/auth';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type AuthForm = z.infer<typeof authSchema>;

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthForm) => {
    try {
      if (mode === 'login') {
        await signIn(data.email, data.password);
        setLocation('/');
      } else if (mode === 'register') {
        await signUp(data.email, data.password);
        setLocation('/');
      } else if (mode === 'reset') {
        await resetPassword(data.email);
        toast({
          title: 'Password reset email sent',
          description: 'Check your email for further instructions',
        });
        setMode('login');
      }
    } catch (error: any) {
      // Format the error message to replace Firebase with Authentication
      const formattedMessage = error.message.replace('Firebase:', 'Authentication');
      console.log(formattedMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: formattedMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode !== 'reset' && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full">
                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            {mode === 'login' ? (
              <>
                <Button variant="link" onClick={() => setMode('register')}>
                  Need an account? Sign up
                </Button>
                <Button variant="link" onClick={() => setMode('reset')}>
                  Forgot password?
                </Button>
              </>
            ) : (
              <Button variant="link" onClick={() => setMode('login')}>
                Already have an account? Sign in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

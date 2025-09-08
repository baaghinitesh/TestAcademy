'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface LoginFormProps {
  mode?: 'signin' | 'signup';
}

export function LoginForm({ mode = 'signin' }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'student' | 'admin',
    class: 5
  });

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      
      if (mode === 'signin') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        // Redirect based on role - will be handled by the auth context
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'class' ? parseInt(value) : value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center">
            <GraduationCap className="h-12 w-12 text-primary" />
            <span className="ml-2 text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              EduLMS
            </span>
          </div>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'signin' 
                ? 'Sign in to your account to continue' 
                : 'Create an account to get started'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <div>
                    <Label htmlFor="name" className="block text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role" className="block text-sm font-medium">
                      Role
                    </Label>
                    <div className="mt-1">
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  {formData.role === 'student' && (
                    <div>
                      <Label htmlFor="class" className="block text-sm font-medium">
                        Class
                      </Label>
                      <div className="mt-1">
                        <select
                          id="class"
                          name="class"
                          value={formData.class}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {[5, 6, 7, 8, 9, 10].map(cls => (
                            <option key={cls} value={cls}>Class {cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/15 p-3">
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <Link
                    href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </Link>
                </p>
              </div>

              {mode === 'signin' && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h3 className="font-medium text-sm mb-2">Demo Accounts:</h3>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Admin: baaghinitesh@gmail.com / admin123</div>
                    <div>Student: student@example.com / student123</div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
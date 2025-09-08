import { LoginForm } from '@/components/login-form';

export const metadata = {
  title: 'Sign In - EduLMS',
  description: 'Sign in to your Learning Management System account'
};

export default function SignInPage() {
  return <LoginForm mode="signin" />;
}
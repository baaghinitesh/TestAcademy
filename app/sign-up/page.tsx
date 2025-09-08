import { LoginForm } from '@/components/login-form';

export const metadata = {
  title: 'Sign Up - EduLMS',
  description: 'Create your Learning Management System account'
};

export default function SignUpPage() {
  return <LoginForm mode="signup" />;
}
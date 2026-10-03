import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';

export default function Login() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = roleParam === 'student' ? 'student' : 'teacher';

  return (
    <AuthLayout role={role}>
      <AuthCard initialRole={role} />
    </AuthLayout>
  );
}

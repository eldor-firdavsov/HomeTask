import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';

export default function StudentLogin() {
  return (
    <AuthLayout role="student">
      <AuthCard initialRole="student" />
    </AuthLayout>
  );
}

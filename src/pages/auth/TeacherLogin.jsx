import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';

export default function TeacherLogin() {
  return (
    <AuthLayout role="teacher">
      <AuthCard initialRole="teacher" />
    </AuthLayout>
  );
}

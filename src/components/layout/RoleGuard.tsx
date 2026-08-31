import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Redirect to default home for current role
    if (currentUser.role === 'student') {
      return <Navigate to="/student/home" replace />;
    } else if (currentUser.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

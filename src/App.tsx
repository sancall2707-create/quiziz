import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RoleGuard } from './components/layout/RoleGuard';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { StudentHome } from './components/student/StudentHome';
import { AdventureMap } from './components/student/AdventureMap';
import { MissionPage } from './components/student/MissionPage';
import { CodingStudio } from './components/student/CodingStudio';
import { CollectionPage } from './components/student/CollectionPage';
import { ProfilePage } from './components/student/ProfilePage';
import { LeaderboardPage } from './components/student/LeaderboardPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9ff] gap-4">
    <div className="w-14 h-14 border-4 border-[#adc6ff] border-t-[#0058be] rounded-full animate-spin" />
    <p className="text-sm font-bold text-[#0058be]">Memeriksa sesi CodeNusa...</p>
  </div>
);

const AuthErrorScreen: React.FC<{ error: string }> = ({ error }) => {
  const { logout } = useApp();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9ff] p-6 gap-4">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-red-200 shadow-xl p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
        <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-gray-900">Sesi Bermasalah</h2>
        <p className="text-sm text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => logout()}
          className="w-full py-3 bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-extrabold rounded-full shadow-md transition-all"
        >
          Kembali ke Halaman Masuk
        </button>
      </div>
    </div>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen bg-[#f9f9ff] text-[#191b23] flex ${
        currentUser.settings?.dyslexicFont ? 'font-mono' : 'font-body'
      }`}
    >
      {/* Enforced Change Password Modal on First Login */}
      <ChangePasswordModal />

      {/* Sidebar for Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/student/home" replace />;
};

const AppRoutes: React.FC = () => {
  const { authLoading, authError, isAuthenticated } = useApp();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (authError && !isAuthenticated) {
    return <AuthErrorScreen error={authError} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Student Routes */}
        <Route
          path="/student/home"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentHome />
            </RoleGuard>
          }
        />
        <Route
          path="/student/adventure"
          element={
            <RoleGuard allowedRoles={['student']}>
              <AdventureMap />
            </RoleGuard>
          }
        />
        <Route
          path="/student/mission/:missionId"
          element={
            <RoleGuard allowedRoles={['student']}>
              <MissionPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/studio"
          element={
            <RoleGuard allowedRoles={['student']}>
              <CodingStudio />
            </RoleGuard>
          }
        />
        <Route
          path="/student/leaderboard"
          element={
            <RoleGuard allowedRoles={['student', 'teacher', 'admin']}>
              <LeaderboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/collection"
          element={
            <RoleGuard allowedRoles={['student']}>
              <CollectionPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/profile"
          element={
            <RoleGuard allowedRoles={['student', 'teacher', 'admin']}>
              <ProfilePage />
            </RoleGuard>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </RoleGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

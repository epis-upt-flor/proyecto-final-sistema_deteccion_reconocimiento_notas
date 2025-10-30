import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import SheetMusicLibrary from './pages/SheetMusicLibrary/SheetMusicLibrary';
import UploadSheet from './pages/UploadSheet/UploadSheet';
import SheetMusicDetail from './pages/SheetMusicDetail/SheetMusicDetail';
import PracticeView from './pages/PracticeView/PracticeView';
import SessionResult from './pages/SessionResult/SessionResult';
import HistoryAndReports from './pages/HistoryAndReports/HistoryAndReports';
import SessionCompare from './pages/SessionCompare/SessionCompare';
import UserProfile from './pages/UserProfile/UserProfile';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Login from './pages/Login/Login';
import Landing from './pages/Landing/Landing';
import Reconocimiento from './pages/Reconocimiento/Reconocimiento';
import PracticeSetup from './pages/PracticeSetup/PracticeSetup';
import SectionPractice from './pages/SectionPractice/SectionPractice';
import SessionDetail from './pages/SessionDetail/SessionDetail';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Estado global para la navegación
export interface NavigationState {
  currentPage: string;
  selectedSheetId: number | null;
  selectedSessionId: number | null;
  previousPage: string;
}

// Contexto de autenticación
export const AuthContext = React.createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('auth_token');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Componente para el layout de la aplicación
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  
  const getCurrentPageFromPath = (pathname: string): string => {
    const path = pathname.replace('/app/', '');
    if (path === '' || path === 'dashboard') return 'dashboard';
    return path;
  };
  
  const currentPage = getCurrentPageFromPath(location.pathname);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  // Handlers para las props requeridas
  const handleSelectSheet = (sheetId: number) => {
    console.log('Sheet selected:', sheetId);
  };
  
  const handleUploadSheet = () => {
    console.log('Upload sheet triggered');
    window.location.href = '/app/upload';
  };
  
  const handlePractice = () => {
    console.log('Practice triggered');
  };
  
  const handleBack = () => {
    console.log('Go back');
    window.history.back();
  };
  
  return (
    <div className="app-layout">
      <Sidebar 
        collapsed={sidebarCollapsed}
        currentPage={currentPage}
        onNavigate={() => {}}
        onToggle={toggleSidebar}
      />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          onToggleSidebar={toggleSidebar}
          currentPage={currentPage}
          onNavigate={() => {}}
          onGoBack={() => window.history.back()}
          showBackButton={currentPage !== 'dashboard'}
        />
        <main className="content-area">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route 
              path="library" 
              element={
                <SheetMusicLibrary 
                  onSelectSheet={handleSelectSheet}
                  onUploadSheet={handleUploadSheet}
                />
              } 
            />
            <Route path="upload" element={<UploadSheet />} />
            <Route 
              path="detail/:sheetId" 
              element={
                <SheetMusicDetail 
                  sheetId={null}
                  onPractice={handlePractice}
                  onBack={handleBack}
                />
              } 
            />
            <Route path="practice/:sheetId" element={<PracticeView />} />
            <Route path="result/:sessionId" element={<SessionResult />} />
            <Route path="history" element={<HistoryAndReports />} />
            
            {/* ✅ RUTA DE DETALLE DE SESIÓN */}
            <Route path="session-detail/:sessionId" element={<SessionDetail />} />
            
            <Route path="compare" element={<SessionCompare />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="reconocimiento/:sheetId" element={<Reconocimiento />} />
            
            <Route
              path="practice-setup/:sheetMusicId"
              element={
                <ProtectedRoute>
                  <PracticeSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="section-practice/:sheetMusicId"
              element={
                <ProtectedRoute>
                  <SectionPractice />
                </ProtectedRoute>
              }
            />
            
            <Route path="" element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('auth_token');
  });
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
    };
    
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const login = () => setIsAuthenticated(true);
  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/app/*" element={
            isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
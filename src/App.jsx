import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in React component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-100 text-red-800 p-4">
          <div className="neo-card p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
            <p className="mb-4">The application encountered an error during rendering.</p>
            {this.state.error && (
              <div className="bg-red-200 p-3 rounded-md text-sm text-left whitespace-pre-wrap">
                <strong>Error Message:</strong> {this.state.error.message}
              </div>
            )}
            <button
              className="neo-button mt-6"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    console.log("App component loaded successfully.");
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-neo-background text-neo-foreground overflow-hidden">
                  <Sidebar isOpen={isSidebarOpen} />
                  <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                    <Header toggleSidebar={toggleSidebar} />
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/create" element={<CreatePage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
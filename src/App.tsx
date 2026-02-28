import React, { useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import CalendarPage from './pages/CalendarPage';
import LibraryPage from './pages/LibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import LoginPage from './pages/LoginPage'; // Import LoginPage
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<any, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in React component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center h-screen bg-red-100 text-red-800 p-4">
          <div className="neo-card p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
            <p className="mb-4">The application encountered an error during rendering.</p>
            {this.state.error && (
              <div className="bg-red-200 p-3 rounded-md text-sm text-left whitespace-pre-wrap">
                <strong>Error Message:</strong> {this.state.error.message}
                <br />
                {/* You might want to hide stack traces in production */}
                {/* <strong>Stack:</strong> {this.state.error.stack} */}
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

    return this.props.children as ReactNode; // Explicitly cast children to ReactNode
  }
}

const App: React.FC = () => {
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
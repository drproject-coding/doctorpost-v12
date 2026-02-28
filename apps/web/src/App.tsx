import React, { useState } from 'react';

// Import pages
import DashboardPage from './pages/DashboardPage';
import CreatePostPage from './pages/CreatePostPage';
import LibraryPage from './pages/LibraryPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Simple Router Component
const Router = ({ currentPage }: { currentPage: string }) => {
  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'create':
      return <CreatePostPage />;
    case 'library':
      return <LibraryPage />;
    case 'calendar':
      return <CalendarPage />;
    case 'analytics':
      return <AnalyticsPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />; // Default to dashboard
  }
};

const NavLink = ({
  page,
  currentPage,
  setCurrentPage,
  children,
}: {
  page: string;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
}) => {
  const isActive = currentPage === page;
  const classes = isActive
    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentPage(page);
      }}
      className={`${classes} px-3 py-2 rounded-md text-sm font-medium`}
    >
      {children}
    </a>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const navItems = [
    { name: 'Dashboard', path: 'dashboard' },
    { name: 'Create Post', path: 'create' },
    { name: 'Library', path: 'library' },
    { name: 'Calendar', path: 'calendar' },
    { name: 'Analytics', path: 'analytics' },
    { name: 'Settings', path: 'settings' },
  ];

  return (
    <div className="min-h-screen">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage('dashboard');
                }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                DoctorPost
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    page={item.path}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Router currentPage={currentPage} />
      </main>
    </div>
  );
}
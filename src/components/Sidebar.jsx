import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Calendar, BookOpen, BarChart2, Settings, Zap } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Overview & quick actions' },
    { path: '/create', icon: Plus, label: 'Create Post', description: 'Generate new content' },
    { path: '/calendar', icon: Calendar, label: 'Calendar', description: 'Schedule & manage posts' },
    { path: '/library', icon: BookOpen, label: 'Library', description: 'Saved & draft content' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics', description: 'Performance insights' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Brand & preferences' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-neo-background border-r border-neo-border transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '256px' }}>
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="bg-purple-electric p-2 rounded-neo border-neo border-neo-border mr-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-neo-foreground">DoctorPost</h1>
        </div>
        
        <nav className="space-y-2">
          {navItems.map(({ path, icon: Icon, label, description }) => (
            <Link
              key={path}
              to={path}
              className={`group flex items-start p-3 rounded-neo border-neo border-neo-border transition-colors duration-200 ${
                location.pathname === path
                  ? 'bg-purple-electric text-white shadow-neo'
                  : 'bg-gray-50 text-neo-foreground hover:bg-purple-electric hover:text-white hover:shadow-neo-hover'
              }`}
            >
              <Icon size={20} className="mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-sm">{label}</div>
                <div className={`text-xs ${location.pathname === path ? 'text-purple-100' : 'text-gray-500 group-hover:text-purple-100'}`}>
                  {description}
                </div>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
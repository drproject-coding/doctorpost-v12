import React from 'react';
import { useRouter } from 'next/router';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  PenSquare, 
  Calendar, 
  FolderLibrary, 
  BarChart, 
  Settings, 
  Menu, 
  X
} from 'lucide-react';
import Image from 'next/image';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => (
  <Link 
    href={href}
    className={`flex items-center space-x-3 px-4 py-3 rounded-neo-border-radius ${
      isActive 
        ? 'bg-neo-accent text-neo-foreground shadow-neo border-neo-border-width border-neo-border' 
        : 'text-neo-foreground/80 hover:text-neo-foreground hover:bg-neo-background/80'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { 
      className: `w-5 h-5 ${isActive ? 'text-neo-foreground' : 'text-neo-foreground/70'}`
    })}
    <span className="font-medium">{label}</span>
  </Link>
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/create', icon: <PenSquare />, label: 'Create Post' },
    { href: '/calendar', icon: <Calendar />, label: 'Calendar' },
    { href: '/library', icon: <FolderLibrary />, label: 'Library' },
    { href: '/analytics', icon: <BarChart />, label: 'Analytics' },
    { href: '/settings', icon: <Settings />, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-neo-background/30">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-neo-card p-4 border-r border-neo-border transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neo-accent rounded-neo-border-radius flex items-center justify-center">
              <span className="text-neo-foreground font-bold">DP</span>
            </div>
            <span className="text-lg font-bold text-neo-foreground">DoctorPost</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-neo-foreground/80 hover:text-neo-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 border-r border-neo-border bg-neo-card">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6 px-4">
            <div className="w-8 h-8 bg-neo-accent rounded-neo-border-radius flex items-center justify-center">
              <span className="text-neo-foreground font-bold">DP</span>
            </div>
            <span className="text-lg font-bold text-neo-foreground">DoctorPost</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between border-b border-neo-border bg-neo-card p-4 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neo-accent rounded-neo-border-radius flex items-center justify-center">
              <span className="text-neo-foreground font-bold">DP</span>
            </div>
            <span className="text-lg font-bold text-neo-foreground">DoctorPost</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-neo-foreground/80 hover:text-neo-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        {/* Page content */}
        <main className="bg-neo-background/30 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Book,
  BarChart2,
  Settings,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      description: "Overview & metrics",
    },
    {
      name: "Create",
      path: "/create",
      icon: <PenSquare size={20} />,
      description: "Generate new posts",
    },
    {
      name: "Calendar",
      path: "/calendar",
      icon: <Calendar size={20} />,
      description: "Schedule & plan",
    },
    {
      name: "Library",
      path: "/library",
      icon: <Book size={20} />,
      description: "Saved content",
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart2 size={20} />,
      description: "Performance data",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
      description: "Account & preferences",
    },
  ];

  return (
    <aside
      className={`neo-sidebar fixed h-full transition-all duration-300 overflow-hidden ${
        isOpen ? "w-64" : "w-0"
      }`}
    >
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="bg-purple-electric rounded-neo border-neo border-neo-border w-10 h-10 flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h1 className="text-xl font-bold text-charcoal-black">DoctorPost</h1>
        </div>

        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `neo-sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-6">
        <div className="neo-card p-4">
          <p className="text-sm font-bold text-charcoal-black">Free Plan</p>
          <p className="text-xs text-gray-700 mt-1">10 posts/month</p>
          <button className="mt-3 text-xs text-purple-electric font-bold">
            Upgrade Plan &#x2192;
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Settings,
  Home,
  Briefcase,
  Layers,
  Users,
  Activity,
  BarChart3,
  IndianRupee,
  Calendar,
  UserCheck,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(3); // Decorative badge
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = React.useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [role, setRole] = React.useState(
    (localStorage.getItem("role") || "worker").trim().toLowerCase()
  );

  React.useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setRole((localStorage.getItem("role") || "worker").trim().toLowerCase());
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  const displayRole = role === "worker" ? "Workforce" : role;

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebarCollapsed", String(nextState));
  };

  const navItems = [
    // { name: "Dashboard", path: "/", roles: ["admin", "worker"], icon: Home },
    { name: "Configuration", path: "/admin", roles: ["admin"], icon: Settings },
    { name: "Bookings", path: "/bookings", roles: ["admin"], icon: Briefcase },
    { name: "Service", path: "/service", roles: ["admin"], icon: Layers },
    { name: "Manpower", path: "/manpower", roles: ["admin"], icon: Users },
    { name: "Job Assignment", path: "/slot", roles: ["admin", "worker"], icon: Activity },
    { name: "Cost Wise Report", path: "/report", roles: ["admin"], icon: BarChart3 },
    { name: "Service Cost Setting", path: "/servicecost", roles: ["admin"], icon: IndianRupee },
    { name: "Notifications", path: "/notifications", roles: ["admin"], icon: Bell },
    { name: "Leave Management", path: "/leave", roles: ["worker"], icon: Calendar },
    { name: "Work Calendar", path: "/calendar", roles: ["admin"], icon: Calendar },
    { name: "Customer", path: "/customer", roles: ["admin"], icon: UserCheck },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(role)
  );

  const getActivePageName = () => {
    const activeItem = navItems.find(item => item.path === location.pathname);
    return activeItem ? activeItem.name : "AMC Scheduling";
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close mobile drawer when route changes
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Desktop: Collapsible, Mobile: Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm ${isCollapsed ? "lg:w-20" : "lg:w-64"
          } ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Sidebar Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/60 bg-gray-50/20">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden truncate"
            onClick={() => navigate("/")}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <img
                src={logo}
                alt="CMTI Logo"
                className="h-5 w-5 object-contain filter brightness-0 invert"
              />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-gray-800 leading-tight">CMTI Scheduler</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Enterprise</span>
              </div>
            )}
          </div>

          {/* Collapse sidebar button (inside header for expanded desktop, or X button on mobile) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isSidebarCollapsedDesktop = isCollapsed && !isMobileOpen;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsedDesktop ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {(!isSidebarCollapsedDesktop) && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer User Card */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                {displayRole.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-gray-800 truncate capitalize">{displayRole}</p>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full h-8 flex items-center justify-center gap-2 rounded-lg text-xs font-bold bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-100 text-gray-600 transition-colors"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* SLIM TOP HEADER BAR */}
      <header
        className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 transition-all duration-300 ${isCollapsed ? "lg:left-20" : "lg:left-64"
          } left-0`}
      >
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Hamburger Toggle */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 border border-gray-200"
          >
            <Menu size={18} />
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 border border-gray-200"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Page Title */}
          <span className="text-base font-bold text-gray-800 tracking-tight ml-2 select-none">
            {getActivePageName()}
          </span>
        </div>

        {/* Right Header Tray */}
        <div className="flex items-center gap-4">

          {/* Notifications */}
          <NavLink
            to="/notifications"
            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200/50 transition-colors"
          >
            <Bell size={18} />
          </NavLink>

          {/* Profile Settings Dropdown */}
          <div className="relative user-dropdown">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 border border-gray-200/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {displayRole.charAt(0).toUpperCase()}
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 mr-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-scale-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Access Profile</p>
                  <p className="text-sm font-bold text-gray-800 capitalize mt-0.5">{displayRole}</p>
                </div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={14} /> Profile settings
                </button>
                <button
                  onClick={() => {
                    navigate("/settings");
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} /> Preferences
                </button>
                <div className="border-t border-gray-100 pt-1.5 mt-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default Navbar;
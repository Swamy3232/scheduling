import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Bell, LogOut, User, ChevronDown, Settings } from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(); // Example count
  const [scrolled, setScrolled] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = React.useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [role, setRole] = React.useState(
    (localStorage.getItem("role") || "worker").trim().toLowerCase()
  );

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setRole((localStorage.getItem("role") || "worker").trim().toLowerCase());
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const navItems = [
    { name: "Admin", path: "/admin", roles: ["admin"] },
    { name: "Bookings", path: "/bookings", roles: ["admin"] },
    { name: "Service", path: "/service", roles: ["admin"] },
    { name: "Manpower", path: "/manpower", roles: ["admin"] },
    { name: "Job Assignment", path: "/slot", roles: ["admin", "worker"] },
    { name: "Cost Wise Report", path: "/report", roles: ["admin"] },
    { name: "Service Cost Setting", path: "/servicecost", roles: ["admin"] },
    { name: "Notifications", path: "/notifications", roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(role)
  );

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/95 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border-b border-gray-200/60" 
        : "bg-white/90 backdrop-blur-lg border-b border-gray-200/40"
    }`}>
      <div className="max-w-8xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* LEFT SIDE - Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl group-hover:from-blue-700 group-hover:to-blue-900 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-105">
                <img 
                  src={logo} 
                  alt="CMTI Logo" 
                  className="h-8 w-8 object-contain filter brightness-0 invert transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-all duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight">
                AMC Scheduling
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-wide">
                Maintenance System
              </span>
            </div>
          </div>

          {/* CENTER - Navigation Items (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 mx-8 flex-grow justify-center">
            {isLoggedIn && filteredNavItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 border-2
                   ${
                     isActive
                       ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-500/20 scale-105"
                       : "text-gray-600 hover:bg-gray-50/80 border-transparent hover:border-gray-200/60 hover:text-gray-900"
                   }`
                }
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {item.name}
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-blue-500 rounded-full"></div>
                )}
              </NavLink>
            ))}
          </div>

          {/* RIGHT SIDE - User Actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <NavLink
                    to="/notifications"
                    className="relative p-2.5 rounded-xl text-gray-600 hover:text-blue-600 bg-white/50 hover:bg-blue-50/80 border-2 border-transparent hover:border-blue-200/60 transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-lg group"
                  >
                    <Bell size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:animate-bell" />
                    {notificationCount > 0 && (
                      <>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg animate-pulse">
                          {notificationCount}
                        </span>
                        <div className="absolute -top-1 -right-1 bg-red-400 rounded-full h-5 w-5 animate-ping opacity-75"></div>
                      </>
                    )}
                  </NavLink>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-50 hover:to-blue-100/80 border-2 border-gray-200/60 hover:border-blue-200/80 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-900 capitalize leading-none">
                        {role}
                      </span>
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-gray-200/60 py-2 transform origin-top-right animate-dropdown">
                      <div className="px-4 py-3 border-b border-gray-200/40">
                        <p className="text-sm font-semibold text-gray-900">Welcome back!</p>
                        <p className="text-xs text-gray-500 mt-1">Signed in as {role}</p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-200 group"
                        >
                          <User size={16} className="group-hover:scale-110 transition-transform duration-200" />
                          Profile Settings
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate("/settings");
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-200 group"
                        >
                          <Settings size={16} className="group-hover:scale-110 transition-transform duration-200" />
                          Preferences
                        </button>
                      </div>

                      <div className="border-t border-gray-200/40 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50/80 transition-all duration-200 group rounded-lg mx-2"
                        >
                          <LogOut size={16} className="group-hover:scale-110 transition-transform duration-200" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <NavLink
                to="/login"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 border-2 border-blue-500/20"
              >
                Login
              </NavLink>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-blue-600 bg-white/50 hover:bg-blue-50/80 border-2 border-transparent hover:border-blue-200/60 transition-all duration-300 transform hover:scale-110 ml-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X size={22} className="animate-spin-in" />
              ) : (
                <Menu size={22} className="animate-spin-in" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div className={`lg:hidden transition-all duration-500 overflow-hidden ${
          menuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-200/60 p-4 space-y-2">
            {isLoggedIn ? (
              <>
                {filteredNavItems.map((item, index) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 border-2
                       ${isActive 
                         ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-500/20" 
                         : "text-gray-600 hover:bg-gray-50/80 border-transparent hover:border-gray-200/60"}`
                    }
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    {item.name}
                  </NavLink>
                ))}

                {/* Mobile Notification Item */}
                <NavLink
                  to="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50/80 border-2 border-transparent hover:border-gray-200/60 transition-all duration-300 transform hover:scale-105 relative"
                >
                  <Bell size={18} />
                  Notifications
                  {notificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </NavLink>

                {/* Mobile Logout */}
                <div className="border-t border-gray-200/40 pt-3 mt-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-700 font-semibold hover:from-red-100 hover:to-red-200 border-2 border-red-200/60 hover:border-red-300/80 transition-all duration-300 transform hover:scale-105 shadow-sm"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 border-2 border-blue-500/20"
              >
                Login to System
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Add custom animations to global CSS */}
      <style jsx>{`
        @keyframes bell {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-bell {
          animation: bell 0.5s ease-in-out;
        }
        
        @keyframes dropdown {
          0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dropdown {
          animation: dropdown 0.2s ease-out;
        }
        
        @keyframes spin-in {
          0% { transform: rotate(-180deg); opacity: 0; }
          100% { transform: rotate(0deg); opacity: 1; }
        }
        .animate-spin-in {
          animation: spin-in 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
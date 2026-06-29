import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Bell, LogOut, User, ChevronDown, Settings } from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);
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

  const navItems = [
    { name: "Configuration", path: "/admin", roles: ["admin"] },
    { name: "Bookings", path: "/bookings", roles: ["admin"] },
    { name: "Service", path: "/service", roles: ["admin"] },
    { name: "Manpower", path: "/manpower", roles: ["admin"] },
    { name: "Job Assignment", path: "/slot", roles: ["admin", "worker"] },
    { name: "Cost Wise Report", path: "/report", roles: ["admin"] },
    { name: "Service Cost Setting", path: "/servicecost", roles: ["admin"] },
    { name: "Notifications", path: "/notifications", roles: ["admin"] },
    { name: "Leave Management", path: "/leave", roles: ["worker"] },
    { name: "Work Calendar", path: "/calendar", roles: ["admin"] },
    { name: "Customer", path: "/customer", roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(role)
  );

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <img 
                src={logo} 
                alt="CMTI Logo" 
                className="h-6 w-6 object-contain filter brightness-0 invert" 
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">AMC Scheduling</h1>
              <p className="text-xs text-gray-500">Maintenance System</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {isLoggedIn && filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <NavLink
                  to="/notifications"
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {notificationCount}
                    </span>
                  )}
                </NavLink>

                <div className="relative user-dropdown">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 capitalize">{displayRole}</p>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Welcome back!</p>
                        <p className="text-xs text-gray-500">Signed in as {role}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} />
                        Preferences
                      </button>
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Login
              </NavLink>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 animate-slide-down">
            <div className="space-y-1">
              {isLoggedIn ? (
                filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-center"
                >
                  Login
                </NavLink>
              )}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
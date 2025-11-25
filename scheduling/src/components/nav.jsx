import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Bell, LogOut, User } from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(); // Example count
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const navigate = useNavigate();

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

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 w-full z-50">
      <div className="max-w-8xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* LEFT SIDE - Logo & Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer flex-shrink-0 group"
          onClick={() => navigate("/")}
        >
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg group-hover:from-blue-700 group-hover:to-blue-900 transition-all duration-200">
            <img 
              src={logo} 
              alt="CMTI Logo" 
              className="h-8 w-8 object-contain filter brightness-0 invert" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">
              AMC Scheduling
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Maintenance System
            </span>
          </div>
        </div>

        {/* RIGHT MENU (DESKTOP) */}
        <div className="hidden md:flex items-center gap-2 flex-grow justify-end">
          {isLoggedIn ? (
            <>
              {/* Navigation Items */}
              <div className="flex items-center gap-1 mr-4">
                {filteredNavItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border
                       ${
                         isActive
                           ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                           : "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200"
                       }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>

              {/* Notification Bell with Badge */}
              <NavLink
                to="/notifications"
                className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 group"
              >
                <Bell size={20} className="group-hover:text-blue-600" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white">
                    {notificationCount}
                  </span>
                )}
              </NavLink>

              {/* User Profile/Logout */}
              <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {role}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-all duration-200"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200"
            >
              Login
            </NavLink>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200"
          onClick={toggleMenu}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 flex flex-col space-y-1 py-3 px-4 shadow-lg">
          {isLoggedIn ? (
            <>
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                     ${isActive 
                       ? "bg-blue-50 text-blue-700 border border-blue-200" 
                       : "text-gray-600 hover:bg-gray-50 border border-transparent"}`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Mobile Notification Item */}
              <NavLink
                to="/notifications"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 border border-transparent transition-all duration-200 relative"
              >
                <Bell size={18} />
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
              </NavLink>

              {/* Mobile User Info */}
              <div className="px-4 py-3 border-t border-gray-200 mt-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <User size={16} />
                  Logged in as: <span className="font-medium text-gray-700 capitalize">{role}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 border border-red-200 transition-all duration-200"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 border border-transparent transition-all duration-200"
            >
              Login
            </NavLink>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
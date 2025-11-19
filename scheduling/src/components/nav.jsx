import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png"; // CMTI logo
import path from "path";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
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
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const currentRole = (localStorage.getItem("role") || "worker").trim().toLowerCase();
      setIsLoggedIn(loggedIn);
      setRole(currentRole);
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
    // { name: "Scheduled Timeline", path: "/timeline", roles: ["admin"] },
    { name: "Bookings", path: "/bookings", roles: ["admin"] },
    { name: "Service", path: "/service", roles: ["admin"] },
    { name: "Manpower", path: "/manpower", roles: ["admin"] },
    { name: "Job Assignment", path: "/slot", roles: ["admin", "worker"] },
    { name: "Report", path: "/report", roles: ["admin"] },
    { name: "Serive Cost Setting",path: "/servicecost", roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.map((r) => r.trim().toLowerCase()).includes(role)
  );

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="CMTI Logo" className="h-14 w-14 object-contain" />
          <span className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            AMC Scheduling System
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm md:text-base font-medium hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-2 rounded-lg text-sm md:text-base font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              Login
            </NavLink>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-800"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white flex flex-col space-y-1 py-3 px-4 shadow-md animate-fadeIn">
          {isLoggedIn ? (
            <>
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block px-3 py-2 bg-red-500 text-white rounded-md text-left hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-all"
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

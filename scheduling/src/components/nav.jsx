import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png";

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
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(role)
  );

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-8xl mx-auto px-8 py-3 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div
          className="flex items-center gap-4 cursor-pointer flex-shrink-0"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="CMTI Logo" className="h-12 w-12 object-contain" />
          <span className="text-2xl font-bold tracking-wide text-gray-800 whitespace-nowrap">
            AMC Scheduling System
          </span>
        </div>

        {/* RIGHT MENU (DESKTOP) */}
        <div className="hidden md:flex items-center gap-6 flex-grow justify-end">
          {isLoggedIn ? (
            <>
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition 
                     ${
                       isActive
                         ? "bg-blue-600 text-white shadow"
                         : "text-gray-700 hover:bg-gray-100"
                     }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Login
            </NavLink>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden text-gray-800 ml-4"
          onClick={toggleMenu}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-white flex flex-col space-y-1 py-3 px-4 shadow-md">
          {isLoggedIn ? (
            <>
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md transition 
                     ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`
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
                className="block px-3 py-2 rounded-md bg-red-500 text-white text-left hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
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

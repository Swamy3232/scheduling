import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import BookingForm from "./components/booking";
import ServiceManager from "./components/services";
import Manpower from "./components/manpower";
import BookingFormss from "./components/slot";
import Timeline from "./components/timeline";
import Signup from "./components/admin";
import Login from "./components/login";
import Navbar from "./components/nav";
import WorkerBookings from "./components/jobassigned";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [role, setRole] = useState(localStorage.getItem("role") || "worker"); // Get role from localStorage

  // React to login/logout events
  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setRole(localStorage.getItem("role") || "worker");
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-white">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-grow flex flex-col items-center justify-center w-full px-4 py-8 mt-16">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <div className="text-center mt-10">
                  <h2 className="text-3xl font-extrabold text-gray-800">
                    Welcome to the CMTI Scheduling Portal
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Navigate to{" "}
                    <span className="font-semibold text-blue-600">
                      Bookings
                    </span>{" "}
                    to start scheduling your service.
                  </p>
                </div>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Signup />} />

            {/* Protected Routes */}
            {isLoggedIn && role === "worker" && (
              <>
                <Route path="/slot" element={<WorkerBookings />} />
                <Route path="*" element={<Navigate to="/slot" />} />
              </>
            )}

            {isLoggedIn && role !== "worker" && (
              <>
                <Route path="/bookings" element={<BookingFormss />} />
                <Route path="/slot-check" element={<BookingFormss />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/service" element={<ServiceManager />} />
                <Route path="/manpower" element={<Manpower />} />
                <Route path="/slot" element={<WorkerBookings />} />
                <Route path="*" element={<Navigate to="/bookings" />} />
              </>
            )}

            {/* Redirect if not logged in */}
            {!isLoggedIn && <Route path="*" element={<Navigate to="/login" />} />}
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 text-center text-gray-500 text-sm border-t mt-10">
          © {new Date().getFullYear()} CMTI — All Rights Reserved
        </footer>
      </div>
    </Router>
  );
}

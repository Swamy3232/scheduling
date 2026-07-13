import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import BookingForm from "./booking";
import ServiceManager from "./services";
import Manpower from "./manpower";
import BookingFormss from "./slot";
import Timeline from "./timeline";
import Signup from "./admin";
import Login from "./login";
import Navbar from "../components/nav";
import WorkerBookings from "./jobassigned";
import Report from "./report";
import ServicePricePage from "./servicecost";
import Notifications from "./notifications";
import ManpowerLeaveManager from "./leavemanagement";
import BookingCalendar from "./calender";
import CustomerPage from "./cutomer";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [role, setRole] = useState(localStorage.getItem("role") || "worker");
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );

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
      <div className="min-h-screen flex bg-gray-50">
        <Navbar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

        <main className={`flex-grow min-w-0 transition-all duration-300 min-h-screen flex flex-col justify-between pt-16 ${
          isLoggedIn 
            ? (isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64") 
            : "pl-0"
        }`}>
          <div className="w-full">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center animate-fade-in">
                      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Welcome to CMTI Scheduling Portal
                      </h1>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Navigate to <span className="font-semibold text-blue-600">Bookings</span> to start scheduling your service.
                      </p>
                    </div>
                  </div>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Signup />} />

              {isLoggedIn && role === "worker" && (
                <>
                  <Route path="/slot" element={<WorkerBookings />} />
                  <Route path="/leave" element={<ManpowerLeaveManager />} />
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
                  <Route path="/calendar" element={<BookingCalendar />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/servicecost" element={<ServicePricePage />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/customer" element={<CustomerPage />} />
                  <Route path="*" element={<Navigate to="/bookings" />} />
                </>
              )}

              {!isLoggedIn && <Route path="*" element={<Navigate to="/login" />} />}
            </Routes>
          </div>
          
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="container-responsive">
              <p className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} CMTI — All Rights Reserved
              </p>
            </div>
          </footer>
        </main>
      </div>
    </Router>
  );
}

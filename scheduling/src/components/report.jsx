import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online/bookings/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get(API_URL);
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter by category and department
  useEffect(() => {
    let filtered = bookings;
    if (category) filtered = filtered.filter(b => b.category === category);
    if (department) filtered = filtered.filter(b => b.department === department);
    setFilteredBookings(filtered);
  }, [category, department, bookings]);

  // Unique categories and departments for dropdowns
  const uniqueCategories = [...new Set(bookings.map(b => b.category).filter(Boolean))];
  const uniqueDepartments = [...new Set(bookings.map(b => b.department).filter(Boolean))];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">📋 Booking Report</h1>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full border rounded-lg p-2 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            className="w-full border rounded-lg p-2 bg-white"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => { setCategory(""); setDepartment(""); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left text-sm text-gray-700">
              <th className="p-3 border">Booking ID</th>
              <th className="p-3 border">Service Name</th>
              <th className="p-3 border">Manpower Name</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">End Date</th>
              <th className="p-3 border">Assigned By</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <tr key={b.booking_id} className="border-t hover:bg-gray-50">
                  <td className="p-3 border">{b.booking_id}</td>
                  <td className="p-3 border">{b.service_name}</td>
                  <td className="p-3 border">{b.name}</td>
                  <td className="p-3 border">{b.category || "-"}</td>
                  <td className="p-3 border">{b.department || "-"}</td>
                  <td className="p-3 border">{new Date(b.start_date).toLocaleString()}</td>
                  <td className="p-3 border">{new Date(b.end_date).toLocaleString()}</td>
                  <td className="p-3 border">{b.assigned_by}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-4 text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

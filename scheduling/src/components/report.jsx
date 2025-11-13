import React, { useEffect, useState } from "react";
import axios from "axios";

const BOOKING_API = "https://manpower.cmti.online/bookings/";
const PRICE_API = "https://manpower.cmti.online/service_prices/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [prices, setPrices] = useState({}); // store rates for service_id+price_type
  const [loading, setLoading] = useState(true);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get(BOOKING_API);
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // Fetch all service prices
  const fetchPrices = async () => {
    try {
      const res = await axios.get(PRICE_API);
      const priceMap = {};
      res.data.forEach((p) => {
        priceMap[`${p.service_id}_${p.price_type}`] = p.rate;
      });
      setPrices(priceMap);
    } catch (err) {
      console.error("Error fetching service prices:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBookings(), fetchPrices()]).then(() => setLoading(false));
  }, []);

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;
    if (category) filtered = filtered.filter((b) => b.category === category);
    if (department) filtered = filtered.filter((b) => b.department === department);
    setFilteredBookings(filtered);
  }, [category, department, bookings]);

  const uniqueCategories = [...new Set(bookings.map((b) => b.category).filter(Boolean))];
  const uniqueDepartments = [...new Set(bookings.map((b) => b.department).filter(Boolean))];

  // Compute total cost per booking
  const getBookingCost = (booking) => {
    const key = `${booking.service_id}_${booking.price_type}`;
    const rate = prices[key] || 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const hours = Math.abs(end - start) / 36e5;
    return parseFloat((hours * rate).toFixed(2));
  };

  const totalAllBookings = filteredBookings.reduce(
    (acc, b) => acc + getBookingCost(b),
    0
  );

  // Print report
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    let tableRows = filteredBookings
      .map((b) => {
        const cost = getBookingCost(b);
        return `<tr>
          <td>${b.booking_id}</td>
          <td>${b.service_name}</td>
          <td>${b.name}</td>
          <td>${b.category || "-"}</td>
          <td>${b.department || "-"}</td>
          <td>${new Date(b.start_date).toLocaleString()}</td>
          <td>${new Date(b.end_date).toLocaleString()}</td>
          <td>${b.price_type}</td>
          <td>₹${cost}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Report</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { color: #2563eb; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>📋 Booking Report</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Manpower</th>
                <th>Category</th>
                <th>Department</th>
                <th>Start</th>
                <th>End</th>
                <th>Price Type</th>
                <th>Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td colspan="8"><b>Total</b></td>
                <td><b>₹${totalAllBookings.toFixed(2)}</b></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <p className="p-6">Loading report...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">📋 Booking Report</h1>

      {/* Filters */}
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
              <option key={cat}>{cat}</option>
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
              <option key={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setCategory("");
              setDepartment("");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-sm text-gray-700">
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Service</th>
              <th className="p-3 border">Manpower</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Start</th>
              <th className="p-3 border">End</th>
              <th className="p-3 border">Price Type</th>
              <th className="p-3 border">Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <tr key={b.booking_id} className="border-t hover:bg-gray-50 text-center">
                  <td className="p-2 border">{b.booking_id}</td>
                  <td className="p-2 border">{b.service_name}</td>
                  <td className="p-2 border">{b.name}</td>
                  <td className="p-2 border">{b.category || "-"}</td>
                  <td className="p-2 border">{b.department || "-"}</td>
                  <td className="p-2 border">{new Date(b.start_date).toLocaleString()}</td>
                  <td className="p-2 border">{new Date(b.end_date).toLocaleString()}</td>
                  <td className="p-2 border">{b.price_type}</td>
                  <td className="p-2 border">₹{getBookingCost(b)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-4 text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
            {filteredBookings.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="8" className="p-2 border text-right">Total</td>
                <td className="p-2 border text-center">₹{totalAllBookings.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          🖨️ Print Report
        </button>
      </div>
    </div>
  );
}

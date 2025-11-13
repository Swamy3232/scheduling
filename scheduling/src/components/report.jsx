import React, { useEffect, useState } from "react";
import axios from "axios";

const BOOKING_API = "https://manpower.cmti.online/bookings/";
const PRICE_API = "https://manpower.cmti.online/service_prices/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rate, setRate] = useState("");
  const [totalPrice, setTotalPrice] = useState(null);

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

  useEffect(() => {
    fetchBookings();
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

  // Fetch rate from API
  const fetchRate = async (service_id, price_type) => {
    try {
      const res = await axios.get(PRICE_API);
      const priceEntry = res.data.find(
        (p) => p.service_id === service_id && p.price_type === price_type
      );
      return priceEntry ? priceEntry.rate : null;
    } catch (err) {
      console.error("Error fetching service prices:", err);
      return null;
    }
  };

  // Open Price Check modal
  const openPriceCheck = async (booking) => {
    setSelectedBooking(booking);
    setTotalPrice(null);

    const rateFromApi = await fetchRate(booking.service_id, booking.price_type);
    if (rateFromApi !== null) {
      setRate(rateFromApi);
      calculatePrice(rateFromApi, booking);
    } else {
      setRate(""); // fallback if rate not found
    }

    setShowModal(true);
  };

  // Calculate total price
  const calculatePrice = (rateToUse = null, booking = selectedBooking) => {
    const effectiveRate = rateToUse !== null ? parseFloat(rateToUse) : parseFloat(rate);
    if (!effectiveRate || !booking) return;

    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const hours = Math.abs(end - start) / 36e5; // milliseconds to hours
    const total = (hours * effectiveRate).toFixed(2);
    setTotalPrice(total);
  };

  // Print report
  const handlePrint = () => {
    if (!selectedBooking) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Price Report</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { color: #2563eb; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; }
          </style>
        </head>
        <body>
          <h2>Booking Price Report</h2>
          <p><b>Service:</b> ${selectedBooking.service_name}</p>
          <p><b>Manpower:</b> ${selectedBooking.name}</p>
          <p><b>Category:</b> ${selectedBooking.category}</p>
          <p><b>Department:</b> ${selectedBooking.department}</p>
          <p><b>Start:</b> ${new Date(selectedBooking.start_date).toLocaleString()}</p>
          <p><b>End:</b> ${new Date(selectedBooking.end_date).toLocaleString()}</p>
          <hr/>
          <p><b>Price Type:</b> ${selectedBooking.price_type}</p>
          <p><b>Rate (₹/hr):</b> ${rate}</p>
          <p><b>Total Price (₹):</b> ${totalPrice}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
            <tr className="bg-gray-200 text-left text-sm text-gray-700">
              <th className="p-3 border">Booking ID</th>
              <th className="p-3 border">Service Name</th>
              <th className="p-3 border">Manpower</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Start</th>
              <th className="p-3 border">End</th>
              <th className="p-3 border">Assigned By</th>
              <th className="p-3 border">Action</th>
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
                  <td className="p-3 border">
                    <button
                      onClick={() => openPriceCheck(b)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      💰 Price Check
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-4 text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Price Check Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-3 text-blue-700">
              💰 Price Check - {selectedBooking.service_name}
            </h2>
            <label className="block text-sm mb-1">Rate (₹/hour)</label>
            <input
              type="number"
              className="border p-2 rounded w-full mb-3"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Enter rate (optional)"
            />
            <button
              onClick={() => calculatePrice()}
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700"
            >
              Calculate
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Close
            </button>

            {totalPrice && (
              <div className="mt-4 text-gray-800">
                <p><b>Total Price:</b> ₹{totalPrice}</p>
                <button
                  onClick={handlePrint}
                  className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  🖨️ Print
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

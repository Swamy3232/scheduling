import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // -----------------------------
  // Fetch Services
  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/services/`);
      setServices(res.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setMessage("❌ Failed to load services");
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setMessage("❌ Failed to load bookings");
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // -----------------------------
  // Helpers
  const formatLocalDateTime = (isoString) => {
    const dt = new Date(isoString);
    return dt.toLocaleString("en-IN", { hour12: false });
  };

  const toLocalInputDateTime = (isoString) => {
    const dt = new Date(isoString);
    const tzOffset = dt.getTimezoneOffset() * 60000; // in ms
    return new Date(dt - tzOffset).toISOString().slice(0, 16);
  };

  const toUTCDateTimeString = (localDateTime) => {
    const dt = new Date(localDateTime);
    return dt.toISOString(); // sends UTC string to backend
  };

  const getBookingStatus = (booking) => {
    const now = new Date();
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    if (now > end) return "completed";
    if (now >= start && now <= end) return "in-progress";
    return "upcoming";
  };

  const getStatusBadge = (booking) => {
    const status = getBookingStatus(booking);
    if (!booking.manpower_name) {
      if (status === "completed") {
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
            Expired (Unassigned)
          </span>
        );
      }
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          Pending Assignment
        </span>
      );
    }
    switch (status) {
      case "completed":
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Scheduled
          </span>
        );
    }
  };

  // -----------------------------
  // Filters
  useEffect(() => {
    let filtered = bookings;

    if (serviceFilter) {
      filtered = filtered.filter((b) =>
        b.service_name.toLowerCase().includes(serviceFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.start_date);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((b) => {
        const status = getBookingStatus(b);
        const hasManpower = !!b.manpower_name;
        switch (statusFilter) {
          case "assigned":
            return hasManpower;
          case "unassigned":
            return !hasManpower;
          case "completed":
            return status === "completed";
          case "in-progress":
            return status === "in-progress";
          case "upcoming":
            return status === "upcoming";
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, serviceFilter, dateFilter, statusFilter]);

  // -----------------------------
  // Create Booking
  const createBooking = async () => {
    if (!selectedService || !startDate || !endDate || !category || !department) {
      setMessage("⚠️ Please fill in all fields!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        service_id: Number(selectedService),
        start_date: toUTCDateTimeString(startDate),
        end_date: toUTCDateTimeString(endDate),
        category,
        department,
      };

      const res = await axios.post(`${API_URL}/bookings/`, payload);
      setMessage(`✅ Booking created for "${res.data.service_name}"`);
      fetchBookings();
      resetForm();
    } catch (err) {
      console.error("Error creating booking:", err);
      setMessage(err.response?.data?.detail || "❌ Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  const handleEdit = (b) => {
    const status = getBookingStatus(b);
    if (status === "completed" || status === "in-progress") {
      setMessage("❌ Cannot edit completed or in-progress bookings");
      return;
    }

    setEditId(b.booking_id);
    setSelectedService(
      services.find((s) => s.service_name === b.service_name)?.service_id || ""
    );
    setStartDate(toLocalInputDateTime(b.start_date));
    setEndDate(toLocalInputDateTime(b.end_date));
    setCategory(b.category || "");
    setDepartment(b.department || "");
    setMessage(`✏️ Editing booking #${b.booking_id}`);
  };

  const updateBooking = async () => {
    if (!editId) return;

    try {
      setLoading(true);
      const payload = {
        start_date: toUTCDateTimeString(startDate),
        end_date: toUTCDateTimeString(endDate),
        category,
        department,
      };

      await axios.put(`${API_URL}/bookings/${editId}`, payload);
      setMessage("✅ Booking updated successfully");
      fetchBookings();
      resetForm();
    } catch (err) {
      console.error("Error updating booking:", err);
      setMessage(err.response?.data?.detail || "❌ Error updating booking");
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await axios.delete(`${API_URL}/bookings/${bookingId}`);
      setMessage("✅ Booking deleted successfully");
      fetchBookings();
    } catch (err) {
      console.error("Error deleting booking:", err);
      setMessage("❌ Error deleting booking");
    }
  };

  const resetForm = () => {
    setSelectedService("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setDepartment("");
    setEditId(null);
  };

  const clearFilters = () => {
    setServiceFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  // -----------------------------
  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 mt-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📅 Service Booking Management
      </h2>

      {/* Booking Form */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {editId ? `✏️ Edit Booking #${editId}` : "➕ Create New Booking"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            disabled={!!editId}
          >
            <option value="">Select Service</option>
            {services.map((srv) => (
              <option key={srv.service_id} value={srv.service_id}>
                {srv.service_name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select Category</option>
            <option value="academic">Academic</option>
            <option value="industrial">Industrial</option>
          </select>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select Department</option>
            <option value="a">Department A</option>
            <option value="b">Department B</option>
            <option value="c">Department C</option>
            <option value="d">Department D</option>
          </select>

          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex space-x-2">
          {editId ? (
            <>
              <button
                onClick={updateBooking}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {loading ? "⏳ Updating..." : "💾 Update"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={createBooking}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              {loading ? "⏳ Creating..." : "📝 Create Booking"}
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.includes("❌")
                ? "bg-red-100 text-red-800 border border-red-200"
                : message.includes("⚠️")
                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                : "bg-green-100 text-green-800 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manpower
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned By
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((b) => (
              <tr key={b.booking_id}>
                <td className="px-6 py-4 text-sm text-gray-700">#{b.booking_id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.service_name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.category || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.department || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.manpower_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatLocalDateTime(b.start_date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatLocalDateTime(b.end_date)}
                </td>
                <td className="px-6 py-4">{getStatusBadge(b)}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.assigned_by || "-"}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(b)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteBooking(b.booking_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500 text-sm">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

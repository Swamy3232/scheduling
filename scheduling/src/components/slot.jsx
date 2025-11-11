import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  // Time Helpers: convert ISO/UTC to local IST display
  const formatLocalDateTime = (isoString) => {
    const dt = new Date(isoString);
    return dt.toLocaleString("en-IN", { hour12: false });
  };

  // Booking Status
  const getBookingStatus = (booking) => {
    const now = new Date();
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    if (now > end) return "completed";
    if (now >= start && now <= end) return "in-progress";
    if (now < start) return "upcoming";
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
      case "upcoming":
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Scheduled
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
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
  if (!selectedService || !startDate || !endDate) {
    setMessage("⚠️ Please fill in all fields!");
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  console.log("Raw startDate input:", startDate);
  console.log("Raw endDate input:", endDate);
  console.log("Date objects:", start, end);
  console.log("ISOString sent to backend:", start.toISOString(), end.toISOString());

  try {
    setLoading(true);
    const payload = {
    service_id: Number(selectedService),
    start_date: startDate, // e.g., "2025-11-25T15:59"
    end_date: endDate,
  };


    const res = await axios.post(`${API_URL}/bookings/`, payload);
    console.log("Response from backend:", res.data);
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
  // Edit Booking
  const handleEdit = (b) => {
    const status = getBookingStatus(b);
    if (status === "completed" || status === "in-progress") {
      setMessage("❌ Cannot edit completed or in-progress bookings");
      return;
    }

    setEditId(b.booking_id);
    setSelectedService(services.find((s) => s.service_name === b.service_name)?.service_id || "");
    setStartDate(new Date(b.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(b.end_date).toISOString().slice(0, 16));
    setMessage(`✏️ Editing booking #${b.booking_id}`);
  };

  const updateBooking = async () => {
    if (!editId) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setMessage("❌ End date must be after start date!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };

      await axios.put(
        `${API_URL}/bookings/${editId}?start_date=${payload.start_date}&end_date=${payload.end_date}`
      );
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

  // -----------------------------
  // Delete Booking
  const deleteBooking = async (bookingId) => {
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (booking) {
      const status = getBookingStatus(booking);
      if (status === "completed" || status === "in-progress") {
        setMessage("❌ Cannot delete completed or in-progress bookings");
        return;
      }
    }

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
    setEditId(null);
  };

  const clearFilters = () => {
    setServiceFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  // -----------------------------
  // Statistics
  const getStatistics = () => ({
    total: bookings.length,
    assigned: bookings.filter((b) => b.manpower_name).length,
    unassigned: bookings.filter((b) => !b.manpower_name).length,
    completed: bookings.filter((b) => getBookingStatus(b) === "completed").length,
    inProgress: bookings.filter((b) => getBookingStatus(b) === "in-progress").length,
    upcoming: bookings.filter((b) => getBookingStatus(b) === "upcoming").length,
  });
  const stats = getStatistics();

  // -----------------------------
  // Render
  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 mt-6 border border-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📅 Service Booking Management</h2>
          <p className="text-gray-600 mt-1">Manage and track all service bookings</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <span className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
          <span className="text-sm text-gray-500">{bookings.length} bookings</span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {editId ? `✏️ Edit Booking #${editId}` : "➕ Create New Booking"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={!!editId}
          >
            <option value="">Select Service</option>
            {services.map((srv) => (
              <option key={srv.service_id} value={srv.service_id}>{srv.service_name}</option>
            ))}
          </select>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
          <div className="flex space-x-2">
            {editId ? (
              <>
                <button onClick={updateBooking} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center">
                  {loading ? "⏳ Updating..." : "💾 Update"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              </>
            ) : (
              <button onClick={createBooking} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? "⏳ Creating..." : "📝 Create Booking"}
              </button>
            )}
          </div>
        </div>
        {message && <div className={`p-3 rounded-lg text-sm font-medium ${message.includes("❌") ? "bg-red-100 text-red-800 border border-red-200" : message.includes("⚠️") ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-green-100 text-green-800 border border-green-200"}`}>{message}</div>}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">🔍 Filter Bookings</h3>
          <div className="flex space-x-2">
            <button onClick={fetchBookings} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center">🔄 Refresh</button>
            <button onClick={clearFilters} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">Clear Filters</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input type="text" placeholder="Filter by service..." value={serviceFilter} onChange={(e)=>setServiceFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="upcoming">Upcoming</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">📋 Bookings List
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manpower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((b) => {
                const status = getBookingStatus(b);
                const canEdit = status === "upcoming";
                return (
                  <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{b.booking_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.service_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.manpower_name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatLocalDateTime(b.start_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatLocalDateTime(b.end_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(b)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.assigned_by || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                      <button onClick={()=>handleEdit(b)} disabled={!canEdit} className="text-blue-600 hover:text-blue-800 disabled:text-gray-300">✏️ Edit</button>
                      <button onClick={()=>deleteBooking(b.booking_id)} disabled={!canEdit} className="text-red-600 hover:text-red-800 disabled:text-gray-300">🗑️ Delete</button>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">No bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

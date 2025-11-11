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

  // Filter states
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 🟢 Fetch all services
  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/services/`);
      setServices(res.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setMessage("❌ Failed to load services");
    }
  };

  // 🟢 Fetch all bookings
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

  // 🟢 Get booking status based on time and assignment
  const getBookingStatus = (booking) => {
    const now = new Date();
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    
    if (now > end) {
      return "completed"; // Time slot is over
    } else if (now >= start && now <= end) {
      return "in-progress"; // Currently ongoing
    } else if (now < start) {
      return "upcoming"; // Future booking
    }
    return "upcoming";
  };

  // 🟢 Get status badge with proper styling
  const getStatusBadge = (booking) => {
    const status = getBookingStatus(booking);
    
    if (!booking.manpower_name) {
      if (status === "completed") {
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Expired (Unassigned)</span>;
      }
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending Assignment</span>;
    }
    
    // If manpower is assigned, show time-based status
    switch (status) {
      case "completed":
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Completed</span>;
      case "in-progress":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">In Progress</span>;
      case "upcoming":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Scheduled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Scheduled</span>;
    }
  };

  // 🟢 Apply filters
  useEffect(() => {
    let filtered = bookings;

    if (serviceFilter) {
      filtered = filtered.filter(booking => 
        booking.service_name.toLowerCase().includes(serviceFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(booking => {
        const status = getBookingStatus(booking);
        const hasManpower = !!booking.manpower_name;
        
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

  // 🟢 Create new booking
  const createBooking = async () => {
    if (!selectedService || !startDate || !endDate) {
      setMessage("⚠️ Please fill in all fields!");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      setMessage("❌ Start date cannot be in the past!");
      return;
    }

    if (end <= start) {
      setMessage("❌ End date must be after start date!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/bookings/`, {
        service_id: Number(selectedService),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
      setMessage(`✅ Booking created for "${res.data.service_name}"`);
      fetchBookings();
      resetForm();
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Load existing booking data for editing - Only allow editing future bookings
  const handleEdit = (b) => {
    const bookingStatus = getBookingStatus(b);
    
    if (bookingStatus === "completed" || bookingStatus === "in-progress") {
      setMessage("❌ Cannot edit completed or in-progress bookings");
      return;
    }

    setEditId(b.booking_id);
    setSelectedService(
      services.find((s) => s.service_name === b.service_name)?.service_id || ""
    );
    setStartDate(new Date(b.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(b.end_date).toISOString().slice(0, 16));
    setMessage(`✏️ Editing booking #${b.booking_id}`);
  };

  // 💾 Update booking
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
      await axios.put(
        `${API_URL}/bookings/${editId}?start_date=${start.toISOString()}&end_date=${end.toISOString()}`
      );
      setMessage("✅ Booking updated successfully");
      fetchBookings();
      resetForm();
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Error updating booking");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete booking - Only allow deleting future bookings
  const deleteBooking = async (bookingId) => {
    const booking = bookings.find(b => b.booking_id === bookingId);
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
      setMessage("❌ Error deleting booking");
    }
  };

  // 🔄 Reset form
  const resetForm = () => {
    setSelectedService("");
    setStartDate("");
    setEndDate("");
    setEditId(null);
  };

  // 🔄 Clear filters
  const clearFilters = () => {
    setServiceFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  // 📊 Get statistics
  const getStatistics = () => {
    const stats = {
      total: bookings.length,
      assigned: bookings.filter(b => b.manpower_name).length,
      unassigned: bookings.filter(b => !b.manpower_name).length,
      completed: bookings.filter(b => getBookingStatus(b) === "completed").length,
      inProgress: bookings.filter(b => getBookingStatus(b) === "in-progress").length,
      upcoming: bookings.filter(b => getBookingStatus(b) === "upcoming").length,
    };
    return stats;
  };

  const stats = getStatistics();

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
              <option key={srv.service_id} value={srv.service_id}>
                {srv.service_name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />

          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />

          <div className="flex space-x-2">
            {editId ? (
              <>
                <button
                  onClick={updateBooking}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? "⏳ Updating..." : "💾 Update"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={createBooking}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? "⏳ Creating..." : "📝 Create Booking"}
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.includes("❌") ? "bg-red-100 text-red-800 border border-red-200" : 
            message.includes("⚠️") ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : 
            "bg-green-100 text-green-800 border border-green-200"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">🔍 Filter Bookings</h3>
          <div className="flex space-x-2">
            <button
              onClick={fetchBookings}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center"
            >
              🔄 Refresh
            </button>
            <button
              onClick={clearFilters}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              placeholder="Filter by service..."
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
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
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            📋 Bookings List
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                      {b.manpower_name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(b.start_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(b.end_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(b)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.assigned_by || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(b)}
                        disabled={!canEdit}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          canEdit 
                            ? "text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100" 
                            : "text-gray-400 bg-gray-100 cursor-not-allowed"
                        }`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteBooking(b.booking_id)}
                        disabled={!canEdit}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          canEdit 
                            ? "text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100" 
                            : "text-gray-400 bg-gray-100 cursor-not-allowed"
                        }`}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <span className="text-4xl mb-2 block">📭</span>
                      No bookings found
                      {serviceFilter || dateFilter || statusFilter ? " matching your filters" : ""}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="text-center p-3 bg-gray-50 rounded-lg border">
          <div className="font-semibold text-gray-600">Total</div>
          <div className="text-xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="font-semibold text-blue-600">Upcoming</div>
          <div className="text-xl font-bold text-blue-700">{stats.upcoming}</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="font-semibold text-green-600">In Progress</div>
          <div className="text-xl font-bold text-green-700">{stats.inProgress}</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="font-semibold text-purple-600">Completed</div>
          <div className="text-xl font-bold text-purple-700">{stats.completed}</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="font-semibold text-yellow-600">Unassigned</div>
          <div className="text-xl font-bold text-yellow-700">{stats.unassigned}</div>
        </div>
      </div>
    </div>
  );
}
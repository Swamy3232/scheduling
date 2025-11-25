import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online/bookings/";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: ""
  });
  const [viewingRemarks, setViewingRemarks] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching bookings from:", API_URL);
      const res = await axios.get(API_URL);
      console.log("API Response:", res.data);
      
      if (Array.isArray(res.data)) {
        // Filter out bookings that have remarks AND remarks_update is "waiting"
        const waitingRemarks = res.data.filter(booking => 
          booking.remarks && 
          booking.remarks.trim().length > 0 &&
          booking.remarks_update === "waiting"
        );
        console.log("Bookings with waiting remarks:", waitingRemarks.length);
        setNotifications(waitingRemarks);
      } else {
        console.error("Unexpected response format:", res.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(`Failed to load notifications: ${error.message}`);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update remarks_update status
  const updateRemarksStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(bookingId);
      console.log("Updating remarks status for booking:", bookingId, "to:", newStatus);

      const res = await axios.put(
        `https://manpower.cmti.online/bookings/${bookingId}`,
        null,
        { 
          params: { 
            remarks_update: newStatus 
          } 
        }
      );

      console.log("Update response:", res.data);
      
      // Remove the booking from notifications after successful update
      setNotifications(prev => prev.filter(notification => 
        notification.booking_id !== bookingId
      ));
      
    } catch (error) {
      console.error("Error updating remarks status:", error);
      alert("Failed to update status. See console for details.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Status filter
      if (filters.status !== "all" && notification.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          notification.service_name?.toLowerCase().includes(searchTerm) ||
          notification.manpower_name?.toLowerCase().includes(searchTerm) ||
          notification.remarks?.toLowerCase().includes(searchTerm) ||
          notification.service_id?.toString().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateRange !== "all" && notification.start_date) {
        const startDate = new Date(notification.start_date);
        const now = new Date();
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case "today":
            return startDate.toDateString() === now.toDateString();
          case "week":
            return diffDays >= 0 && diffDays <= 7;
          case "month":
            return diffDays >= 0 && diffDays <= 30;
          default:
            return true;
        }
      }

      return true;
    });
  }, [notifications, filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "upcoming":
        return "bg-purple-100 text-purple-700";
      case "ongoing":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusFromDates = (startDate, endDate) => {
    if (!startDate || !endDate) return "unknown";

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";

    return "unknown";
  };

  const getRemarksUpdateBadge = (remarks_update) => {
    const cfg = {
      waiting: { color: "yellow", text: "Waiting" },
      accepted: { color: "green", text: "Accepted" },
      rejected: { color: "red", text: "Rejected" },
    };

    const c = cfg[remarks_update] || cfg.waiting;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium bg-${c.color}-100 text-${c.color}-800`}
      >
        {c.text}
      </span>
    );
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleRetry = () => {
    fetchNotifications();
  };

  const handleViewRemarks = (notification) => {
    setViewingRemarks(notification);
  };

  const handleCloseRemarks = () => {
    setViewingRemarks(null);
  };

  const handleStatusChange = (notification, newStatus) => {
    updateRemarksStatus(notification.booking_id, newStatus);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Notifications</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* View Remarks Modal */}
      {viewingRemarks && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Remarks – {viewingRemarks.service_name}
            </h3>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">Remarks:</label>
              <div className="mt-2 p-4 bg-gray-50 border rounded max-h-48 overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap">{viewingRemarks.remarks}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCloseRemarks}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Pending Remarks Approval</h2>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search remarks..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredNotifications.length} pending remarks awaiting approval
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg">No pending remarks found</p>
            <p className="text-gray-400 text-sm mt-2">
              All remarks have been processed or no remarks awaiting approval
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const status = notification.status || getStatusFromDates(
              notification.start_date, 
              notification.end_date
            );

            return (
              <div
                key={index}
                className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
              >
                {/* Header: Service + Status */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {notification.service_name || "Unnamed Service"}
                    </h3>
                    {notification.service_id && (
                      <p className="text-sm text-gray-500">
                        Service ID: {notification.service_id}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                {/* Manpower */}
                <p className="text-gray-700 mt-2">
                  <strong>Manpower:</strong> {notification.manpower_name || notification.manpower || "Not assigned"}
                </p>

                {/* Department and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {notification.department && (
                    <p className="text-gray-700 text-sm">
                      <strong>Department:</strong> {notification.department}
                    </p>
                  )}
                  {notification.category && (
                    <p className="text-gray-700 text-sm">
                      <strong>Category:</strong> {notification.category}
                    </p>
                  )}
                </div>

                {/* Timeline */}
                {notification.start_date && (
                  <p className="text-gray-700 text-sm mt-2">
                    <strong>Timeline:</strong>{" "}
                    {new Date(notification.start_date).toLocaleDateString()} →{" "}
                    {notification.end_date 
                      ? new Date(notification.end_date).toLocaleDateString()
                      : "Not set"}
                  </p>
                )}

                {/* Remarks Status and Actions */}
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {/* Current Status */}
                    <div>
                      <span className="text-sm text-gray-600 mr-2">Status:</span>
                      {getRemarksUpdateBadge(notification.remarks_update || "waiting")}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(notification, "accepted")}
                        disabled={updatingStatus === notification.booking_id}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingStatus === notification.booking_id ? "Updating..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleStatusChange(notification, "rejected")}
                        disabled={updatingStatus === notification.booking_id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {updatingStatus === notification.booking_id ? "Updating..." : "Reject"}
                      </button>
                    </div>
                  </div>

                  {/* View Remarks Button */}
                  <button
                    onClick={() => handleViewRemarks(notification)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View Remarks
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
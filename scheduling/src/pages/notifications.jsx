import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { RefreshCw, Search, Filter, Bell, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, StatusBadge } from "../components/ui";

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
    const statusMap = {
      waiting: "pending",
      accepted: "active",
      rejected: "inactive"
    };
    const labelMap = {
      waiting: "Waiting",
      accepted: "Accepted",
      rejected: "Rejected"
    };
    return <StatusBadge status={statusMap[remarks_update] || "pending"} label={labelMap[remarks_update] || "Waiting"} />;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading notifications...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Bell size={48} className="text-red-500 opacity-30" />
              <h3 className="text-lg font-semibold text-red-800">Error Loading Notifications</h3>
              <p className="text-red-600">{error}</p>
              <Button variant="danger" onClick={handleRetry}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* View Remarks Modal */}
        <Modal isOpen={!!viewingRemarks} onClose={handleCloseRemarks} size="sm">
          <ModalHeader>
            <CardTitle>Remarks – {viewingRemarks?.service_name}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <label className="text-sm font-medium text-gray-700">Remarks:</label>
            <div className="mt-2 p-4 bg-gray-50 border rounded-lg max-h-48 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap">{viewingRemarks?.remarks}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseRemarks} fullWidth>Close</Button>
          </ModalFooter>
        </Modal>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Remarks Approval</h1>
            <p className="text-gray-600">Review and manage remarks awaiting approval</p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchNotifications}
            leftIcon={<RefreshCw size={20} />}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search"
                placeholder="Search remarks..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                leftIcon={<Search size={18} className="text-gray-400" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredNotifications.length} pending remarks awaiting approval
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Bell size={48} className="opacity-30" />
                  <p className="text-lg">No pending remarks found</p>
                  <p className="text-sm">All remarks have been processed or no remarks awaiting approval</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => {
              const status = notification.status || getStatusFromDates(
                notification.start_date, 
                notification.end_date
              );

              return (
                <Card key={index} className="animate-slide-up hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Header: Service + Status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.service_name || "Unnamed Service"}
                        </h3>
                        {notification.service_id && (
                          <p className="text-sm text-gray-500">
                            Service ID: {notification.service_id}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={status === "completed" ? "inactive" : status === "ongoing" ? "active" : "pending"} />
                    </div>

                    {/* Manpower */}
                    <p className="text-gray-700 mt-3">
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
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-sm text-gray-600 mr-2">Status:</span>
                          {getRemarksUpdateBadge(notification.remarks_update || "waiting")}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleStatusChange(notification, "accepted")}
                            disabled={updatingStatus === notification.booking_id}
                            loading={updatingStatus === notification.booking_id}
                            leftIcon={<CheckCircle size={16} />}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStatusChange(notification, "rejected")}
                            disabled={updatingStatus === notification.booking_id}
                            loading={updatingStatus === notification.booking_id}
                            leftIcon={<XCircle size={16} />}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewRemarks(notification)}
                        leftIcon={<Eye size={16} />}
                      >
                        View Remarks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
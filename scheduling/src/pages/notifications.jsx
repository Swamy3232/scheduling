import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { RefreshCw, Search, Filter, Bell, CheckCircle, XCircle, Eye, Info, Calendar, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui";

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
      const res = await axios.get(API_URL);
      
      if (Array.isArray(res.data)) {
        // Filter out bookings that have remarks AND remarks_update is "waiting"
        const waitingRemarks = res.data.filter(booking => 
          booking.remarks && 
          booking.remarks.trim().length > 0 &&
          booking.remarks_update === "waiting"
        );
        setNotifications(waitingRemarks);
      } else {
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

      await axios.put(
        `https://manpower.cmti.online/bookings/${bookingId}`,
        null,
        { 
          params: { 
            remarks_update: newStatus 
          } 
        }
      );
      
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

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
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

  // Status mapping
  const renderStatusBadge = (b) => {
    const s = getStatusFromDates(b.start_date, b.end_date);
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-700 border border-gray-200">
            Completed
          </span>
        );
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            Ongoing
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Bell size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>🔔</span> Pending Remarks Approvals
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Review workforce ticket submissions, inspect recorded warning notes, and approve cost audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchNotifications}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-xs text-red-700 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service name, engineer..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Date Range filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-600 font-semibold"
            >
              <option value="all">All Timelines</option>
              <option value="today">Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>

          </div>
        </CardContent>
      </Card>

      {/* Main Inbox Database List */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Fetching pending approval logs...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">Clear Inbox</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                There are currently no workforce inspection remarks waiting for administrative review.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engineer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks Observation Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredNotifications.map((n) => (
                    <tr key={n.booking_id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">#{n.booking_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>⚙️</span>
                          <span>{n.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                            {n.manpower_name ? n.manpower_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span>{n.manpower_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate" title={n.remarks}>
                        {n.remarks}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-gray-700 flex items-center gap-1">
                            <Calendar size={11} className="text-gray-400" />
                            {new Date(n.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{renderStatusBadge(n)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewRemarks(n)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="View Remarks Detail"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(n, "accepted")}
                            disabled={updatingStatus === n.booking_id}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Accept Remarks"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(n, "rejected")}
                            disabled={updatingStatus === n.booking_id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Reject Remarks"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remarks Dialog Sheet */}
      {viewingRemarks && (
        <Modal isOpen={!!viewingRemarks} onClose={handleCloseRemarks}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span>Workforce Observation Review</span>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Service Item</span>
              <h4 className="text-xs font-extrabold text-gray-800 mt-1">⚙️ {viewingRemarks.service_name}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Submitting Engineer</span>
                <span className="text-xs font-bold text-gray-700 mt-1 block">{viewingRemarks.manpower_name || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Department / Client</span>
                <span className="text-xs font-bold text-gray-700 mt-1 block">{viewingRemarks.department || "-"}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Observation Details</span>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">{viewingRemarks.remarks}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleCloseRemarks}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                handleStatusChange(viewingRemarks, "rejected");
                handleCloseRemarks();
              }}
            >
              Reject Notes
            </Button>
            <Button
              onClick={() => {
                handleStatusChange(viewingRemarks, "accepted");
                handleCloseRemarks();
              }}
            >
              Approve Remarks
            </Button>
          </ModalFooter>
        </Modal>
      )}

    </div>
  );
}
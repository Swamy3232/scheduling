import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, AlertTriangle, Edit, Eye, Clock, CheckCircle, AlertCircle, Info, Calendar, UserCheck, ShieldAlert, LogOut } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Textarea } from "../components/ui";

const WorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: ""
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({ 
    remarks: "",
    remarks_update: "waiting",
    workstatus: "pending"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [viewingRemarks, setViewingRemarks] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [overdueBookings, setOverdueBookings] = useState([]);
  const navigate = useNavigate();

  // Enhanced localStorage check
  useEffect(() => {
    console.log("🔍 WorkerDashboard - Checking for user authentication...");
    
    const checkUserAuth = () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.username && parsedUser.role) {
            setUserInfo(parsedUser);
          } else {
            navigate("/login");
          }
        } catch (error) {
          console.error("❌ Error parsing user data:", error);
          localStorage.removeItem("user");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };
    
    checkUserAuth();
  }, [navigate]);

  useEffect(() => {
    if (userInfo) {
      fetchBookings();
      const overdueInterval = setInterval(checkOverdueBookings, 30000);
      return () => clearInterval(overdueInterval);
    }
  }, [userInfo]);

  const checkOverdueBookings = () => {
    const now = new Date();
    const overdue = bookings.filter((booking) => {
      if (!booking.end_date) return false;
      
      const endDate = new Date(booking.end_date);
      const isTimeDone = now > endDate;
      const isNotCompleted = booking.workstatus !== "completed";
      
      return isTimeDone && isNotCompleted;
    });
    
    setOverdueBookings(overdue);
    
    if (overdue.length > 0) {
      playWarningSound();
    }
  };

  const playWarningSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log("Could not play warning sound:", err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://manpower.cmti.online/bookings/");
      let filteredData = res.data;
      if (userInfo?.role === "worker" && userInfo?.username) {
        filteredData = res.data.filter(booking => {
          return (
            booking.manpower_name === userInfo.username ||
            booking.staff_name === userInfo.username ||
            booking.worker_name === userInfo.username ||
            booking.assigned_to === userInfo.username
          );
        });
      }
      setBookings(filteredData);
    } catch (err) {
      console.error("[fetchBookings] error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
      setTimeout(checkOverdueBookings, 500);
    }
  };

  const getStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return "unknown";

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";

    return "unknown";
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const status = getStatus(booking.start_date, booking.end_date);

      if (filters.status !== "all" && status !== filters.status) return false;

      if (filters.search) {
        const term = filters.search.toLowerCase();
        const match =
          booking.service_name?.toLowerCase().includes(term) ||
          booking.manpower_name?.toLowerCase().includes(term) ||
          booking.remarks?.toLowerCase().includes(term) ||
          booking.service_id?.toString().toLowerCase().includes(term);

        if (!match) return false;
      }

      if (filters.dateRange !== "all" && booking.start_date) {
        const startDate = new Date(booking.start_date);
        const now = new Date();

        const diff = Math.ceil((startDate - now) / (1000 * 3600 * 24));

        switch (filters.dateRange) {
          case "today":
            return startDate.toDateString() === now.toDateString();
          case "week":
            return diff >= 0 && diff <= 7;
          case "month":
            return diff >= 0 && diff <= 30;
          default:
            return true;
        }
      }

      return true;
    });
  }, [bookings, filters]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "completed"
    ).length;
    const ongoing = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "ongoing"
    ).length;
    const upcoming = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "upcoming"
    ).length;

    return { total, completed, ongoing, upcoming };
  }, [bookings]);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  const handleEditClick = (booking) => {
    setEditingBooking(booking);
    
    const newRemarksUpdate = (booking.remarks_update === "accepted" || booking.remarks_update === "rejected") 
      ? "waiting" 
      : (booking.remarks_update || "waiting");
    
    setEditForm({ 
      remarks: booking.remarks || "",
      remarks_update: newRemarksUpdate,
      workstatus: booking.workstatus || "pending"
    });
    setIsEditing(false);
  };

  const handleViewRemarks = (booking) => {
    setViewingRemarks(booking);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    setIsEditing(true);

    try {
      await axios.put(
        `https://manpower.cmti.online/bookings/${editingBooking.booking_id}`,
        null,
        { 
          params: { 
            remarks: editForm.remarks,
            remarks_update: editForm.remarks_update,
            workstatus: editForm.workstatus
          } 
        }
      );

      await fetchBookings();
    } catch (err) {
      console.error("[handleEditSubmit] update failed:", err);
      alert("Failed to update remarks. Please try again.");
    } finally {
      setIsEditing(false);
      setEditingBooking(null);
      setEditForm({ remarks: "", remarks_update: "waiting", workstatus: "pending" });
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditForm({ remarks: "", remarks_update: "waiting", workstatus: "pending" });
    setIsEditing(false);
  };

  const handleCloseRemarks = () => {
    setViewingRemarks(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Status mapping
  const renderStatusBadge = (b) => {
    const s = getStatus(b.start_date, b.end_date);
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            🟢 Completed
          </span>
        );
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            🔵 Ongoing
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            🟠 Scheduled
          </span>
        );
    }
  };

  // Work status chip renderer
  const renderWorkStatusChip = (workstatus) => {
    const ws = (workstatus || "pending").toLowerCase();
    switch (ws) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        );
      case "in-progress":
      case "in progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            In Progress
          </span>
        );
      case "hold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            On Hold
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            Pending
          </span>
        );
    }
  };

  // Remarks status badge
  const renderRemarksUpdateBadge = (ru) => {
    const val = (ru || "waiting").toLowerCase();
    switch (val) {
      case "accepted":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Rejected
          </span>
        );
      case "waiting":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Waiting
          </span>
        );
    }
  };

  if (!userInfo && !loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8 space-y-3">
          <RefreshCw className="animate-spin mx-auto text-blue-600" size={24} />
          <p className="text-xs text-gray-500 font-semibold">Resolving session security context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>📋</span> Workforce Job Board
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              View your assigned AMC tickets, update work completion statuses, and submit inspector remarks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchBookings}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="h-11 rounded-xl font-medium px-4 shadow-sm"
            leftIcon={<LogOut size={16} />}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Overdue Warning Card */}
      {overdueBookings.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
          <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h5 className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Overdue Job Allocation alert</h5>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Attention! You have <strong>{overdueBookings.length}</strong> assigned task(s) whose schedules are past due and not completed. Please update status to completed or add pause notes.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Assigned Tickets</span>
              <span className="text-2xl font-extrabold text-gray-800 block">{stats.total}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Completed</span>
              <span className="text-2xl font-extrabold text-emerald-600 block">{stats.completed}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">In Progress</span>
              <span className="text-2xl font-extrabold text-blue-600 block">{stats.ongoing}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Scheduled</span>
              <span className="text-2xl font-extrabold text-amber-600 block">{stats.upcoming}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Database Table Card */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        
        {/* Filters Toolbar */}
        <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search service, ticket ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Status filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-600 font-semibold"
            >
              <option value="all">All Ticket Statuses</option>
              <option value="upcoming">Scheduled</option>
              <option value="ongoing">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Range filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-600 font-semibold"
            >
              <option value="all">All Timelines</option>
              <option value="today">Scheduled Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>

          </div>
        </CardHeader>

        {/* Database List */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Loading task allocations...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No assigned tickets found</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                You have no active task allocations matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule Period</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks State</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">#{b.booking_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚙️</span>
                          <span>{b.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-gray-700 flex items-center gap-1">
                            <Calendar size={11} className="text-gray-400" />
                            {new Date(b.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(b.start_date).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_date).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{renderWorkStatusChip(b.workstatus)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{renderStatusBadge(b)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{renderRemarksUpdateBadge(b.remarks_update)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewRemarks(b)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="View Remarks"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEditClick(b)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Edit Ticket"
                          >
                            <Edit size={14} />
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

      {/* View Remarks Modal */}
      {viewingRemarks && (
        <Modal isOpen={!!viewingRemarks} onClose={handleCloseRemarks}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>Inspector Remarks (Ticket #{viewingRemarks.booking_id})</span>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Submitted Remarks</span>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                {viewingRemarks.remarks || "No remarks notes have been recorded."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Remarks Status</span>
                <span className="block mt-1">{renderRemarksUpdateBadge(viewingRemarks.remarks_update)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Work Status</span>
                <span className="block mt-1">{renderWorkStatusChip(viewingRemarks.workstatus)}</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleCloseRemarks}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit Ticket Modal */}
      {editingBooking && (
        <Modal isOpen={!!editingBooking} onClose={handleCancelEdit}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>🔧</span>
              <span>Update Task Progress (Ticket #{editingBooking.booking_id})</span>
            </div>
          </ModalHeader>
          <form onSubmit={handleEditSubmit}>
            <ModalBody className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Work Progress State *
                </label>
                <select
                  value={editForm.workstatus}
                  onChange={(e) => setEditForm(prev => ({ ...prev, workstatus: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-700 font-semibold"
                  required
                >
                  <option value="pending">Pending Allocation</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed Ticket</option>
                  <option value="hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Remarks Status Update
                </label>
                <select
                  value={editForm.remarks_update}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks_update: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-700 font-semibold"
                >
                  <option value="waiting">Waiting approval</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Add Inspector Remarks / Notes
                </label>
                <Textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter service details, notes, or warning observations..."
                  rows={4}
                />
              </div>

            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Progress"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default WorkerDashboard;
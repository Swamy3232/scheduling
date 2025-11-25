import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

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
    remarks_update: "waiting"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [viewingRemarks, setViewingRemarks] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    console.log("[fetchBookings] start");
    setLoading(true);
    try {
      const res = await axios.get("https://manpower.cmti.online/bookings/");
      console.log("[fetchBookings] success, count:", Array.isArray(res.data) ? res.data.length : "?", res);
      setBookings(res.data);
    } catch (err) {
      console.error("[fetchBookings] error:", err, err?.response?.data);
    } finally {
      setLoading(false);
      console.log("[fetchBookings] done");
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
    console.log("[handleEditClick] opening modal for booking:", booking);
    setEditingBooking(booking);
    
    // Automatically change from "accepted" to "waiting" when editing
    const newRemarksUpdate = booking.remarks_update === "accepted" ? "waiting" : (booking.remarks_update || "waiting");
    
    setEditForm({ 
      remarks: booking.remarks || "",
      remarks_update: newRemarksUpdate
    });
    setIsEditing(false);
  };

  const handleViewRemarks = (booking) => {
    console.log("[handleViewRemarks] opening remarks modal for booking:", booking);
    setViewingRemarks(booking);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) {
      console.warn("[handleEditSubmit] no editingBooking present");
      return;
    }

    console.log("[handleEditSubmit] submitting. booking_id:", editingBooking.booking_id, "remarks:", editForm.remarks, "remarks_update:", editForm.remarks_update);
    let success = false;
    setIsEditing(true);

    try {
      console.log("[handleEditSubmit] axios.put request -> url:",
        `https://manpower.cmti.online/bookings/${editingBooking.booking_id}`,
        "params:", { 
          remarks: editForm.remarks,
          remarks_update: editForm.remarks_update 
        });

      const res = await axios.put(
        `https://manpower.cmti.online/bookings/${editingBooking.booking_id}`,
        null,
        { 
          params: { 
            remarks: editForm.remarks,
            remarks_update: editForm.remarks_update 
          } 
        }
      );

      console.log("[handleEditSubmit] response:", res.status, res.data);

      success = true;
      await fetchBookings();
    } catch (err) {
      console.error("[handleEditSubmit] update failed:", err, err?.response?.data || err?.message);
      alert("Failed to update remarks. See console for details.");
    } finally {
      setIsEditing(false);

      if (success) {
        setEditingBooking(null);
        setEditForm({ remarks: "", remarks_update: "waiting" });
        console.log("[handleEditSubmit] update successful — modal closed");
      } else {
        console.log("[handleEditSubmit] update not successful — modal remains open for retry");
      }
    }
  };

  const handleCancelEdit = () => {
    console.log("[handleCancelEdit] user cancelled edit");
    setEditingBooking(null);
    setEditForm({ remarks: "", remarks_update: "waiting" });
    setIsEditing(false);
  };

  const handleCloseRemarks = () => {
    console.log("[handleCloseRemarks] closing remarks modal");
    setViewingRemarks(null);
  };

  const getStatusBadge = (status) => {
    const cfg = {
      upcoming: { color: "blue", text: "Upcoming" },
      ongoing: { color: "yellow", text: "In Progress" },
      completed: { color: "green", text: "Completed" },
      unknown: { color: "gray", text: "Unknown" },
    };

    const c = cfg[status] || cfg.unknown;

    return (
      <span
        className={`px-3 py-1 text-xs rounded-full bg-${c.color}-100 text-${c.color}-800`}
      >
        {c.text}
      </span>
    );
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
        className={`px-3 py-1 text-xs rounded-full bg-${c.color}-100 text-${c.color}-800`}
      >
        {c.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-gray-500">Manage and track your service bookings</p>
          </div>
          <button
            onClick={() => { console.log("[Refresh button] clicked"); fetchBookings(); }}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card label="Total Bookings" value={stats.total} color="blue" />
          <Card label="Completed" value={stats.completed} color="green" />
          <Card label="In Progress" value={stats.ongoing} color="yellow" />
          <Card label="Upcoming" value={stats.upcoming} color="purple" />
        </div>

        {/* FILTERS */}
        <Filters filters={filters} handleFilterChange={handleFilterChange} />

        {/* EDIT MODAL */}
        {editingBooking && (
          <EditModal
            editingBooking={editingBooking}
            editForm={editForm}
            setEditForm={setEditForm}
            handleCancelEdit={handleCancelEdit}
            handleEditSubmit={handleEditSubmit}
            isEditing={isEditing}
          />
        )}

        {/* VIEW REMARKS MODAL */}
        {viewingRemarks && (
          <ViewRemarksModal
            booking={viewingRemarks}
            handleCloseRemarks={handleCloseRemarks}
            handleEditClick={handleEditClick}
          />
        )}

        {/* TABLE */}
        <BookingsTable
          filteredBookings={filteredBookings}
          getStatus={getStatus}
          getStatusBadge={getStatusBadge}
          getRemarksUpdateBadge={getRemarksUpdateBadge}
          handleEditClick={handleEditClick}
          handleViewRemarks={handleViewRemarks}
        />
      </div>
    </div>
  );
};

/* -------------------- REUSABLE UI COMPONENTS ---------------------- */

const Card = ({ label, value, color }) => (
  <div className="bg-white p-6 rounded shadow">
    <p className="text-gray-600">{label}</p>
    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const Filters = ({ filters, handleFilterChange }) => (
  <div className="bg-white rounded shadow p-6 mb-6">
    <h3 className="font-semibold mb-4">Filters</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Search */}
      <div>
        <label className="text-sm text-gray-700">Search</label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full mt-1 p-2 border rounded"
          placeholder="Search bookings..."
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-sm text-gray-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm text-gray-700">Date Range</label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange("dateRange", e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">Next 7 Days</option>
          <option value="month">Next 30 Days</option>
        </select>
      </div>
    </div>
  </div>
);

const EditModal = ({
  editingBooking,
  editForm,
  setEditForm,
  handleCancelEdit,
  handleEditSubmit,
  isEditing,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow w-96">
      <h3 className="text-lg font-semibold mb-4">
        Edit Remarks – {editingBooking.service_name}
      </h3>

      <form onSubmit={handleEditSubmit}>
        {/* Remarks Update Dropdown - Read-only since it auto-changes */}
        <div className="mb-4">
          <label className="text-sm text-gray-700">Status</label>
          <select
            value={editForm.remarks_update}
            onChange={(e) => setEditForm(prev => ({ ...prev, remarks_update: e.target.value }))}
            className="w-full mt-1 p-2 border rounded bg-gray-50"
            disabled
          >
            <option value="waiting">Waiting</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Status automatically changes to "Waiting" when remarks are edited
          </p>
        </div>

        {/* Remarks Textarea */}
        <div className="mb-4">
          <label className="text-sm text-gray-700">Remarks</label>
          <textarea
            rows="4"
            value={editForm.remarks}
            onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full p-2 border rounded mt-1"
            placeholder="Add your remarks..."
          />
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {isEditing ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ViewRemarksModal = ({ booking, handleCloseRemarks, handleEditClick }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow w-96 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">
        Remarks – {booking.service_name}
      </h3>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700">Remarks:</label>
        <div className="mt-2 p-4 bg-gray-50 border rounded max-h-48 overflow-y-auto">
          {booking.remarks ? (
            <p className="text-gray-800 whitespace-pre-wrap">{booking.remarks}</p>
          ) : (
            <p className="text-gray-400 italic">No remarks available</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleCloseRemarks}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            handleCloseRemarks();
            handleEditClick(booking);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Remarks
        </button>
      </div>
    </div>
  </div>
);

const BookingsTable = ({
  filteredBookings,
  getStatus,
  getStatusBadge,
  getRemarksUpdateBadge,
  handleEditClick,
  handleViewRemarks,
}) => (
  <div className="bg-white rounded shadow overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[
            "Service Details",
            "Staff",
            "Department",
            "Category",
            "Price Type",
            "Remarks",
            "Remarks Status",
            "Timeline",
            "Status",
            "Actions",
          ].map((h, i) => (
            <th
              key={i}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 bg-white">
        {filteredBookings.map((b, idx) => {
          const status = getStatus(b.start_date, b.end_date);
          const hasRemarks = b.remarks && b.remarks.trim().length > 0;

          return (
            <tr key={idx} className="hover:bg-gray-50">
              {/* SERVICE DETAILS */}
              <td className="px-6 py-4">
                <div className="font-semibold">{b.service_name}</div>
                <div className="text-gray-500 text-sm">ID: {b.service_id}</div>
              </td>

              {/* STAFF */}
              <td className="px-6 py-4">{b.manpower_name || "-"}</td>

              {/* DEPT */}
              <td className="px-6 py-4">{b.department || "-"}</td>

              {/* CATEGORY */}
              <td className="px-6 py-4 capitalize">{b.category || "-"}</td>

              {/* PRICE TYPE */}
              <td className="px-6 py-4">
                {b.price_type
                  ? b.price_type.replace("_", " ").toUpperCase()
                  : "-"}
              </td>

              {/* REMARKS - Only show button if remarks exist */}
              <td className="px-6 py-4">
                {hasRemarks ? (
                  <button
                    onClick={() => handleViewRemarks(b)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View Remarks
                  </button>
                ) : (
                  <span className="text-gray-400 italic">No remarks</span>
                )}
              </td>

              {/* REMARKS UPDATE STATUS */}
              <td className="px-6 py-4">
                {getRemarksUpdateBadge(b.remarks_update || "waiting")}
              </td>

              {/* TIMELINE */}
              <td className="px-6 py-4 text-sm">
                <div>
                  <strong>Start:</strong>{" "}
                  {b.start_date
                    ? new Date(b.start_date).toLocaleString("en-IN")
                    : "Not set"}
                </div>
                <div className="text-gray-500 mt-1">
                  <strong>End:</strong>{" "}
                  {b.end_date
                    ? new Date(b.end_date).toLocaleString("en-IN")
                    : "Not set"}
                </div>
              </td>

              {/* STATUS */}
              <td className="px-6 py-4">{getStatusBadge(status)}</td>

              {/* ACTIONS */}
              <td className="px-6 py-4">
                <button
                  onClick={() => handleEditClick(b)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Remarks
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default WorkerDashboard;
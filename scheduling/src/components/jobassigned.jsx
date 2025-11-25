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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("https://manpower.cmti.online/bookings/");
      setBookings(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setLoading(false);
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
    return bookings.filter(booking => {
      const status = getStatus(booking.start_date, booking.end_date);
      
      // Status filter
      if (filters.status !== "all" && status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch =
          (booking.service_name?.toLowerCase().includes(searchTerm)) ||
          (booking.manpower_name?.toLowerCase().includes(searchTerm)) ||
          (booking.location?.toLowerCase().includes(searchTerm)) ||
          (booking.service_id?.toString().toLowerCase().includes(searchTerm));

        
        if (!matchesSearch) return false;
      }
      
      // Date range filter
      if (filters.dateRange !== "all" && booking.start_date) {
        const startDate = new Date(booking.start_date);
        const now = new Date();
        const timeDiff = startDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        switch (filters.dateRange) {
          case "today":
            return startDate.toDateString() === now.toDateString();
          case "week":
            return daysDiff >= 0 && daysDiff <= 7;
          case "month":
            return daysDiff >= 0 && daysDiff <= 30;
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [bookings, filters]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(b => 
      getStatus(b.start_date, b.end_date) === "completed"
    ).length;
    const ongoing = bookings.filter(b => 
      getStatus(b.start_date, b.end_date) === "ongoing"
    ).length;
    const upcoming = bookings.filter(b => 
      getStatus(b.start_date, b.end_date) === "upcoming"
    ).length;

    return { total, completed, ongoing, upcoming };
  }, [bookings]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { color: "blue", text: "Upcoming" },
      ongoing: { color: "yellow", text: "In Progress" },
      completed: { color: "green", text: "Completed" },
      unknown: { color: "gray", text: "Unknown" }
    };

    const config = statusConfig[status] || statusConfig.unknown;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your service bookings
              </p>
            </div>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <div className="rounded-full bg-blue-500 w-6 h-6"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <div className="rounded-full bg-green-500 w-6 h-6"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <div className="rounded-full bg-yellow-500 w-6 h-6"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.ongoing}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <div className="rounded-full bg-purple-500 w-6 h-6"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search bookings..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  id="dateRange"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {/* Bookings Table */}
<div className="bg-white shadow rounded-lg overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">
      Bookings ({filteredBookings.length})
    </h3>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Service Details
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Staff
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Department
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Category
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Price Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Timeline
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Location
          </th> */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredBookings.length === 0 ? (
          <tr>
            <td colSpan="8" className="px-6 py-8 text-center"> {/* Updated colSpan from 5 to 8 */}
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No bookings found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </td>
          </tr>
        ) : (
          filteredBookings.map((booking, index) => {
            const status = getStatus(booking.start_date, booking.end_date);
            
            return (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.service_name || "Unnamed Service"}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {booking.service_id || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {booking.manpower_name || "Unassigned"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {booking.department || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 capitalize">
                    {booking.category || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {booking.price_type ? 
                      booking.price_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                      : "-"
                    }
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="text-gray-900">
                      <strong>Start:</strong>{" "}
                      {booking.start_date
                        ? new Date(booking.start_date).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Not set"}
                    </div>
                    <div className="text-gray-500 mt-1">
                      <strong>End:</strong>{" "}
                      {booking.end_date
                        ? new Date(booking.end_date).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Not set"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(status)}
                </td>
                {/* <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {booking.location || "Not specified"}
                  </div>
                </td> */}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
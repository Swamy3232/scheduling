import React, { useEffect, useState } from "react";
import axios from "axios";

const BOOKING_API = "https://manpower.cmti.online/bookings/";
const PRICE_API = "https://manpower.cmti.online/service_prices/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "month", "date"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // CMTI departments (all departments except 'OTHER')
  const cmtiDepartments = ["SMPM", "CMF", "MNTM", "ASMP", "AEAMT", "SVT", "PDE", "PAT"];

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

  // Fetch service prices and build lookup map
  const fetchPrices = async () => {
    try {
      const res = await axios.get(PRICE_API);
      const priceMap = {};

      res.data.forEach((p) => {
        if (!priceMap[p.service_id]) priceMap[p.service_id] = {};
        if (!priceMap[p.service_id][p.category])
          priceMap[p.service_id][p.category] = {};

        priceMap[p.service_id][p.category][p.price_type] = p.rate;
      });

      setPrices(priceMap);
    } catch (err) {
      console.error("Error fetching service prices:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBookings(), fetchPrices()]).then(() =>
      setLoading(false)
    );
  }, []);

  // Calculate status based on current time and end date
  const calculateStatus = (booking) => {
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);

    if (now < startDate) {
      return "upcoming";
    } else if (now >= startDate && now <= endDate) {
      return "ongoing";
    } else {
      return "completed";
    }
  };

  // Get unique months from bookings data
  const getUniqueMonths = () => {
    const months = bookings.map(booking => {
      const date = new Date(booking.start_date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    return [...new Set(months)].sort().reverse();
  };

  // Get unique dates from bookings data
  const getUniqueDates = () => {
    const dates = bookings.map(booking => {
      const date = new Date(booking.start_date);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    });
    return [...new Set(dates)].sort().reverse();
  };

  // Apply filters
  useEffect(() => {
    let filtered = bookings;
    
    // Category filter
    if (category) filtered = filtered.filter((b) => b.category === category);
    
    // Department filter
    if (department) {
      if (department === "INTER_DEPARTMENT") {
        // Show all CMTI departments (exclude 'OTHER')
        filtered = filtered.filter((b) => 
          b.department && cmtiDepartments.includes(b.department)
        );
      } else {
        filtered = filtered.filter((b) => b.department === department);
      }
    }

    // Date filters
    if (dateFilter === "month" && selectedMonth) {
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.start_date);
        const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        return bookingMonth === selectedMonth;
      });
    }

    if (dateFilter === "date" && selectedDate) {
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.start_date);
        const bookingDateStr = bookingDate.toISOString().split('T')[0];
        return bookingDateStr === selectedDate;
      });
    }

    setFilteredBookings(filtered);
  }, [category, department, dateFilter, selectedMonth, selectedDate, bookings]);

  const uniqueCategories = [
    ...new Set(bookings.map((b) => b.category).filter(Boolean)),
  ];
  
  // Get unique departments from bookings data
  const uniqueDepartmentsFromData = [
    ...new Set(bookings.map((b) => b.department).filter(Boolean)),
  ];

  // Price calculation using category + price_type - only for completed bookings
  const getBookingCost = (booking) => {
    // Only calculate cost if status is "completed"
    const status = calculateStatus(booking);
    if (status !== "completed") {
      return 0;
    }

    const rate =
      prices?.[booking.service_id]?.[booking.category]?.[
        booking.price_type
      ] || 0;

    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const diffMs = Math.abs(end - start);

    const hours = diffMs / 36e5;
    const days = hours / 24;

    if (booking.price_type === "per_hour") {
      return parseFloat((hours * rate).toFixed(2));
    }

    if (booking.price_type === "per_day") {
      return parseFloat((days * rate).toFixed(2));
    }

    if (booking.price_type === "per_sample") {
      return parseFloat(rate.toFixed(2));
    }

    return parseFloat((hours * rate).toFixed(2));
  };

  // Get display cost for UI (shows 0 for non-completed bookings)
  const getDisplayCost = (booking) => {
    return calculateStatus(booking) === "completed" ? getBookingCost(booking) : 0;
  };

  // Total cost only for completed bookings
  const totalAllBookings = filteredBookings.reduce(
    (acc, b) => acc + getBookingCost(b),
    0
  );

  // Count bookings by status for stats
  const getBookingsByStatus = (status) => {
    return filteredBookings.filter(b => calculateStatus(b) === status).length;
  };

  const completedBookingsCount = getBookingsByStatus("completed");
  const ongoingBookingsCount = getBookingsByStatus("ongoing");
  const upcomingBookingsCount = getBookingsByStatus("upcoming");

  // Reset date filters
  const resetDateFilters = () => {
    setDateFilter("all");
    setSelectedMonth("");
    setSelectedDate("");
  };

  // Export to CSV
  const exportToCSV = () => {
    setExportLoading(true);
    const headers = [
      "Booking ID",
      "Service",
      "Manpower",
      "Category",
      "Department",
      "Start Date",
      "End Date",
      "Price Type",
      "Status",
      "Cost (₹)",
    ];

    const csvData = filteredBookings.map((b) => {
      const status = calculateStatus(b);
      const cost = getBookingCost(b);
      return [
        b.booking_id,
        b.service_name,
        b.manpower_name,
        b.category || "-",
        b.department || "-",
        new Date(b.start_date).toLocaleString(),
        new Date(b.end_date).toLocaleString(),
        b.price_type,
        status,
        cost, // This will be 0 for non-completed bookings
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
      `Total,,${totalAllBookings.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  // Print report
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const tableRows = filteredBookings
      .map((b) => {
        const cost = getBookingCost(b);
        const status = calculateStatus(b);
        return `
          <tr>
            <td class="border px-4 py-2">${b.booking_id}</td>
            <td class="border px-4 py-2">${b.service_name}</td>
            <td class="border px-4 py-2">${b.manpower_name}</td>
            <td class="border px-4 py-2">${b.category || "-"}</td>
            <td class="border px-4 py-2">${b.department || "-"}</td>
            <td class="border px-4 py-2">${new Date(b.start_date).toLocaleString()}</td>
            <td class="border px-4 py-2">${new Date(b.end_date).toLocaleString()}</td>
            <td class="border px-4 py-2">${b.price_type}</td>
            <td class="border px-4 py-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }">${status}</span>
            </td>
            <td class="border px-4 py-2">${status === 'completed' ? `₹${cost}` : '-'}</td>
          </tr>`;
      })
      .join("");

    // Build filter info for print
    const filterInfo = [];
    if (category) filterInfo.push(`Category: ${category}`);
    if (department) filterInfo.push(`Department: ${department === "INTER_DEPARTMENT" ? "Inter Department (All CMTI)" : department}`);
    if (dateFilter === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      filterInfo.push(`Month: ${monthName} ${year}`);
    }
    if (dateFilter === "date" && selectedDate) {
      filterInfo.push(`Date: ${new Date(selectedDate).toLocaleDateString()}`);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Report - ${new Date().toLocaleDateString()}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 0.5in; size: landscape; }
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="bg-white p-6">
          <div class="mb-6 border-b pb-4">
            <h1 class="text-2xl font-bold text-gray-800">Booking Report</h1>
            <p class="text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
            <p class="text-sm text-gray-500 mt-1">Costs shown only for completed bookings</p>
            ${filterInfo.length > 0 ? `<p class="text-sm text-gray-500 mt-1">Filters: ${filterInfo.join(", ")}</p>` : ""}
          </div>
          <table class="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2 text-left">ID</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Service</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Manpower</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Category</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Department</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Start</th>
                <th class="border border-gray-300 px-4 py-2 text-left">End</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Price Type</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="bg-gray-50 font-semibold">
                <td colspan="9" class="border border-gray-300 px-4 py-2 text-right">Total (Completed Bookings)</td>
                <td class="border border-gray-300 px-4 py-2">₹${totalAllBookings.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Booking Reports</h1>
              <p className="text-gray-600 mt-1">Manage and analyze booking data - Costs shown only for completed bookings</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {filteredBookings.length} total
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {completedBookingsCount} completed
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {upcomingBookingsCount} upcoming
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {ongoingBookingsCount} ongoing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="INTER_DEPARTMENT">Inter Department (All CMTI)</option>
                  {uniqueDepartmentsFromData.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Filter
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setSelectedMonth("");
                    setSelectedDate("");
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="month">By Month</option>
                  <option value="date">By Date</option>
                </select>
              </div>
            </div>

            {/* Date-specific filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dateFilter === "month" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Month
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Select a month</option>
                    {getUniqueMonths().map((month) => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });
                      return (
                        <option key={month} value={month}>
                          {monthName} {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {dateFilter === "date" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="">Select a date</option>
                    {getUniqueDates().map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-end space-x-3">
                <button
                  onClick={() => {
                    setCategory("");
                    setDepartment("");
                    resetDateFilters();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{completedBookingsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-2xl font-semibold text-gray-900">{ongoingBookingsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-semibold text-gray-900">₹{totalAllBookings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                disabled={exportLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manpower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => {
                    const status = calculateStatus(b);
                    return (
                      <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.booking_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.service_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.manpower_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {b.category || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {b.department || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(b.start_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(b.end_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            b.price_type === 'per_hour' ? 'bg-blue-100 text-blue-800' :
                            b.price_type === 'per_day' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {b.price_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-800' :
                            status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {status === 'completed' ? `₹${getDisplayCost(b)}` : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your filters or check back later.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredBookings.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      Total (Completed Bookings)
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{totalAllBookings.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
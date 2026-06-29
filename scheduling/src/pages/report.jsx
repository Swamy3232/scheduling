import React, { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Download, Printer, Filter, Calendar, Clock, DollarSign, Users, CheckCircle, Zap, Beaker, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, StatusBadge } from "../components/ui";

const BOOKING_API = "https://manpower.cmti.online/bookings/";
const PRICE_API = "https://manpower.cmti.online/service_prices/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "month", "date", "calendar"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");
  const [priceType, setPriceType] = useState(""); // "per_hour", "per_sample", etc.
  const [selectedService, setSelectedService] = useState(""); // Selected service for detailed stats
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

    // Price type filter
    if (priceType) {
      filtered = filtered.filter((b) => b.price_type === priceType);
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

    if (dateFilter === "calendar" && selectedCalendarDate) {
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.start_date);
        const filterDate = new Date(selectedCalendarDate);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredBookings(filtered);
  }, [category, department, dateFilter, selectedMonth, selectedDate, selectedCalendarDate, priceType, bookings]);

  const uniqueCategories = [
    ...new Set(bookings.map((b) => b.category).filter(Boolean)),
  ];
  
  // Get unique departments from bookings data
  const uniqueDepartmentsFromData = [
    ...new Set(bookings.map((b) => b.department).filter(Boolean)),
  ];

  // Price calculation using category + price_type - only for completed bookings
  // Price calculation using category + price_type - only for completed bookings
const getBookingCost = (booking) => {
  // Only calculate cost if status is "completed"
  const status = calculateStatus(booking);
  if (status !== "completed") {
    return 0;
  }

  // Map inter-department to industrial for pricing
  const pricingCategory = booking.category === "inter-department" ? "industrial" : booking.category;

  const rate =
    prices?.[booking.service_id]?.[pricingCategory]?.[
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

  // Count bookings by price type
  const getBookingsByPriceType = (priceType) => {
    return filteredBookings.filter(b => b.price_type === priceType).length;
  };

  const perHourBookingsCount = getBookingsByPriceType("per_hour");
  const perSampleBookingsCount = getBookingsByPriceType("per_sample");
  const perDayBookingsCount = getBookingsByPriceType("per_day");

  // Service-specific stats
  const getServiceStats = () => {
    if (!selectedService) return null;

    const serviceBookings = filteredBookings.filter(b => b.service_name === selectedService);
    const completedServiceBookings = serviceBookings.filter(b => calculateStatus(b) === "completed");

    const totalHours = completedServiceBookings
      .filter(b => b.price_type === "per_hour")
      .reduce((acc, b) => {
        const start = new Date(b.start_date);
        const end = new Date(b.end_date);
        const hours = Math.abs(end - start) / 36e5;
        return acc + hours;
      }, 0);

    const totalSamples = completedServiceBookings
      .filter(b => b.price_type === "per_sample")
      .length;

    const totalCost = completedServiceBookings.reduce((acc, b) => acc + getBookingCost(b), 0);

    return {
      totalBookings: serviceBookings.length,
      completedBookings: completedServiceBookings.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalSamples,
      totalCost: Math.round(totalCost * 100) / 100
    };
  };

  const serviceStats = getServiceStats();

  // Reset date filters
  const resetDateFilters = () => {
    setDateFilter("all");
    setSelectedMonth("");
    setSelectedDate("");
    setSelectedCalendarDate("");
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
    if (category) {
  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  filterInfo.push(`Category: ${formattedCategory}`);
}

    if (department) filterInfo.push(`Department: ${department === "INTER_DEPARTMENT" ? "Inter Department (All CMTI)" : department}`);
    if (selectedService) filterInfo.push(`Service: ${selectedService}`);
    if (priceType) filterInfo.push(`Price Type: ${priceType.replace('_', ' ')}`);
    if (dateFilter === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      filterInfo.push(`Month: ${monthName} ${year}`);
    }
    if (dateFilter === "date" && selectedDate) {
      filterInfo.push(`Date: ${new Date(selectedDate).toLocaleDateString()}`);
    }
    if (dateFilter === "calendar" && selectedCalendarDate) {
      filterInfo.push(`Calendar Date: ${new Date(selectedCalendarDate).toLocaleDateString()}`);
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
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading report data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Reports</h1>
            <p className="text-gray-600 mt-1">Manage and analyze booking data - Costs shown only for completed bookings</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status="pending" label={`${filteredBookings.length} total`} />
            <StatusBadge status="active" label={`${completedBookingsCount} completed`} />
            <StatusBadge status="pending" label={`${upcomingBookingsCount} upcoming`} />
            <StatusBadge status="active" label={`${ongoingBookingsCount} ongoing`} />
          </div>
        </div>
        {/* Filters Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle leftIcon={<Filter size={20} />}>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="INTER_DEPARTMENT">Inter Department (All CMTI)</option>
                  {uniqueDepartmentsFromData.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">All Services</option>
                  {[...new Set(bookings.map(b => b.service_name).filter(Boolean))].map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                >
                  <option value="">All Price Types</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_sample">Per Sample</option>
                  <option value="per_day">Per Day</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setSelectedMonth("");
                    setSelectedDate("");
                    setSelectedCalendarDate("");
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="month">By Month</option>
                  <option value="date">By Date</option>
                  <option value="calendar">Calendar Picker</option>
                </select>
              </div>
            </div>

            {/* Date-specific filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dateFilter === "month" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
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
                        <option key={month} value={month}>{monthName} {year}</option>
                      );
                    })}
                  </select>
                </div>
              )}
              {dateFilter === "date" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="">Select a date</option>
                    {getUniqueDates().map((date) => (
                      <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              )}
              {dateFilter === "calendar" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pick Date from Calendar</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={selectedCalendarDate}
                    onChange={(e) => setSelectedCalendarDate(e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCategory("");
                    setDepartment("");
                    setSelectedService("");
                    setPriceType("");
                    resetDateFilters();
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{completedBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ongoing</p>
                  <p className="text-2xl font-semibold text-gray-900">{ongoingBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-3">
                  <DollarSign size={24} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-semibold text-gray-900">₹{totalAllBookings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Type Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-orange-100 p-3">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Per Hour Services</p>
                  <p className="text-2xl font-semibold text-gray-900">{perHourBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-teal-100 p-3">
                  <Beaker size={24} className="text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Per Sample Services</p>
                  <p className="text-2xl font-semibold text-gray-900">{perSampleBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 p-3">
                  <CalendarIcon size={24} className="text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Per Day Services</p>
                  <p className="text-2xl font-semibold text-gray-900">{perDayBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service-Specific Stats */}
        {serviceStats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Service Details: {selectedService}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Statistics for the selected service based on current filters</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-200 p-3">
                        <FileText size={24} className="text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-700">Total Bookings</p>
                        <p className="text-2xl font-bold text-blue-900">{serviceStats.totalBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-green-200 p-3">
                        <CheckCircle size={24} className="text-green-700" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-700">Completed</p>
                        <p className="text-2xl font-bold text-green-900">{serviceStats.completedBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-orange-200 p-3">
                        <Clock size={24} className="text-orange-700" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-700">Total Hours</p>
                        <p className="text-2xl font-bold text-orange-900">{serviceStats.totalHours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-teal-200 p-3">
                        <Beaker size={24} className="text-teal-700" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-teal-700">Total Samples</p>
                        <p className="text-2xl font-bold text-teal-900">{serviceStats.totalSamples}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-purple-200 p-3">
                        <DollarSign size={24} className="text-purple-700" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-700">Total Cost</p>
                        <p className="text-2xl font-bold text-purple-900">₹{serviceStats.totalCost}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Booking Details</CardTitle>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={exportToCSV}
                  disabled={exportLoading}
                  loading={exportLoading}
                  leftIcon={<Download size={18} />}
                >
                  {exportLoading ? "Exporting..." : "Export CSV"}
                </Button>
                <Button
                  onClick={handlePrint}
                  leftIcon={<Printer size={18} />}
                >
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.category || <span className="text-gray-400">-</span>}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.department || <span className="text-gray-400">-</span>}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(b.start_date).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(b.end_date).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 capitalize">
                              {b.price_type ? b.price_type.replace('_', ' ') : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 capitalize">
                              {b.workstatus ? b.workstatus.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'Pending'}
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
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredBookings.length > 0 && (
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Total (Completed Bookings)</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{totalAllBookings.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
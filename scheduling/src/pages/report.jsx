import React, { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Download, Printer, Filter, Calendar, Clock, IndianRupee, Users, CheckCircle, Info, RefreshCw, BarChart3, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../components/ui";

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

  // Price calculation
  const getBookingCost = (booking) => {
    const status = calculateStatus(booking);
    if (status !== "completed") {
      return 0;
    }

    const pricingCategory = booking.category === "inter-department" ? "industrial" : booking.category;
    const rate = prices?.[booking.service_id]?.[pricingCategory]?.[booking.price_type] || 0;

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

  const getDisplayCost = (booking) => {
    return calculateStatus(booking) === "completed" ? getBookingCost(booking) : 0;
  };

  // Total summary statistics calculations
  const totalStats = () => {
    let completedCount = 0;
    let ongoingCount = 0;
    let upcomingCount = 0;
    let revenue = 0;

    filteredBookings.forEach((b) => {
      const status = calculateStatus(b);
      if (status === "completed") {
        completedCount++;
        revenue += getBookingCost(b);
      } else if (status === "ongoing") {
        ongoingCount++;
      } else {
        upcomingCount++;
      }
    });

    return {
      completed: completedCount,
      ongoing: ongoingCount,
      upcoming: upcomingCount,
      totalRevenue: revenue.toFixed(2),
    };
  };

  const summary = totalStats();

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const headers = ["ID", "Service", "Department", "Category", "Engineer", "Price Type", "Revenue (₹)", "Status"];
      const csvData = filteredBookings.map(b => [
        b.booking_id,
        b.service_name,
        b.department || "-",
        b.category,
        b.manpower_name || "Unassigned",
        b.price_type,
        getDisplayCost(b),
        calculateStatus(b)
      ]);
      
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "amc_revenue_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>📊</span> Cost & Revenue Reports
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Generate departmental balance statements, machine usage metrics, and audit statistics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="h-11 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 font-medium px-4"
            leftIcon={<Printer size={16} />}
          >
            Print Statement
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={exportLoading}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
            leftIcon={<Download size={16} className={exportLoading ? "animate-spin" : ""} />}
          >
            Export Sheet
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Bookings</span>
              <span className="text-2xl font-extrabold text-gray-800 block">{filteredBookings.length}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Inspected Value</span>
              <span className="text-2xl font-extrabold text-emerald-600 block">₹{summary.totalRevenue}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Completed Jobs</span>
              <span className="text-2xl font-extrabold text-blue-600 block">{summary.completed}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active / Scheduled</span>
              <span className="text-2xl font-extrabold text-amber-600 block">
                {parseInt(summary.ongoing) + parseInt(summary.upcoming)}
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8 print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="">All Departments</option>
                <option value="INTER_DEPARTMENT">CMTI Departments (Internal)</option>
                <option value="OTHER">External Partners</option>
              </select>
            </div>

            {/* Price Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Pricing Type</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="">All Billing Types</option>
                <option value="per_hour">Per Hour</option>
                <option value="per_day">Per Day</option>
                <option value="per_sample">Per Sample</option>
              </select>
            </div>

            {/* Date filter type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Timeline Scope</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setSelectedMonth("");
                  setSelectedDate("");
                  setSelectedCalendarDate("");
                }}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="all">All Dates</option>
                <option value="month">Month-wise</option>
                <option value="date">Date-wise</option>
                <option value="calendar">Calendar Date-wise</option>
              </select>
            </div>

          </div>

          {/* Conditional Date Filter Selectors */}
          {dateFilter !== "all" && (
            <div className="pt-3 border-t border-gray-50 max-w-sm">
              {dateFilter === "month" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Select Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
                  >
                    <option value="">Choose Month...</option>
                    {getUniqueMonths().map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilter === "date" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Select Date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
                  >
                    <option value="">Choose Date...</option>
                    {getUniqueDates().map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilter === "calendar" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Choose Date</label>
                  <input
                    type="date"
                    value={selectedCalendarDate}
                    onChange={(e) => setSelectedCalendarDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* cost statement Table Card */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Aggregating statement lines...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No report statement matching criteria</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                We couldn't generate statement rows for the current filter settings. Try resetting your active filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pricing Metric</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">#{b.booking_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>⚙️</span>
                          <span>{b.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 font-medium">{b.department || "-"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.category === "industrial" ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {b.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-400 capitalize">{b.price_type?.replace("_", " ")}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-extrabold text-emerald-600">
                        {calculateStatus(b) === "completed" ? `₹${getBookingCost(b)}` : "₹0.00 (Pending)"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          calculateStatus(b) === "completed" 
                            ? "bg-gray-50 text-gray-700 border border-gray-200" 
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {calculateStatus(b) === "completed" ? "🟢 Completed" : "🔵 Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
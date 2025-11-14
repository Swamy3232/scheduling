import React, { useEffect, useState } from "react";
import axios from "axios";

const BOOKING_API = "https://manpower.cmti.online/bookings/";
const PRICE_API = "https://manpower.cmti.online/service_prices/";

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

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

  // Apply filters
  useEffect(() => {
    let filtered = bookings;
    if (category) filtered = filtered.filter((b) => b.category === category);
    if (department)
      filtered = filtered.filter((b) => b.department === department);

    setFilteredBookings(filtered);
  }, [category, department, bookings]);

  const uniqueCategories = [
    ...new Set(bookings.map((b) => b.category).filter(Boolean)),
  ];
  const uniqueDepartments = [
    ...new Set(bookings.map((b) => b.department).filter(Boolean)),
  ];

  // Price calculation using category + price_type
  const getBookingCost = (booking) => {
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

  const totalAllBookings = filteredBookings.reduce(
    (acc, b) => acc + getBookingCost(b),
    0
  );

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
      "Cost (₹)",
    ];

    const csvData = filteredBookings.map((b) => [
      b.booking_id,
      b.service_name,
      b.manpower_name,
      b.category || "-",
      b.department || "-",
      new Date(b.start_date).toLocaleString(),
      new Date(b.end_date).toLocaleString(),
      b.price_type,
      getBookingCost(b),
    ]);

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
            <td class="border px-4 py-2">₹${cost}</td>
          </tr>`;
      })
      .join("");

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
            ${category || department ? `<p class="text-sm text-gray-500 mt-1">Filters: ${[category, department].filter(Boolean).join(", ")}</p>` : ""}
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
                <th class="border border-gray-300 px-4 py-2 text-left">Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="bg-gray-50 font-semibold">
                <td colspan="8" class="border border-gray-300 px-4 py-2 text-right">Total</td>
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
              <p className="text-gray-600 mt-1">Manage and analyze booking data</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {filteredBookings.length} bookings
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end space-x-3">
                <button
                  onClick={() => {
                    setCategory("");
                    setDepartment("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Reset Filters
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-semibold text-gray-900">₹{totalAllBookings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-orange-100 p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueDepartments.length}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{getBookingCost(b)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
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
                    <td colSpan="8" className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      Total
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
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [priceType, setPriceType] = useState("");
  const [assignedManpower, setAssignedManpower] = useState("");
  const [availableManpower, setAvailableManpower] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    service: "",
    department: "",
    category: "",
    status: "",
    manpower: ""
  });

  // Fetch all services
  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/services/`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load services", "error");
    }
  };

  // Fetch all bookings - sort by newest first
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      // Sort by booking_id descending (newest first)
      const sortedBookings = res.data.sort((a, b) => b.booking_id - a.booking_id);
      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load bookings", "error");
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // Apply filters whenever filters or bookings change
  useEffect(() => {
    applyFilters();
  }, [filters, bookings]);

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.service) {
      filtered = filtered.filter(booking => 
        booking.service_name?.toLowerCase().includes(filters.service.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(booking => 
        booking.department === filters.department
      );
    }

    if (filters.category) {
      filtered = filtered.filter(booking => 
        booking.category === filters.category
      );
    }

    if (filters.status) {
      filtered = filtered.filter(booking => {
        const status = getBookingStatus(booking);
        return status === filters.status;
      });
    }

    if (filters.manpower) {
      filtered = filtered.filter(booking => 
        booking.manpower_name?.toLowerCase().includes(filters.manpower.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      service: "",
      department: "",
      category: "",
      status: "",
      manpower: ""
    });
  };

  // Message display helper
  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // Convert date formats
  const formatLocalDateTime = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    });
  };

  const toLocalInputFormat = (isoString) => {
    const d = new Date(isoString);
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const toUTC = (localValue) => {
    const date = new Date(localValue);
    return date.toISOString();
  };

  const getBookingStatus = (b) => {
    const now = new Date();
    const s = new Date(b.start_date);
    const e = new Date(b.end_date);
    if (now > e) return "completed";
    if (now >= s && now <= e) return "in-progress";
    return "upcoming";
  };

  const getStatusBadge = (b) => {
    const s = getBookingStatus(b);
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    if (s === "completed")
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Completed</span>;
    if (s === "in-progress")
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>In Progress</span>;
    return <span className={`${baseClasses} bg-blue-100 text-blue-600`}>Scheduled</span>;
  };

  // Fetch available manpower for selected service & time
  const fetchAvailableManpower = async () => {
    if (!selectedService || !startDate || !endDate) return;
    try {
      const res = await axios.get(`${API_URL}/bookings/api/service_manpower/${selectedService}`, {
        params: {
          start_date: toUTC(startDate),
          end_date: toUTC(endDate),
        },
      });
      setAvailableManpower(res.data);
      setErrors(prev => ({ ...prev, manpower: "" }));
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, manpower: "Failed to fetch available manpower" }));
    }
  };

  // Watch service or time changes
  useEffect(() => {
    fetchAvailableManpower();
    setAssignedManpower("");
  }, [selectedService, startDate, endDate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedService) newErrors.service = "Service is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (!category) newErrors.category = "Category is required";
    if (!department) newErrors.department = "Department is required";
    if (!priceType) newErrors.priceType = "Price type is required";
    if (!assignedManpower) newErrors.manpower = "Manpower selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createBooking = async () => {
    if (!validateForm()) {
      showMessage("Please fill all required fields correctly", "error");
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      
      const payload = {
        service_id: Number(selectedService),
        start_date: toUTC(startDate),
        end_date: toUTC(endDate),
        category,
        department,
        price_type: priceType,
        manpower_name: assignedManpower,
      };
      
      const res = await axios.post(`${API_URL}/bookings/?assigned_by=system`, payload);
      showMessage(`✅ Booking created successfully! Assigned to: ${res.data.manpower_name}`, "success");
      fetchBookings();
      resetForm();
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.detail || err.message;
      
      if (errorMessage.includes("already booked") || err.response?.status === 400) {
        if (errorMessage.includes("service")) {
          showMessage("🚫 Service is already booked for the selected time period. Please choose a different time slot.", "error");
        } else if (errorMessage.includes("manpower")) {
          showMessage("🚫 Selected manpower is already booked for this time period. Please choose another available person.", "error");
        } else {
          showMessage("🚫 This time slot is already booked. Please select a different time period.", "error");
        }
      } else {
        showMessage("❌ Error creating booking. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setEditId(b.booking_id);
    setSelectedService(b.service_id);
    setStartDate(toLocalInputFormat(b.start_date));
    setEndDate(toLocalInputFormat(b.end_date));
    setCategory(b.category || "");
    setDepartment(b.department || "");
    setPriceType(b.price_type || "");
    setAssignedManpower(b.manpower_name || "");
    setMessage({ text: "", type: "" });
    setErrors({});
    
    // Scroll to form
    document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
  };

  const updateBooking = async () => {
    if (!editId || !validateForm()) {
      showMessage("Please fill all required fields correctly", "error");
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      
      const params = {
        start_date: toUTC(startDate),
        end_date: toUTC(endDate),
        category,
        department,
        price_type: priceType,
        manpower_name: assignedManpower,
      };
      
      await axios.put(`${API_URL}/bookings/${editId}`, null, { params });
      showMessage("✅ Booking updated successfully!", "success");
      fetchBookings();
      resetForm();
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.detail || err.message;
      
      if (errorMessage.includes("already booked") || err.response?.status === 400) {
        if (errorMessage.includes("service")) {
          showMessage("🚫 Service is already booked for the selected time period. Please choose a different time slot.", "error");
        } else if (errorMessage.includes("manpower")) {
          showMessage("🚫 Selected manpower is already booked for this time period. Please choose another available person.", "error");
        } else {
          showMessage("🚫 This time slot is already booked. Please select a different time period.", "error");
        }
      } else {
        showMessage("❌ Error updating booking. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`${API_URL}/bookings/${id}`);
      showMessage("✅ Booking deleted successfully!", "success");
      fetchBookings();
    } catch (err) {
      showMessage("❌ Error deleting booking. Please try again.", "error");
    }
  };
  const Popup = ({ message, onClose }) => {
  if (!message.text) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center">
        <p
          className={`text-lg font-semibold ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </div>
  );
};

  const resetForm = () => {
    setSelectedService("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setDepartment("");
    setPriceType("");
    setAssignedManpower("");
    setAvailableManpower([]);
    setEditId(null);
    setMessage({ text: "", type: "" });
    setErrors({});
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  // Get unique values for filter dropdowns
  const uniqueDepartments = [...new Set(bookings.map(b => b.department).filter(Boolean))];
  const uniqueCategories = [...new Set(bookings.map(b => b.category).filter(Boolean))];
  const uniqueManpower = [...new Set(bookings.map(b => b.manpower_name).filter(Boolean))];

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Service Booking Management
              </h1>
              <p className="text-gray-600 text-lg">
                Manage and schedule service bookings efficiently
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {bookings.length} Total Bookings
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredBookings.length} results
              </div>
            </div>
          </div>
        </div>
        <Popup message={message} onClose={() => setMessage({ text: "", type: "" })} />

      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="xl:col-span-2">
            <div id="booking-form" className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editId ? `Edit Booking #${editId}` : "Create New Booking"}
                </h2>
                {editId && (
                  <button
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Message Display */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl border-2 font-semibold text-lg ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : message.type === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  {/* Service Selection */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Service *
    </label>
    <select
      value={selectedService}
      onChange={(e) => {
        setSelectedService(e.target.value);
        setErrors(prev => ({ ...prev, service: "" }));
      }}
      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        errors.service ? "border-red-300 bg-red-50" : "border-gray-300"
      } ${editId ? "bg-gray-100 cursor-not-allowed" : ""}`}
      disabled={!!editId}
    >
      <option value="">Select Service</option>
      {services.map((s) => (
        <option key={s.service_id} value={s.service_id}>
          {s.service_name}
        </option>
      ))}
    </select>
    {errors.service && (
      <p className="text-red-600 text-sm mt-1">{errors.service}</p>
    )}
  </div>

  {/* Category */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Category *
    </label>
    <select
      value={category}
      onChange={(e) => {
        setCategory(e.target.value);
        setErrors(prev => ({ ...prev, category: "" }));
      }}
      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        errors.category ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
    >
      <option value="">Select Category</option>
      <option value="academic">Academic</option>
      <option value="industrial">Industrial</option>
      <option value="inter-department">Inter Department</option>
    </select>
    {errors.category && (
      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
    )}
  </div>

  {/* Department - Conditionally rendered based on category */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Department *
    </label>
    
    {category === "inter-department" ? (
      // Dropdown for Inter Department
      <select
        value={department}
        onChange={(e) => {
          setDepartment(e.target.value);
          setErrors(prev => ({ ...prev, department: "" }));
        }}
        className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          errors.department ? "border-red-300 bg-red-50" : "border-gray-300"
        }`}
      >
        <option value="">Select Department</option>
        <option value="SMPM">SMPM</option>
        <option value="CMF">CMF</option>
        <option value="MNTM">MNTM</option>
        <option value="ASMP">ASMP</option>
        <option value="AEAMT">AEAMT</option>
        <option value="SVT">SVT</option>
        <option value="PDE">PDE</option>
        <option value="PAT">PAT</option>
        <option value="OTHER">OTHER</option>
      </select>
    ) : (
      // Text input for Academic and Industrial
      <input
        type="text"
        value={department}
        onChange={(e) => {
          setDepartment(e.target.value);
          setErrors(prev => ({ ...prev, department: "" }));
        }}
        placeholder="Enter department name"
        className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          errors.department ? "border-red-300 bg-red-50" : "border-gray-300"
        }`}
      />
    )}
    
    {errors.department && (
      <p className="text-red-600 text-sm mt-1">{errors.department}</p>
    )}
  </div>

  {/* Price Type */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Price Type *
    </label>
    <select
      value={priceType}
      onChange={(e) => {
        setPriceType(e.target.value);
        setErrors(prev => ({ ...prev, priceType: "" }));
      }}
      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        errors.priceType ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
    >
      <option value="">Select Price Type</option>
      <option value="per_hour">Per Hour</option>
      <option value="per_sample">Per Sample</option>
    </select>
    {errors.priceType && (
      <p className="text-red-600 text-sm mt-1">{errors.priceType}</p>
    )}
  </div>

  {/* Start Date */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Start Date & Time *
    </label>
    <input
      type="datetime-local"
      value={startDate}
      onChange={(e) => {
        setStartDate(e.target.value);
        setErrors(prev => ({ ...prev, startDate: "" }));
      }}
      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        errors.startDate ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
    />
    {errors.startDate && (
      <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
    )}
  </div>

  {/* End Date */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      End Date & Time *
    </label>
    <input
      type="datetime-local"
      value={endDate}
      onChange={(e) => {
        setEndDate(e.target.value);
        setErrors(prev => ({ ...prev, endDate: "" }));
      }}
      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        errors.endDate ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
    />
    {errors.endDate && (
      <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
    )}
  </div>

              </div>

              {/* Available Manpower */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Manpower *
                </label>
                <select
                  value={assignedManpower}
                  onChange={(e) => {
                    setAssignedManpower(e.target.value);
                    setErrors(prev => ({ ...prev, manpower: "" }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.manpower ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                >
                  <option value="">-- Select Available Manpower --</option>
                  {availableManpower.map((m) => (
                    <option key={m.manpower_id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.manpower && (
                  <p className="text-red-600 text-sm mt-1">{errors.manpower}</p>
                )}
                {availableManpower.length === 0 && selectedService && startDate && endDate && (
                  <p className="text-amber-600 text-sm mt-2">
                    ⚠️ No available manpower for selected time period. Please adjust your timing.
                  </p>
                )}
                {availableManpower.length > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    ✅ {availableManpower.length} manpower available for selected period
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {editId ? (
                  <button
                    onClick={updateBooking}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                  >
                    {loading ? "🔄 Updating..." : "💾 Update Booking"}
                  </button>
                ) : (
                  <button
                    onClick={createBooking}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                  >
                    {loading ? "🔄 Creating..." : "📝 Create Booking"}
                  </button>
                )}
              </div>
            </div>

            {/* Bookings Table with Filters */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h3 className="text-xl font-semibold text-gray-800">Current Bookings</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Showing {filteredBookings.length} of {bookings.length} bookings</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters Row */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Service Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
                    <input
                      type="text"
                      placeholder="Filter by service..."
                      value={filters.service}
                      onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Departments</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="upcoming">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Manpower Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Manpower</label>
                    <input
                      type="text"
                      placeholder="Filter by manpower..."
                      value={filters.manpower}
                      onChange={(e) => setFilters(prev => ({ ...prev, manpower: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-96">
  <table className="w-full">
    <thead className="bg-gray-50 sticky top-0">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Booking ID
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Service
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Manpower
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Department
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Price Type
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Time Period
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredBookings.map((b) => (
        <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            #{b.booking_id}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {b.service_name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {b.manpower_name || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {b.department || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
            {b.category || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {b.price_type ? b.price_type.replace('_', ' ') : "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
            <div>{formatLocalDateTime(b.start_date)}</div>
            <div className="text-gray-400">to</div>
            <div>{formatLocalDateTime(b.end_date)}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getStatusBadge(b)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex space-x-3">
              <button
                onClick={() => handleEdit(b)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBooking(b.booking_id)}
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => viewBookingDetails(b)}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                View
              </button>
            </div>
          </td>
        </tr>
      ))}
      {filteredBookings.length === 0 && (
        <tr>
          <td
            colSpan={9} // Updated colSpan from 6 to 9
            className="px-6 py-12 text-center text-gray-500 text-sm"
          >
            {bookings.length === 0 
              ? "No bookings found. Create your first booking above."
              : "No bookings match your filters. Try adjusting your search criteria."
            }
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
            </div>
          </div>

          {/* Right Column - Stats and Quick Actions */}
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Total Bookings</span>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {bookings.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">In Progress</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {bookings.filter(b => getBookingStatus(b) === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700 font-medium">Scheduled</span>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {bookings.filter(b => getBookingStatus(b) === 'upcoming').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Completed</span>
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {bookings.filter(b => getBookingStatus(b) === 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-medium transition-colors text-left"
                >
                  🗑️ Clear Form
                </button>
                <button
                  onClick={fetchBookings}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-xl font-medium transition-colors text-left"
                >
                  🔄 Refresh Data
                </button>
                <button
                  onClick={() => document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-xl font-medium transition-colors text-left"
                >
                  📝 New Booking
                </button>
                <button
                  onClick={clearFilters}
                  className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-3 rounded-xl font-medium transition-colors text-left"
                >
                  🗂️ Clear Filters
                </button>
              </div>
            </div>

            {/* Available Services */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Services</h3>
              <div className="space-y-2">
                {services.slice(0, 5).map((service) => (
                  <div key={service.service_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{service.service_name}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      ID: {service.service_id}
                    </span>
                  </div>
                ))}
                {services.length > 5 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    +{services.length - 5} more services
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  Booking Details #{selectedBooking.booking_id}
                </h3>
                <button
                  onClick={closeBookingDetails}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-lg font-semibold">{selectedBooking.service_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manpower</label>
                  <p className="text-lg font-semibold">{selectedBooking.manpower_name || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg font-semibold capitalize">{selectedBooking.category || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg font-semibold">{selectedBooking.department || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Price Type</label>
                  <p className="text-lg font-semibold">{selectedBooking.price_type ? selectedBooking.price_type.replace('_', ' ') : "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedBooking)}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Time Period</label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="font-semibold">{formatLocalDateTime(selectedBooking.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="font-semibold">{formatLocalDateTime(selectedBooking.end_date)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    handleEdit(selectedBooking);
                    closeBookingDetails();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Edit Booking
                </button>
                <button
                  onClick={closeBookingDetails}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
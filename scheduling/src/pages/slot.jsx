import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Modal, ModalHeader, ModalBody, ModalFooter, StatusBadge } from "../components/ui";

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
  const [customers, setCustomers] = useState([]);

  // Department options based on category
  const getDepartmentOptions = () => {
    if (category === "inter-department") {
      // For inter-department, show CMTI department codes
      return ["SMPM", "CMF", "MNTM", "ASMP", "AEAMT", "SVT", "PDE", "PAT", "OTHER"];
    } else if (category === "academic") {
      // For academic, show academic customers
      return customers
        .filter(c => c.type === "Academic")
        .map(c => c.customer_name)
        .sort();
    } else if (category === "industrial") {
      // For industrial, show industrial customers
      return customers
        .filter(c => c.type === "Industrial")
        .map(c => c.customer_name)
        .sort();
    }
    return [];
  };

  // Filter states
  const [filters, setFilters] = useState({
    service: "",
    department: "",
    category: "",
    status: "",
    manpower: "",
    dateFilterType: "all", // "all", "month", "date"
    selectedMonth: "",
    selectedDate: ""
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

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers/`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load customers", "error");
    }
  };

  // Fetch all bookings - sort by newest first
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      console.log("Total bookings from API:", res.data.length);
      console.log("Sample booking data:", res.data[0]);
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
    fetchCustomers();
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
      const searchTerm = filters.manpower.toLowerCase().trim();
      filtered = filtered.filter(booking => {
        const manpowerName = booking.manpower_name?.toLowerCase().trim() || "";
        // Match if the search term is contained in the name (handles partial matches)
        return manpowerName.includes(searchTerm);
      });
    }

    // Date filters
    if (filters.dateFilterType === "month" && filters.selectedMonth) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        const bookingMonth = bookingDate.getFullYear() + '-' + String(bookingDate.getMonth() + 1).padStart(2, '0');
        return bookingMonth === filters.selectedMonth;
      });
    }

    if (filters.dateFilterType === "date" && filters.selectedDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.start_date).toDateString();
        const filterDate = new Date(filters.selectedDate).toDateString();
        return bookingDate === filterDate;
      });
    }

    setFilteredBookings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      service: "",
      department: "",
      category: "",
      status: "",
      manpower: "",
      dateFilterType: "all",
      selectedMonth: "",
      selectedDate: ""
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
    return <StatusBadge status={s === "completed" ? "inactive" : s === "in-progress" ? "active" : "pending"} />;
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
    showMessage(
      "🚫 Service is already booked for the selected time period. Please choose a different time slot.",
      "error"
    );

  } else if (errorMessage.includes("manpower")) {
    showMessage(
      "🚫 Selected manpower is already booked for this time period. Please choose another available person.",
      "error"
    );

  } else if (errorMessage.includes("on leave")) {
    showMessage(
      "🚫 The selected manpower is on leave during this time. Please choose another available person.",
      "error"
    );

  } else {
    showMessage(
      "🚫 This time slot is already booked. Please select a different time period.",
      "error"
    );
  }

} else {
  showMessage(
    "❌ Error creating booking. Please try again.",
    "error"
  );
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
      <Modal isOpen={!!message.text} onClose={onClose} size="sm">
        <ModalBody>
          <p className={`text-lg font-semibold text-center ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}>
            {message.text}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} fullWidth>OK</Button>
        </ModalFooter>
      </Modal>
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
  const uniqueManpower = [...new Set(bookings.map(b => b.manpower_name?.trim()).filter(Boolean))];

  const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Booking Management</h1>
            <p className="text-gray-600">Manage and schedule service bookings efficiently</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
            <Button
              variant="secondary"
              onClick={fetchBookings}
              leftIcon={<RefreshCw size={20} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Popup message={message} onClose={() => setMessage({ text: "", type: "" })} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="xl:col-span-2">
            <Card id="booking-form" className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editId ? `Edit Booking #${editId}` : "Create New Booking"}</CardTitle>
                  {editId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["academic", "industrial", "inter-department"].map((cat) => (
                        <label
                          key={cat}
                          className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            category === cat
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={category === cat}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              setErrors(prev => ({ ...prev, category: "" }));
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="text-sm font-medium capitalize text-center">{cat.replace("-", " ")}</span>
                        </label>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {category && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department *
                      </label>
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
                        {getDepartmentOptions().map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="text-red-600 text-sm mt-1">{errors.department}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                <div className="flex space-x-4">
                  {editId ? (
                    <Button
                      onClick={updateBooking}
                      disabled={loading}
                      loading={loading}
                      fullWidth
                      size="lg"
                    >
                      Update Booking
                    </Button>
                  ) : (
                    <Button
                      onClick={createBooking}
                      disabled={loading}
                      loading={loading}
                      fullWidth
                      size="lg"
                      variant="success"
                    >
                      Create Booking
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bookings Table with Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Current Bookings</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Showing {filteredBookings.length} of {bookings.length} bookings</span>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filters Row */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input
                    label="Service"
                    placeholder="Filter by service..."
                    value={filters.service}
                    onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                    leftIcon={<Search size={18} className="text-gray-400" />}
                    containerClassName=""
                  />

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

                  <Input
                    label="Manpower"
                    placeholder="Filter by manpower..."
                    value={filters.manpower}
                    onChange={(e) => setFilters(prev => ({ ...prev, manpower: e.target.value }))}
                    containerClassName=""
                  />
                </div>

                {/* Date Filters Row */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date Filter</label>
                    <select
                      value={filters.dateFilterType}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dateFilterType: e.target.value,
                        selectedMonth: "",
                        selectedDate: ""
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Dates</option>
                      <option value="month">Month-wise</option>
                      <option value="date">Date-wise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Month</label>
                    <input
                      type="month"
                      value={filters.selectedMonth}
                      onChange={(e) => setFilters(prev => ({ ...prev, selectedMonth: e.target.value }))}
                      disabled={filters.dateFilterType !== "month"}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Date</label>
                    <input
                      type="date"
                      value={filters.selectedDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, selectedDate: e.target.value }))}
                      disabled={filters.dateFilterType !== "date"}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
              
            <Card className="overflow-hidden">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(b)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteBooking(b.booking_id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewBookingDetails(b)}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
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
            </Card>
          </div>

          {/* Right Column - Stats and Quick Actions */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Statistics</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={resetForm}
                    leftIcon={<Trash2 size={18} />}
                  >
                    Clear Form
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={fetchBookings}
                    leftIcon={<RefreshCw size={18} />}
                  >
                    Refresh Data
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' })}
                    leftIcon={<Calendar size={18} />}
                  >
                    New Booking
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={clearFilters}
                    leftIcon={<Filter size={18} />}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Services */}
            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal isOpen={!!selectedBooking} onClose={closeBookingDetails} size="md">
          <ModalHeader>
            <CardTitle>Booking Details #{selectedBooking.booking_id}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
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
          </ModalBody>
          <ModalFooter>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  handleEdit(selectedBooking);
                  closeBookingDetails();
                }}
                className="flex-1"
              >
                Edit Booking
              </Button>
              <Button
                variant="secondary"
                onClick={closeBookingDetails}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
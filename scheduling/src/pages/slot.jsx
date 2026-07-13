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
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Briefcase,
  Layers,
  DollarSign,
  Activity,
  Award,
  BookOpen,
  Info,
  Check,
  Eye,
  Sliders,
  Copy,
  Printer,
  Download,
  AlertTriangle,
  MoreVertical,
  MoreHorizontal
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Modal, ModalHeader, ModalBody, ModalFooter, StatusBadge, Textarea } from "../components/ui";

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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    customer_name: "",
    type: "",
    phone_number: "",
    email: "",
    address: "",
  });
  const [customerLoading, setCustomerLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [openActionDropdownId, setOpenActionDropdownId] = useState(null);

  // Department options based on category
  const getDepartmentOptions = () => {
    if (category === "inter-department") {
      return ["SMPM", "CMF", "MNTM", "ASMP", "AEAMT", "SVT", "PDE", "PAT", "OTHER"];
    } else if (category === "academic") {
      return customers
        .filter(c => c.type === "Academic")
        .map(c => c.customer_name)
        .sort();
    } else if (category === "industrial") {
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
    dateFilterType: "all",
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

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/bookings/`);
      const sortedBookings = res.data.sort((a, b) => b.booking_id - a.booking_id);
      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCustomers();
    fetchBookings();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
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
        return manpowerName.includes(searchTerm);
      });
    }

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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

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

  // KPI Calculations
  const todayStr = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.start_date).toDateString() === todayStr).length;
  const activeBookings = bookings.filter(b => {
    const now = new Date();
    return now >= new Date(b.start_date) && now <= new Date(b.end_date);
  }).length;
  const pendingBookings = bookings.filter(b => b.workstatus === "pending" || !b.workstatus).length;
  const completedBookings = bookings.filter(b => b.workstatus === "completed" || getBookingStatus(b) === "completed").length;

  // Top Work-forces Leaderboard Calculation
  const getTopWorkforces = () => {
    const counts = {};
    bookings.forEach(b => {
      if (b.manpower_name) {
        counts[b.manpower_name] = (counts[b.manpower_name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  // Service Usage calculation
  const getServiceUsage = () => {
    const counts = {};
    bookings.forEach(b => {
      if (b.service_name) {
        counts[b.service_name] = (counts[b.service_name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
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

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionDropdownId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
          showMessage("🚫 Service is already booked for the selected time period. Please choose a different slot.", "error");
        } else if (errorMessage.includes("manpower")) {
          showMessage("🚫 Selected manpower is already booked for this time period. Please choose another available person.", "error");
        } else if (errorMessage.includes("on leave")) {
          showMessage("🚫 The selected manpower is on leave during this time. Please choose another available person.", "error");
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
    setShowBookingForm(true);
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
          showMessage("🚫 Service is already booked for the selected time. Please choose a different time slot.", "error");
        } else if (errorMessage.includes("manpower")) {
          showMessage("🚫 Selected manpower is already booked. Please choose another available person.", "error");
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

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/bookings/${deleteConfirmId}`);
      showMessage("✅ Booking deleted successfully!", "success");
      fetchBookings();
      setDeleteConfirmId(null);
    } catch (err) {
      showMessage("❌ Error deleting booking. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerDuplicate = (b) => {
    resetForm();
    setSelectedService(b.service_id);
    setCategory(b.category || "");
    setDepartment(b.department || "");
    setPriceType(b.price_type || "");
    setStartDate(toLocalInputFormat(new Date().toISOString()));
    setEndDate(toLocalInputFormat(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()));
    setShowBookingForm(true);
    showMessage("📋 Booking fields copied. Select available manpower to duplicate.", "info");
  };

  // const triggerDownload = (b) => {
  //   const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(b, null, 2));
  //   const downloadAnchor = document.createElement('a');
  //   downloadAnchor.setAttribute("href", dataStr);
  //   downloadAnchor.setAttribute("download", `booking_${b.booking_id}.json`);
  //   document.body.appendChild(downloadAnchor);
  //   downloadAnchor.click();
  //   downloadAnchor.remove();
  //   showMessage("📥 Booking details downloaded successfully", "success");
  // };

  const triggerPrint = (b) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>CMTI Booking Details #${b.booking_id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #1e3a8a; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; }
            .footer { border-top: 1px solid #e2e8f0; pt-20px; margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">CMTI SERVICE BOOKING DETAIL</h1>
            <p style="margin: 5px 0 0 0; color: #64748b;">Booking Reference: #${b.booking_id}</p>
          </div>
          <div class="grid">
            <div>
              <div class="label">Service Name</div>
              <div class="value">${b.service_name}</div>
            </div>
            <div>
              <div class="label">Assigned Manpower</div>
              <div class="value">${b.manpower_name || "Unassigned"}</div>
            </div>
            <div>
              <div class="label">Category</div>
              <div class="value" style="text-transform: capitalize;">${b.category || "-"}</div>
            </div>
            <div>
              <div class="label">Customer / Department</div>
              <div class="value">${b.department || "-"}</div>
            </div>
            <div>
              <div class="label">Price Model</div>
              <div class="value">${b.price_type ? b.price_type.replace('_', ' ') : "-"}</div>
            </div>
            <div>
              <div class="label">Scheduled Time</div>
              <div class="value">${formatLocalDateTime(b.start_date)} to ${formatLocalDateTime(b.end_date)}</div>
            </div>
            <div>
              <div class="label">Created By / Assigned By</div>
              <div class="value" style="text-transform: capitalize;">${b.assigned_by || "System"}</div>
            </div>
            <div>
              <div class="label">Work Status</div>
              <div class="value" style="text-transform: capitalize;">${b.workstatus || "Pending"}</div>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <div class="label">Special Instructions / Remarks</div>
            <div class="value" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${b.remarks || "No remarks entered."}</div>
          </div>
          <div class="footer">
            CMTI Service Booking Management Portal &copy; ${new Date().getFullYear()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      setCustomerLoading(true);
      const payload = {
        customer_name: customerForm.customer_name?.trim() || null,
        type: customerForm.type || null,
        phone_number: customerForm.phone_number?.trim() || null,
        email: customerForm.email?.trim() || null,
        address: customerForm.address?.trim() || null,
      };
      const res = await axios.post(`${API_URL}/customers/`, payload);
      showMessage("✅ Customer/Department added successfully!", "success");

      const updatedCustomers = [...customers, res.data];
      setCustomers(updatedCustomers);

      if (res.data.customer_name) {
        setDepartment(res.data.customer_name);
        setErrors(prev => ({ ...prev, department: "" }));
      }

      setCustomerForm({
        customer_name: "",
        type: "",
        phone_number: "",
        email: "",
        address: "",
      });
      setIsCustomerModalOpen(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      showMessage("❌ Failed to add customer. Please try again.", "error");
    } finally {
      setCustomerLoading(false);
    }
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
    setShowBookingForm(false);
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  // Get unique filter values
  const uniqueDepartments = [...new Set(bookings.map(b => b.department).filter(Boolean))];
  const uniqueCategories = [...new Set(bookings.map(b => b.category).filter(Boolean))];
  const uniqueManpower = [...new Set(bookings.map(b => b.manpower_name?.trim()).filter(Boolean))];

  const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all");

  // Status badges mapping
  const renderStatusBadge = (b) => {
    const s = getBookingStatus(b);
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            🟢 Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            🔵 In Progress
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            🟠 Scheduled
          </span>
        );
    }
  };

  // Work status chips mapping
  const renderWorkStatusChip = (workstatus) => {
    const ws = (workstatus || "pending").toLowerCase();
    switch (ws) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle size={12} /> Completed
          </span>
        );
      case "in progress":
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
            <Activity size={12} /> In Progress
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertCircle size={12} /> Paused
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800">
            <X size={12} /> Rejected
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
            <AlertTriangle size={12} /> Cancelled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  // Duration calculation helper
  const getDurationHours = (start, end) => {
    if (!start || !end) return "0";
    const diff = new Date(end) - new Date(start);
    const hrs = (diff / (1000 * 60 * 60)).toFixed(1);
    return `${hrs} ${Number(hrs) === 1 ? 'Hour' : 'Hours'}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="w-full px-6 py-8 max-w-none">

        {/* Top Header Banner */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>📅</span> Service Booking Management
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage service bookings, scheduling, Work-forces, and customer requests.
              </p>
            </div>
          </div>

          {/* Quick Actions & KPIs */}
          <div className="flex flex-wrap items-center gap-6">

            {/* KPI Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="px-4 py-1.5 border-r border-gray-200 last:border-0 text-center md:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Bookings</span>
                <p className="text-lg font-bold text-gray-800 leading-none mt-1">{bookings.length}</p>
              </div>
              <div className="px-4 py-1.5 border-r border-gray-200 last:border-0 text-center md:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Today's Bookings</span>
                <p className="text-lg font-bold text-blue-600 leading-none mt-1">{todayBookings}</p>
              </div>
              <div className="px-4 py-1.5 border-r border-gray-200 last:border-0 text-center md:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Active</span>
                <p className="text-lg font-bold text-emerald-600 leading-none mt-1">{activeBookings}</p>
              </div>
              <div className="px-4 py-1.5 last:border-0 text-center md:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pending</span>
                <p className="text-lg font-bold text-amber-600 leading-none mt-1">{pendingBookings}</p>
              </div>
            </div>

            {/* Header Control Buttons */}
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
                onClick={() => {
                  resetForm();
                  setShowBookingForm(true);
                }}
                className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
                leftIcon={<Plus size={18} />}
              >
                New Booking
              </Button>
            </div>
          </div>
        </div>

        {/* Global Notifications popup */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 shadow-sm ${message.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : message.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Analytics Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Card 2: Top Work-forces Leaderboard */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-50">
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-amber-500" /> Work Assigned
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {getTopWorkforces().length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No Work-force data available</div>
              ) : (
                getTopWorkforces().map((eng, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {eng.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{eng.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Workforce Member</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-gray-100 font-bold px-2 py-0.5 rounded-full text-gray-700">
                        {eng.count} Jobs
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 3: Top Services Demanded */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-50">
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={16} className="text-emerald-500" /> Popular Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {getServiceUsage().length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No service data available</div>
              ) : (
                getServiceUsage().map((srv, idx) => {
                  const maxCount = Math.max(...getServiceUsage().map(s => s.count)) || 1;
                  const pct = Math.round((srv.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 truncate max-w-[200px]" title={srv.name}>{srv.name}</span>
                        <span className="font-bold text-gray-500">{srv.count} Bookings</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter and Advanced Toolbar */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white mb-8 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={16} className="text-blue-500" /> Search & Advanced Filter Console
              </CardTitle>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Clear All
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-end">

              {/* Service Input Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Service</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.service}
                    onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                    placeholder="Search service..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Department Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Booking Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="upcoming">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Manpower Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Work-force</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.manpower}
                    onChange={(e) => setFilters(prev => ({ ...prev, manpower: e.target.value }))}
                    placeholder="Search Work-force..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Date Filter Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Date Filter</label>
                <select
                  value={filters.dateFilterType}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateFilterType: e.target.value,
                    selectedMonth: "",
                    selectedDate: ""
                  }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Dates</option>
                  <option value="month">Month-wise</option>
                  <option value="date">Date-wise</option>
                </select>
              </div>

              {/* Select Month / Date Conditional */}
              {filters.dateFilterType === "month" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Select Month</label>
                  <input
                    type="month"
                    value={filters.selectedMonth}
                    onChange={(e) => setFilters(prev => ({ ...prev, selectedMonth: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              )}

              {filters.dateFilterType === "date" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Select Date</label>
                  <input
                    type="date"
                    value={filters.selectedDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, selectedDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              )}

              {/* Clear button container alignment */}
              <div className="xl:col-span-1">
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full h-9 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Main Enterprise Bookings Data Table Card */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-800">Current Booking Database</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Showing {filteredBookings.length} of {bookings.length} system bookings</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {/* Table Container */}
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Work-Force
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Time Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Work Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {loading ? (
                    // Skeleton shimmer loader
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-12"></div></td>
                        <td className="px-4 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                            <div className="h-4 bg-gray-100 rounded w-20"></div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                        <td className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded-full w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-20"></div></td>
                      </tr>
                    ))
                  ) : currentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={32} />
                          </div>
                          <h4 className="text-base font-bold text-gray-800">No bookings match criteria</h4>
                          <p className="text-gray-400 text-xs mt-1.5">
                            Try resetting your active filters or create a new booking using the header controls.
                          </p>
                          <Button
                            variant="secondary"
                            onClick={clearFilters}
                            className="mt-5 h-9 text-xs rounded-xl"
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentBookings.map((b) => (
                      <tr
                        key={b.booking_id}
                        className="hover:bg-blue-50/10 cursor-pointer transition-colors group"
                        onClick={() => viewBookingDetails(b)}
                      >
                        {/* ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">
                          #{b.booking_id}
                        </td>

                        {/* Row Actions Dropdown */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-left text-xs font-semibold relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionDropdownId(openActionDropdownId === b.booking_id ? null : b.booking_id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                            title="Actions"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {openActionDropdownId === b.booking_id && (
                            <div className="absolute left-4 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-scale-in">
                              <button
                                onClick={() => {
                                  viewBookingDetails(b);
                                  setOpenActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Eye size={13} className="text-gray-400" /> View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleEdit(b);
                                  setOpenActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Edit size={13} className="text-gray-400" /> Edit Booking
                              </button>
                              <button
                                onClick={() => {
                                  triggerDuplicate(b);
                                  setOpenActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Copy size={13} className="text-gray-400" /> Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  triggerPrint(b);
                                  setOpenActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Printer size={13} className="text-gray-400" /> Print Reference
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(b.booking_id);
                                  setOpenActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} className="text-red-500" /> Delete Booking
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Service Card */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-base">⚙️</span>
                            <div>
                              <p className="text-gray-900 font-semibold">{b.service_name}</p>
                              <span className="text-[10px] text-gray-400 font-medium">Service Reference</span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 font-medium">
                          {b.department || "-"}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${b.category === "academic"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : b.category === "industrial"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : "bg-gray-50 text-gray-700 border border-gray-100"
                            }`}>
                            {b.category ? b.category.replace("-", " ") : "-"}
                          </span>
                        </td>

                        {/* Work-force avatar column */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                              {b.manpower_name ? b.manpower_name.charAt(0) : "U"}
                            </div>
                            <div>
                              <p className="text-gray-800 font-semibold">{b.manpower_name || "Unassigned"}</p>
                              <span className="text-[9px] text-gray-400">Work-force</span>
                            </div>
                          </div>
                        </td>

                        {/* Booking Period */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <Calendar size={11} className="text-gray-400" />
                              {new Date(b.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] flex items-center gap-1 text-gray-400">
                              <Clock size={11} className="text-gray-300" />
                              {new Date(b.start_date).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}
                              <span>-</span>
                              {new Date(b.end_date).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.2 rounded w-fit mt-0.5">
                              {getDurationHours(b.start_date, b.end_date)}
                            </span>
                          </div>
                        </td>

                        {/* Price Type */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 font-semibold uppercase">
                          {b.price_type ? b.price_type.replace('_', ' ') : "-"}
                        </td>

                        {/* Work Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderWorkStatusChip(b.workstatus)}
                        </td>

                        {/* Booking Status Badge */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderStatusBadge(b)}
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate" title={b.remarks}>
                          {b.remarks || "-"}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {filteredBookings.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                  <span>Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>records per page (Total: {filteredBookings.length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-1 text-gray-300 text-xs">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Booking Form Creator Modal */}
      {showBookingForm && (
        <Modal isOpen={showBookingForm} onClose={resetForm} size="lg">
          <ModalHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              {editId ? `Edit Service Booking #${editId}` : "Schedule New Service Booking"}
            </CardTitle>
          </ModalHeader>
          <ModalBody>
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 ${message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
                }`}>
                {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

              {/* Service selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Service *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setErrors(prev => ({ ...prev, service: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.service ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    } ${editId ? "bg-gray-50 cursor-not-allowed text-gray-500" : ""}`}
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
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.service}</p>
                )}
              </div>

              {/* Category radio choices */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["academic", "industrial", "inter-department"].map((cat) => (
                    <label
                      key={cat}
                      className={`relative flex items-center justify-center py-2.5 border rounded-xl cursor-pointer transition-all ${category === cat
                        ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
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
                      <span className="text-[11px] capitalize text-center leading-none">{cat.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.category}</p>
                )}
              </div>

              {/* Department Dropdown options */}
              {category && (
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Customer / Department *
                    </label>
                    {(category === "academic" || category === "industrial") && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerForm({
                            customer_name: "",
                            type: category === "academic" ? "Academic" : "Industrial",
                            phone_number: "",
                            email: "",
                            address: "",
                          });
                          setIsCustomerModalOpen(true);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={12} /> Add New Customer
                      </button>
                    )}
                  </div>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setErrors(prev => ({ ...prev, department: "" }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.department ? "border-red-300 bg-red-50/50" : "border-gray-200"
                      }`}
                  >
                    <option value="">Select Customer / Department</option>
                    {getDepartmentOptions().map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{errors.department}</p>
                  )}
                </div>
              )}

              {/* Price Type */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Price Model *
                </label>
                <select
                  value={priceType}
                  onChange={(e) => {
                    setPriceType(e.target.value);
                    setErrors(prev => ({ ...prev, priceType: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.priceType ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    }`}
                >
                  <option value="">Select Pricing</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_sample">Per Sample</option>
                </select>
                {errors.priceType && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.priceType}</p>
                )}
              </div>

              {/* Timing details */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setErrors(prev => ({ ...prev, startDate: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.startDate ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setErrors(prev => ({ ...prev, endDate: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.endDate ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.endDate}</p>
                )}
              </div>

              {/* Manpower field */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Available Work-force Manpower *
                </label>
                <select
                  value={assignedManpower}
                  onChange={(e) => {
                    setAssignedManpower(e.target.value);
                    setErrors(prev => ({ ...prev, manpower: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm bg-white ${errors.manpower ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    }`}
                >
                  <option value="">-- Choose Available Staff --</option>
                  {availableManpower.map((m) => (
                    <option key={m.manpower_id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.manpower && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.manpower}</p>
                )}
                {availableManpower.length === 0 && selectedService && startDate && endDate && (
                  <p className="text-red-500 text-[11px] mt-2 flex items-center gap-1 font-semibold">
                    <AlertCircle size={12} /> No Work-forces available for this period. Try adjusting timings.
                  </p>
                )}
                {availableManpower.length > 0 && (
                  <p className="text-green-600 text-[11px] mt-2 flex items-center gap-1 font-semibold">
                    <CheckCircle size={12} /> {availableManpower.length} certified Work-forces available
                  </p>
                )}
              </div>

            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                onClick={resetForm}
                className="flex-1 h-11 rounded-xl text-gray-600 font-semibold"
              >
                Cancel
              </Button>
              {editId ? (
                <Button
                  onClick={updateBooking}
                  disabled={loading}
                  loading={loading}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Update Booking
                </Button>
              ) : (
                <Button
                  onClick={createBooking}
                  disabled={loading || availableManpower.length === 0}
                  loading={loading}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm disabled:opacity-40"
                >
                  Confirm Booking
                </Button>
              )}
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* Booking Details Dialog Modal */}
      {selectedBooking && (
        <Modal isOpen={!!selectedBooking} onClose={closeBookingDetails} size="md">
          <ModalHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Booking Reference Detail</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">#{selectedBooking.booking_id}</span>
            </CardTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Service</label>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedBooking.service_name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Assigned Staff</label>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedBooking.manpower_name || "Unassigned"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Client Category</label>
                  <p className="text-sm font-semibold text-gray-800 capitalize mt-0.5">{selectedBooking.category || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Department</label>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedBooking.department || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Price Model</label>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedBooking.price_type ? selectedBooking.price_type.replace('_', ' ') : "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Status</label>
                  <div className="mt-1">{renderStatusBadge(selectedBooking)}</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Assigned Time Period</label>
                <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Start:</span>
                    <span className="font-bold text-gray-800">{formatLocalDateTime(selectedBooking.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">End:</span>
                    <span className="font-bold text-gray-800">{formatLocalDateTime(selectedBooking.end_date)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-blue-100/50 pt-2 mt-1">
                    <span className="text-blue-600 font-bold">Total Duration:</span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {getDurationHours(selectedBooking.start_date, selectedBooking.end_date)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.remarks && (
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Remarks & Details</label>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 break-words leading-relaxed">
                    {selectedBooking.remarks}
                  </p>
                </div>
              )}

            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => {
                  handleEdit(selectedBooking);
                  closeBookingDetails();
                }}
                className="flex-grow h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Edit Booking
              </Button>
              <Button
                variant="secondary"
                onClick={closeBookingDetails}
                className="flex-grow h-11 rounded-xl"
              >
                Close Window
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* Customer Creation Modal */}
      {isCustomerModalOpen && (
        <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} size="md">
          <ModalHeader>
            <CardTitle className="text-base font-bold text-gray-900">Add New Customer Profile</CardTitle>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Customer / Department Name
                </label>
                <Input
                  name="customer_name"
                  value={customerForm.customer_name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter organization or client name"
                  leftIcon={<User size={16} className="text-gray-400" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Type
                </label>
                <select
                  value={customerForm.type}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select Type</option>
                  <option value="Academic">Academic</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <Input
                  name="phone_number"
                  type="tel"
                  value={customerForm.phone_number}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Enter contact number (optional)"
                  leftIcon={<Phone size={16} className="text-gray-400" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address (optional)"
                  leftIcon={<Mail size={16} className="text-gray-400" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Address
                </label>
                <Textarea
                  name="address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete office/billing address (optional)"
                  leftIcon={<MapPin size={16} className="text-gray-400" />}
                  rows={3}
                />
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => setIsCustomerModalOpen(false)}
                disabled={customerLoading}
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomerSubmit}
                loading={customerLoading}
                disabled={customerLoading}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Add Customer
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (
        <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} size="sm">
          <ModalHeader>
            <span className="text-red-600 font-bold text-base flex items-center gap-1.5">
              <AlertTriangle size={20} /> Danger Zone: Delete Booking
            </span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete service booking <strong className="text-gray-800">#{deleteConfirmId}</strong>?
            </p>
            <p className="text-xs text-red-500 font-semibold mt-2">
              ⚠️ Warning: This operation is destructive and cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-10 rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Confirm Delete
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

    </div>
  );
}
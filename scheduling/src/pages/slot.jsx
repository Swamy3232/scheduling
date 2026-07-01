import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Table,
  Tag,
  Form,
  DatePicker,
  Radio,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Alert,
  Tooltip,
  message,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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

  // Form visibility state
  const [showForm, setShowForm] = useState(false);

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
    if (type === "success") {
      message.success(text);
    } else if (type === "error") {
      message.error(text);
    } else {
      message.info(text);
    }
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
    return dayjs(isoString);
  };

  const toUTC = (dayjsValue) => {
    return dayjsValue.toISOString();
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
    const statusConfig = {
      "completed": { color: "default", text: "Completed" },
      "in-progress": { color: "processing", text: "In Progress" },
      "upcoming": { color: "blue", text: "Scheduled" },
    };
    const config = statusConfig[s];
    return <Tag color={config.color}>{config.text}</Tag>;
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
    if (startDate && endDate && startDate.isAfter(endDate) || startDate.isSame(endDate)) {
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
    setShowForm(true);
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
    Modal.confirm({
      title: "Are you sure you want to delete this booking?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/bookings/${id}`);
          message.success("Booking deleted successfully!");
          fetchBookings();
        } catch (err) {
          message.error("Error deleting booking. Please try again.");
        }
      },
    });
  };

  const resetForm = () => {
    setSelectedService("");
    setStartDate(null);
    setEndDate(null);
    setCategory("");
    setDepartment("");
    setPriceType("");
    setAssignedManpower("");
    setAvailableManpower([]);
    setEditId(null);
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
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      <Card>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <Title level={2}>Service Booking Management</Title>
            <Text type="secondary">Manage and schedule service bookings efficiently</Text>
          </div>
          <Space>
            <div style={{ textAlign: "right" }}>
              <Title level={3} style={{ margin: 0, color: "#1890ff" }}>{bookings.length}</Title>
              <Text type="secondary">Total Bookings</Text>
            </div>
            <Button
              type="primary"
              icon={showForm ? <CloseOutlined /> : <PlusOutlined />}
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm && editId) {
                  resetForm();
                }
              }}
            >
              {showForm ? "Cancel" : "Create Booking"}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBookings}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Booking Form */}
          {showForm && (
            <Card id="booking-form" title={editId ? `Edit Booking #${editId}` : "Create New Booking"} 
              extra={editId && <Button onClick={resetForm}>Cancel Edit</Button>}>
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Service" validateStatus={errors.service ? "error" : ""} help={errors.service}>
                      <Select
                        value={selectedService}
                        onChange={(value) => {
                          setSelectedService(value);
                          setErrors(prev => ({ ...prev, service: "" }));
                        }}
                        disabled={!!editId}
                        placeholder="Select Service"
                      >
                        {services.map((s) => (
                          <Select.Option key={s.service_id} value={s.service_id}>
                            {s.service_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Category" validateStatus={errors.category ? "error" : ""} help={errors.category}>
                      <Radio.Group
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setErrors(prev => ({ ...prev, category: "" }));
                        }}
                        style={{ width: "100%" }}
                      >
                        <Space direction="horizontal" style={{ width: "100%", justifyContent: "space-between" }}>
                          <Radio.Button value="academic">Academic</Radio.Button>
                          <Radio.Button value="industrial">Industrial</Radio.Button>
                          <Radio.Button value="inter-department">Inter-Dept</Radio.Button>
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                  </Col>

                  {category && (
                    <Col span={12}>
                      <Form.Item label="Department" validateStatus={errors.department ? "error" : ""} help={errors.department}>
                        <Select
                          value={department}
                          onChange={(value) => {
                            setDepartment(value);
                            setErrors(prev => ({ ...prev, department: "" }));
                          }}
                          placeholder="Select Department"
                        >
                          {getDepartmentOptions().map((dept) => (
                            <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                  <Col span={12}>
                    <Form.Item label="Price Type" validateStatus={errors.priceType ? "error" : ""} help={errors.priceType}>
                      <Select
                        value={priceType}
                        onChange={(value) => {
                          setPriceType(value);
                          setErrors(prev => ({ ...prev, priceType: "" }));
                        }}
                        placeholder="Select Price Type"
                      >
                        <Select.Option value="per_hour">Per Hour</Select.Option>
                        <Select.Option value="per_sample">Per Sample</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Start Date & Time" validateStatus={errors.startDate ? "error" : ""} help={errors.startDate}>
                      <DatePicker
                        showTime
                        value={startDate}
                        onChange={(value) => {
                          setStartDate(value);
                          setErrors(prev => ({ ...prev, startDate: "" }));
                        }}
                        style={{ width: "100%" }}
                        format="YYYY-MM-DD HH:mm"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="End Date & Time" validateStatus={errors.endDate ? "error" : ""} help={errors.endDate}>
                      <DatePicker
                        showTime
                        value={endDate}
                        onChange={(value) => {
                          setEndDate(value);
                          setErrors(prev => ({ ...prev, endDate: "" }));
                        }}
                        style={{ width: "100%" }}
                        format="YYYY-MM-DD HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Available Manpower" validateStatus={errors.manpower ? "error" : ""} help={errors.manpower}>
                  <Select
                    value={assignedManpower}
                    onChange={(value) => {
                      setAssignedManpower(value);
                      setErrors(prev => ({ ...prev, manpower: "" }));
                    }}
                    placeholder="Select Available Manpower"
                    style={{ width: "100%" }}
                  >
                    {availableManpower.map((m) => (
                      <Select.Option key={m.manpower_id} value={m.name}>
                        {m.name}
                      </Select.Option>
                    ))}
                  </Select>
                  {availableManpower.length === 0 && selectedService && startDate && endDate && (
                    <Alert
                      message="No available manpower for selected time period. Please adjust your timing."
                      type="warning"
                      showIcon
                      style={{ marginTop: "8px" }}
                    />
                  )}
                  {availableManpower.length > 0 && (
                    <Text type="success" style={{ display: "block", marginTop: "8px" }}>
                      ✓ {availableManpower.length} manpower available for selected period
                    </Text>
                  )}
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    onClick={editId ? updateBooking : createBooking}
                    loading={loading}
                    size="large"
                    block
                  >
                    {editId ? "Update Booking" : "Create Booking"}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* Bookings Table with Filters */}
          <Card>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level={4}>Current Bookings</Title>
              <Space>
                <Text type="secondary">Showing {filteredBookings.length} of {bookings.length} bookings</Text>
                {hasActiveFilters && (
                  <Button size="small" onClick={clearFilters}>Clear Filters</Button>
                )}
              </Space>
            </div>

            {/* Filters Row */}
            <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Input
                  placeholder="Filter by service..."
                  value={filters.service}
                  onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  value={filters.department}
                  onChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
                  placeholder="All Departments"
                  style={{ width: "100%" }}
                  allowClear
                >
                  {uniqueDepartments.map(dept => (
                    <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  value={filters.category}
                  onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  placeholder="All Categories"
                  style={{ width: "100%" }}
                  allowClear
                >
                  {uniqueCategories.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Select
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  placeholder="All Status"
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Select.Option value="upcoming">Scheduled</Select.Option>
                  <Select.Option value="in-progress">In Progress</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Input
                  placeholder="Filter by manpower..."
                  value={filters.manpower}
                  onChange={(e) => setFilters(prev => ({ ...prev, manpower: e.target.value }))}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>

            {/* Date Filters Row */}
            <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
              <Col xs={24} sm={8} md={8}>
                <Select
                  value={filters.dateFilterType}
                  onChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    dateFilterType: value,
                    selectedMonth: "",
                    selectedDate: ""
                  }))}
                  style={{ width: "100%" }}
                >
                  <Select.Option value="all">All Dates</Select.Option>
                  <Select.Option value="month">Month-wise</Select.Option>
                  <Select.Option value="date">Date-wise</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Input
                  type="month"
                  value={filters.selectedMonth}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedMonth: e.target.value }))}
                  disabled={filters.dateFilterType !== "month"}
                  style={{ width: "100%" }}
                />
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Input
                  type="date"
                  value={filters.selectedDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedDate: e.target.value }))}
                  disabled={filters.dateFilterType !== "date"}
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>
          </Card>

          <Card>
            <Table
              dataSource={filteredBookings}
              rowKey="booking_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true, y: 400 }}
              columns={[
                {
                  title: "Booking ID",
                  dataIndex: "booking_id",
                  key: "booking_id",
                  render: (id) => <Text strong>#{id}</Text>,
                },
                {
                  title: "Service",
                  dataIndex: "service_name",
                  key: "service_name",
                },
                {
                  title: "Manpower",
                  dataIndex: "manpower_name",
                  key: "manpower_name",
                  render: (name) => name || "-",
                },
                {
                  title: "Department",
                  dataIndex: "department",
                  key: "department",
                  render: (dept) => dept || "-",
                },
                {
                  title: "Category",
                  dataIndex: "category",
                  key: "category",
                  render: (cat) => cat ? <span style={{ textTransform: "capitalize" }}>{cat}</span> : "-",
                },
                {
                  title: "Price Type",
                  dataIndex: "price_type",
                  key: "price_type",
                  render: (type) => type ? type.replace('_', ' ') : "-",
                },
                {
                  title: "Time Period",
                  key: "time_period",
                  render: (_, record) => (
                    <div>
                      <div>{formatLocalDateTime(record.start_date)}</div>
                      <Text type="secondary">to</Text>
                      <div>{formatLocalDateTime(record.end_date)}</div>
                    </div>
                  ),
                },
                {
                  title: "Status",
                  key: "status",
                  render: (_, record) => getStatusBadge(record),
                },
                {
                  title: "Actions",
                  key: "actions",
                  render: (_, record) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteBooking(record.booking_id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        onClick={() => viewBookingDetails(record)}
                      >
                        View
                      </Button>
                    </Space>
                  ),
                },
              ]}
              locale={{
                emptyText: bookings.length === 0 
                  ? "No bookings found. Create your first booking above."
                  : "No bookings match your filters. Try adjusting your search criteria."
              }}
            />
          </Card>

          {/* Booking Details Modal */}
          <Modal
            open={!!selectedBooking}
            onCancel={closeBookingDetails}
            footer={null}
            width={600}
          >
            <Title level={4}>Booking Details #{selectedBooking?.booking_id}</Title>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Service</Text>
                <br />
                <Text strong>{selectedBooking?.service_name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Manpower</Text>
                <br />
                <Text strong>{selectedBooking?.manpower_name || "Not assigned"}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Category</Text>
                <br />
                <Text strong style={{ textTransform: "capitalize" }}>{selectedBooking?.category || "-"}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Department</Text>
                <br />
                <Text strong>{selectedBooking?.department || "-"}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Price Type</Text>
                <br />
                <Text strong>{selectedBooking?.price_type ? selectedBooking.price_type.replace('_', ' ') : "-"}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <br />
                {selectedBooking && getStatusBadge(selectedBooking)}
              </Col>
            </Row>
            <Divider />
            <Text type="secondary">Time Period</Text>
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <Text type="secondary">Start:</Text>
                <Text strong>{formatLocalDateTime(selectedBooking?.start_date)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">End:</Text>
                <Text strong>{formatLocalDateTime(selectedBooking?.end_date)}</Text>
              </div>
            </div>
            <Divider />
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  handleEdit(selectedBooking);
                  closeBookingDetails();
                }}
              >
                Edit Booking
              </Button>
              <Button onClick={closeBookingDetails}>Close</Button>
            </Space>
          </Modal>
        </Space>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Clock,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, Modal, ModalHeader, ModalBody, ModalFooter, Badge, StatusBadge, Textarea } from "../components/ui";

const API_URL = "https://manpower.cmti.online/api/services";

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [form, setForm] = useState({ service_name: "", description: "", status: "active" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, active, inactive
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0
  });

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/`);
      setServices(res.data);
      setFilteredServices(res.data);
      calculateStats(res.data);
      setMessage({ text: "Services loaded successfully", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to load services", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = services;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (activeTab === "active") {
      filtered = filtered.filter(service => service.status !== "inactive");
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(service => service.status === "inactive");
    }

    setFilteredServices(filtered);
    calculateStats(filtered);
  }, [searchTerm, activeTab, services]);

  const calculateStats = (data) => {
    const activeCount = data.filter(s => s.status !== "inactive").length;
    const inactiveCount = data.filter(s => s.status === "inactive").length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    setStats({
      total: data.length,
      active: activeCount,
      inactive: inactiveCount,
      recentlyAdded: data.filter(s => new Date(s.created_at) > weekAgo).length
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        setMessage({ text: "Service updated successfully!", type: "success" });
      } else {
        await axios.post(`${API_URL}/`, form);
        setMessage({ text: "Service added successfully!", type: "success" });
      }
      resetForm();
      fetchServices();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: err.response?.data?.detail || "Operation failed. Please try again.", 
        type: "error" 
      });
    }
  };

  const resetForm = () => {
    setForm({ service_name: "", description: "", status: "active" });
    setEditingId(null);
  };

  const handleEdit = (service) => {
    setForm({
      service_name: service.service_name,
      description: service.description || "",
      status: service.status || "active"
    });
    setEditingId(service.service_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMessage({ text: "Service deleted successfully!", type: "success" });
      fetchServices();
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to delete service", type: "error" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;
    if (!window.confirm(`Delete ${selectedServices.length} selected services?`)) return;
    
    try {
      await Promise.all(selectedServices.map(id => axios.delete(`${API_URL}/${id}`)));
      setMessage({ text: `${selectedServices.length} services deleted!`, type: "success" });
      setSelectedServices([]);
      fetchServices();
    } catch (err) {
      console.error(err);
      setMessage({ text: "Bulk delete failed", type: "error" });
    }
  };

  const toggleSelectService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(serviceId => serviceId !== id)
        : [...prev, id]
    );
  };

  const selectAllServices = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map(s => s.service_id));
    }
  };

  // Stats Cards
  const StatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Services</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <BarChart3 className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Services</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="h-10 w-10 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mt-2">Ready for booking</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Recently Added</p>
              <p className="text-3xl font-bold mt-1">{stats.recentlyAdded}</p>
            </div>
            <TrendingUp className="h-10 w-10 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mt-2">Last 7 days</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Inactive</p>
              <p className="text-3xl font-bold mt-1">{stats.inactive}</p>
            </div>
            <Clock className="h-10 w-10 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mt-2">Requires attention</p>
        </CardContent>
      </Card>
    </div>
  );

  // Modal Component
  const ServiceModal = () => (
    <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} size="md">
      <ModalHeader>
        <CardTitle>{editingId ? "Edit Service" : "Add New Service"}</CardTitle>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Name"
            value={form.service_name}
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            required
            placeholder="Enter service name"
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Enter description (optional)"
          />

          {/* <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div> */}
        </form>
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => { setShowModal(false); resetForm(); }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
          >
            {editingId ? "Update Service" : "Add Service"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600">Manage and organize all services</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowModal(true)}
              leftIcon={<Plus size={20} />}
            >
              Add Service
            </Button>
            <Button
              variant="secondary"
              onClick={fetchServices}
              leftIcon={<RefreshCw size={20} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <StatsCards />

        {/* Controls Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={20} className="text-gray-400" />}
                className="max-w-md"
                containerClassName="flex-1"
              />

              {selectedServices.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedServices.length} selected
                  </span>
                  <Button
                    variant="danger"
                    onClick={handleBulkDelete}
                    leftIcon={<Trash2 size={18} />}
                    size="sm"
                  >
                    Delete Selected
                  </Button>
                </div>
              )}

              <div className="flex border border-gray-300 rounded-lg p-1">
                {["all", "active", "inactive"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {tab} ({tab === "all" ? stats.total : tab === "active" ? stats.active : stats.inactive})
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <Table
            columns={[
              { key: 'serial', label: 'S.No' },
              { key: 'service_name', label: 'Service Name' },
              { key: 'description', label: 'Description' },
            ]}
            data={filteredServices}
            loading={loading}
            stickyHeader={true}
            render={(value, row, column, rowIndex) => {
              if (column === 'serial') {
                return <span className="font-mono text-sm text-gray-600">{rowIndex + 1}</span>;
              }
              if (column === 'service_name') {
                return <span className="font-medium text-gray-900">{row.service_name}</span>;
              }
              if (column === 'description') {
                return <span className="text-sm text-gray-600 max-w-xs truncate">{row.description || "No description"}</span>;
              }
              return value;
            }}
          />
        </Card>
      </div>

      <ServiceModal />
    </div>
  );
};

export default ServiceManager;
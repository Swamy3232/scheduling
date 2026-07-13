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
  Layers,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui";

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

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>⚙️</span> Service Competency Catalog
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Configure machinery, calibration protocols, and maintenance job profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchServices}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          {selectedServices.length > 0 && (
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              className="h-11 rounded-xl font-medium px-4 shadow-sm"
              leftIcon={<Trash2 size={16} />}
            >
              Delete ({selectedServices.length})
            </Button>
          )}
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
            leftIcon={<Plus size={18} />}
          >
            Add Service
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 shadow-sm ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Services</span>
              <span className="text-2xl font-extrabold text-gray-800 block">{stats.total}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Templates</span>
              <span className="text-2xl font-extrabold text-emerald-600 block">{stats.active}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Disabled Templates</span>
              <span className="text-2xl font-extrabold text-gray-400 block">{stats.inactive}</span>
            </div>
            <div className="p-3 bg-gray-50 text-gray-400 rounded-xl">
              <XCircle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Added Recently</span>
              <span className="text-2xl font-extrabold text-blue-600 block">{stats.recentlyAdded}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List Card Container */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        
        {/* Filters Toolbar */}
        <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by title, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All Templates
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "inactive" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Inactive
              </button>
            </div>

          </div>
        </CardHeader>

        {/* Database List */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Fetching machinery catalog...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No services found</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                We couldn't find any templates matching your search criteria. Add a new service catalog entry.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                        onChange={selectAllServices}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Template Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredServices.map((service) => (
                    <tr key={service.service_id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.service_id)}
                          onChange={() => toggleSelectService(service.service_id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚙️</span>
                          <span>{service.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-sm truncate" title={service.description}>
                        {service.description || "-"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          service.status !== "inactive"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${service.status !== "inactive" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                          {service.status !== "inactive" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.service_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Entry Modal Sheet */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span>{editingId ? "Edit Catalog Entry" : "Create Service Template"}</span>
            </div>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-4">
              <Input
                label="Service Template Name *"
                name="service_name"
                value={form.service_name}
                onChange={(e) => setForm(prev => ({ ...prev, service_name: e.target.value }))}
                placeholder="e.g. CNC Machine Calibration"
                required
              />

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Catalog Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="active">Active Template</option>
                  <option value="inactive">Inactive Template</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Service Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter scope of work description..."
                  rows={4}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Save Changes" : "Create Template"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ServiceManager;
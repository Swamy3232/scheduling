import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  Search,
  Filter,
  Download,
  Users,
  Briefcase,
  GraduationCap,
  RefreshCw,
  Info,
  CalendarDays
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Textarea } from "../components/ui";

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    type: "",
    phone_number: "",
    email: "",
    address: "",
  });

  const API_URL = "https://manpower.cmti.online/customers/";

  // Type options with icons
  const typeOptions = [
    { 
      value: "Industrial", 
      label: "Industrial Partner", 
      icon: Briefcase,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      badgeColor: "bg-purple-500"
    },
    { 
      value: "Academic", 
      label: "Academic Partner", 
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      badgeColor: "bg-blue-500"
    }
  ];

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Create new customer
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_URL, form);
      setCustomers([...customers, res.data]);
      setForm({
        customer_name: "",
        type: "",
        phone_number: "",
        email: "",
        address: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to add customer. Please try again.");
    }
  };

  // Update customer
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}${editingCustomer.customer_id}`, form);
      setCustomers(customers.map(c => 
        c.customer_id === editingCustomer.customer_id ? res.data : c
      ));
      setEditingCustomer(null);
      setForm({
        customer_name: "",
        type: "",
        phone_number: "",
        email: "",
        address: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer. Please try again.");
    }
  };

  // Delete customer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${API_URL}${id}`);
      setCustomers(customers.filter((c) => c.customer_id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error.response || error);
      alert("Failed to delete customer. Please try again.");
    }
  };

  // Start editing customer
  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      customer_name: customer.customer_name,
      type: customer.type,
      phone_number: customer.phone_number || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setShowForm(true);
  };

  // Cancel edit/create
  const cancelEdit = () => {
    setEditingCustomer(null);
    setShowForm(false);
    setForm({
      customer_name: "",
      type: "",
      phone_number: "",
      email: "",
      address: "",
    });
  };

  // Filter customers based on search and type filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone_number?.includes(searchTerm);
    const matchesType = filterType === "all" || customer.type === filterType;
    return matchesSearch && matchesType;
  });

  // Export customers to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Type", "Phone", "Email", "Address"];
    const csvData = filteredCustomers.map(c => [
      c.customer_id,
      c.customer_name,
      c.type,
      c.phone_number || "",
      c.email || "",
      c.address || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const option = typeOptions.find(opt => opt.value === type);
    if (!option) return null;
    
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${option.color} border`}>
        <Icon size={12} />
        {option.label}
      </span>
    );
  };

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>👥</span> Customer Relationship Catalog
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage client records, contact channels, addresses, and partner accounts.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchCustomers}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={exportToCSV}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<Download size={16} />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => {
              cancelEdit();
              setShowForm(true);
            }}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
            leftIcon={<Plus size={18} />}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Registered Accounts</span>
              <span className="text-2xl font-extrabold text-gray-800 block">{customers.length}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Industrial Partners</span>
              <span className="text-2xl font-extrabold text-purple-600 block">
                {customers.filter(c => c.type === "Industrial").length}
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Academic Partners</span>
              <span className="text-2xl font-extrabold text-blue-600 block">
                {customers.filter(c => c.type === "Academic").length}
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Database Table */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        
        {/* Filters Toolbar */}
        <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 justify-end">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-600 font-semibold"
              >
                <option value="all">All Customer Types</option>
                <option value="Industrial">Industrial Partner</option>
                <option value="Academic">Academic Partner</option>
              </select>
            </div>

          </div>
        </CardHeader>

        {/* Database List */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Fetching customer database...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No records found</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                We couldn't find any customers matching your criteria. Try resetting filters or add a new customer.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Channels</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Details</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredCustomers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">#{c.customer_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {c.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{c.customer_name}</p>
                            <span className="block mt-0.5">{getTypeBadge(c.type)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        <div className="space-y-1">
                          {c.phone_number && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400" />
                              {c.phone_number}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <Mail size={12} className="text-gray-400" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate" title={c.address}>
                        {c.address ? (
                          <span className="flex items-start gap-1">
                            <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="truncate">{c.address}</span>
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.customer_id)}
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

      {/* Customer Form Modal Sheet */}
      {showForm && (
        <Modal isOpen={showForm} onClose={cancelEdit}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span>{editingCustomer ? "Edit Customer Details" : "Register New Customer"}</span>
            </div>
          </ModalHeader>
          <form onSubmit={editingCustomer ? handleUpdate : handleSubmit}>
            <ModalBody className="space-y-4">
              <Input
                label="Customer/Company Name *"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="e.g. Acme Industries Ltd"
                required
              />

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Customer Type *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select Type...</option>
                  <option value="Industrial">Industrial Partner</option>
                  <option value="Academic">Academic Partner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91..."
                  leftIcon={<Phone size={14} className="text-gray-400" />}
                />
                <Input
                  label="Contact Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  leftIcon={<Mail size={14} className="text-gray-400" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Address Details
                </label>
                <Textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter full physical address..."
                  rows={3}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit" leftIcon={<Save size={16} />}>
                {editingCustomer ? "Save Changes" : "Create Account"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default CustomerPage;
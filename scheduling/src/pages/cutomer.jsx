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
      label: "Industrial", 
      icon: Briefcase,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      badgeColor: "bg-blue-500"
    },
    { 
      value: "Academic", 
      label: "Academic", 
      icon: GraduationCap,
      color: "bg-green-100 text-green-800 border-green-200",
      badgeColor: "bg-green-500"
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
      alert("Customer added successfully!");
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
      alert("Customer updated successfully!");
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
      alert("Customer deleted successfully!");
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${option.color} border`}>
        <Icon size={14} className="mr-1" />
        {option.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage your customers and their information</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={exportToCSV}
              leftIcon={<Download size={20} />}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              leftIcon={<Plus size={20} />}
            >
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Industrial</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.type === "Industrial").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <GraduationCap className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Academic</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.type === "Academic").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <User className="text-gray-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={20} className="text-gray-400" />}
                  containerClassName=""
                />
              </div>
              <div className="flex items-center">
                <Filter size={20} className="text-gray-400 mr-2" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Form */}
        <Modal isOpen={showForm || !!editingCustomer} onClose={cancelEdit} size="md">
          <ModalHeader>
            <CardTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={editingCustomer ? handleUpdate : handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <Input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    leftIcon={<User size={18} className="text-gray-400" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {typeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            form.type === option.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={option.value}
                            checked={form.type === option.value}
                            onChange={handleChange}
                            className="sr-only"
                            required
                          />
                          <div className="flex flex-col items-center">
                            <Icon size={20} className="mb-2" />
                            <span className="text-sm font-medium">{option.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    name="phone_number"
                    type="tel"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    leftIcon={<Phone size={18} className="text-gray-400" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    leftIcon={<Mail size={18} className="text-gray-400" />}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    leftIcon={<MapPin size={18} className="text-gray-400" />}
                    rows={3}
                  />
                </div>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button
                onClick={editingCustomer ? handleUpdate : handleSubmit}
                leftIcon={<Save size={18} />}
              >
                {editingCustomer ? "Update Customer" : "Add Customer"}
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== "all" 
                    ? "No customers match your search criteria." 
                    : "Get started by adding a new customer."}
                </p>
                {!showForm && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="mt-6"
                    leftIcon={<Plus size={16} />}
                  >
                    Add Customer
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.customer_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.customer_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {customer.customer_id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getTypeBadge(customer.type)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {customer.phone_number && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone size={14} className="mr-2" />
                                {customer.phone_number}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail size={14} className="mr-2" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.address ? (
                            <div className="flex items-start text-sm text-gray-600">
                              <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No address</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(customer)}
                              leftIcon={<Edit size={14} />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(customer.customer_id)}
                              leftIcon={<Trash2 size={14} />}
                            >
                              Delete
                            </Button>
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

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Total customers: {customers.length} • Industrial: {customers.filter(c => c.type === "Industrial").length} • Academic: {customers.filter(c => c.type === "Academic").length}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
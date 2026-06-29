import React, { useEffect, useState } from "react";
import {
  User,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Briefcase,
  Phone,
  Settings,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Modal, ModalHeader, ModalBody, ModalFooter, StatusBadge } from "../components/ui";

export default function Manpower() {
  const [manpower, setManpower] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    service_id: "",
    name: "",
    role: "",
    contact: "",
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const API_URL = "https://manpower.cmti.online/api";

  const fetchManpower = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/manpower/`);
    const data = await res.json();
    setManpower(data);
    setLoading(false);
  };

  const fetchServices = async () => {
    const res = await fetch(`${API_URL}/services/`);
    const data = await res.json();
    setServices(data);
  };

  useEffect(() => {
    fetchManpower();
    fetchServices();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId
      ? `${API_URL}/manpower/${editId}`
      : `${API_URL}/manpower/`;
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ text: editId ? "Manpower updated successfully!" : "Manpower added!", type: "success" });
        await fetchManpower();
        setFormData({ service_id: "", name: "", role: "", contact: "" });
        setEditId(null);
        setShowModal(false);
      } else {
        const err = await res.json();
        setMessage({ text: err.detail || "Something went wrong", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error. Please try again.", type: "error" });
    }
  };

  const handleEdit = (mp) => {
    setFormData({
      service_id: mp.service_id,
      name: mp.name,
      role: mp.role || "",
      contact: mp.contact || "",
    });
    setEditId(mp.manpower_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manpower?")) return;
    try {
      const res = await fetch(`${API_URL}/manpower/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ text: "Manpower deleted successfully!", type: "success" });
        fetchManpower();
      } else {
        setMessage({ text: "Failed to delete manpower", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error. Please try again.", type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({ service_id: "", name: "", role: "", contact: "" });
    setEditId(null);
  };

  // Improved grouping logic
  const groupedManpower = manpower.reduce((acc, mp) => {
    // Normalize the name: trim spaces, convert to lowercase for comparison
    const normalizedName = mp.name.trim().toLowerCase();
    
    // Find existing person by normalized name
    const existingIndex = acc.findIndex(item => 
      item.normalizedName === normalizedName
    );
    
    if (existingIndex !== -1) {
      // Add service to existing person
      acc[existingIndex].services.push({
        service_id: mp.service_id,
        service_name: services.find(s => s.service_id === mp.service_id)?.service_name || "Unknown",
        manpower_id: mp.manpower_id,
        role: mp.role
      });
    } else {
      // Create new person entry
      acc.push({
        name: mp.name.trim(), // Store trimmed name
        normalizedName: normalizedName, // For consistent grouping
        contact: mp.contact,
        services: [{
          service_id: mp.service_id,
          service_name: services.find(s => s.service_id === mp.service_id)?.service_name || "Unknown",
          manpower_id: mp.manpower_id,
          role: mp.role
        }]
      });
    }
    return acc;
  }, []);

  // Sort grouped manpower by name
  const sortedManpower = groupedManpower.sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const filteredManpower = sortedManpower.filter((mp) =>
    mp.name.toLowerCase().includes(search.toLowerCase())
  );

  // Modal Component
  const ManpowerModal = () => (
    <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} size="md">
      <ModalHeader>
        <CardTitle>{editId ? "Edit Manpower" : "Add New Manpower"}</CardTitle>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Service *
            </label>
            <select
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              required
            >
              <option value="">Select Service</option>
              {services.map((srv) => (
                <option key={srv.service_id} value={srv.service_id}>
                  {srv.service_name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter name"
            leftIcon={<User size={20} className="text-gray-400" />}
          />

          <Input
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Enter role"
            leftIcon={<Briefcase size={20} className="text-gray-400" />}
          />

          <Input
            label="Contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Enter contact"
            leftIcon={<Phone size={20} className="text-gray-400" />}
          />
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
            {editId ? "Update Manpower" : "Add Manpower"}
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
            <h1 className="text-2xl font-bold text-gray-900">Manpower Management</h1>
            <p className="text-gray-600">Manage workforce and service assignments</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowModal(true)}
              leftIcon={<Plus size={20} />}
            >
              Add Manpower
            </Button>
            <Button
              variant="secondary"
              onClick={fetchManpower}
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={20} className="text-gray-400" />}
            />
          </CardContent>
        </Card>

        {/* Manpower List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">Loading manpower data...</span>
                </div>
              </CardContent>
            </Card>
          ) : filteredManpower.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Settings size={48} className="opacity-30" />
                  <span className="text-lg">No manpower records found</span>
                  {search && (
                    <Button
                      variant="ghost"
                      onClick={() => setSearch("")}
                      size="sm"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredManpower.map((person, idx) => (
              <Card key={`${person.name}-${idx}`} className="animate-slide-up">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{person.name}</CardTitle>
                        <p className="text-sm text-gray-500">{person.contact || "No contact"}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {person.services.map((service, serviceIdx) => (
                      <div
                        key={serviceIdx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase size={18} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{service.service_name}</p>
                            <p className="text-sm text-gray-500">{service.role ? `Role: ${service.role}` : "No role specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit({
                              manpower_id: service.manpower_id,
                              service_id: service.service_id,
                              name: person.name,
                              role: service.role,
                              contact: person.contact
                            })}
                            leftIcon={<Edit size={16} />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(service.manpower_id)}
                            leftIcon={<Trash2 size={16} />}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <ManpowerModal />
    </div>
  );
}
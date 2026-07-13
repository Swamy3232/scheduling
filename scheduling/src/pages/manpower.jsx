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
  CheckCircle,
  AlertCircle,
  Info,
  Layers,
  GraduationCap,
  Users
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui";

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
  const [isLinking, setIsLinking] = useState(false);

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
    setIsLinking(false);
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
    setIsLinking(false);
  };

  // Improved grouping logic
  const groupedManpower = manpower.reduce((acc, mp) => {
    const normalizedName = mp.name.trim().toLowerCase();
    
    const existingIndex = acc.findIndex(item => 
      item.normalizedName === normalizedName
    );
    
    if (existingIndex !== -1) {
      acc[existingIndex].services.push({
        service_id: mp.service_id,
        service_name: services.find(s => s.service_id === mp.service_id)?.service_name || "Unknown",
        manpower_id: mp.manpower_id,
        role: mp.role
      });
    } else {
      acc.push({
        name: mp.name.trim(),
        normalizedName: normalizedName,
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

  const sortedManpower = groupedManpower.sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const filteredManpower = sortedManpower.filter((mp) =>
    mp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>👷</span> Manpower & Personnel Directory
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage workforce profiles, assign technicians to service templates, and track qualifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchManpower}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsLinking(false);
              setShowModal(true);
            }}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
            leftIcon={<Plus size={18} />}
          >
            Add Manpower
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

      {/* Search Toolbar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search personnel by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 space-y-3">
          <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
          <p className="text-xs">Fetching personnel roster...</p>
        </div>
      ) : filteredManpower.length === 0 ? (
        <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center bg-white border border-gray-100 rounded-2xl">
          <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Info size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">No personnel found</h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
            We couldn't find any team members matching your search. Add a new manpower record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredManpower.map((person, idx) => (
            <Card key={`${person.name}-${idx}`} className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-gray-800">{person.name}</CardTitle>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 font-medium mt-0.5">
                      <Phone size={10} /> {person.contact || "No contact info"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    const existingRole = person.services.find(s => s.role)?.role || "";
                    setFormData({
                      service_id: "",
                      name: person.name,
                      role: existingRole,
                      contact: person.contact || "",
                    });
                    setEditId(null);
                    setIsLinking(true);
                    setShowModal(true);
                  }}
                  className="rounded-lg text-[10px]"
                  leftIcon={<Plus size={12} />}
                >
                  Link Service
                </Button>
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Competencies</span>
                <div className="space-y-2">
                  {person.services.map((service, serviceIdx) => (
                    <div
                      key={serviceIdx}
                      className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Layers size={13} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-800">{service.service_name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium flex items-center gap-1">
                            <GraduationCap size={10} />
                            {service.role ? `Specialization: ${service.role}` : "General Specialist"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit({
                            manpower_id: service.manpower_id,
                            service_id: service.service_id,
                            name: person.name,
                            role: service.role,
                            contact: person.contact
                          })}
                          className="p-1 text-gray-400 hover:text-amber-600 rounded-lg transition-colors border border-transparent hover:border-gray-100 hover:bg-white"
                          title="Edit Service"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.manpower_id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-gray-100 hover:bg-white"
                          title="Unlink Service"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>👷</span>
              <span>{editId ? "Edit Workforce Assignment" : "Add Personnel Record"}</span>
            </div>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Select Competency Template *
                </label>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select Service...</option>
                  {services.map((srv) => (
                    <option key={srv.service_id} value={srv.service_id}>
                      {srv.service_name}
                    </option>
                  ))}
                </select>
              </div>

              {!isLinking && (
                <>
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. John Doe"
                    leftIcon={<User size={14} className="text-gray-400" />}
                  />

                  <Input
                    label="Specialty / Role Tag"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Lead CMTI Inspector"
                    leftIcon={<Briefcase size={14} className="text-gray-400" />}
                  />

                  <Input
                    label="Contact Number"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="e.g. +91 99999-99999"
                    leftIcon={<Phone size={14} className="text-gray-400" />}
                  />
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editId ? "Update Competency" : "Add Personnel"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

    </div>
  );
}
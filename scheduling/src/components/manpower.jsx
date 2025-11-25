import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, Search, Edit, Trash2, UserPlus } from "lucide-react";

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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      toast.success(editId ? "Manpower updated successfully!" : "Manpower added!");
      await fetchManpower();
      setFormData({ service_id: "", name: "", role: "", contact: "" });
      setEditId(null);
    } else {
      const err = await res.json();
      toast.error(err.detail || "Something went wrong");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manpower?")) return;
    const res = await fetch(`${API_URL}/manpower/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Manpower deleted successfully!");
      fetchManpower();
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-10 px-6">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto mb-10"
      >
        <h1 className="text-4xl font-bold text-blue-800 mb-4 md:mb-0">
          👷‍♂️ Manpower Management
        </h1>

        {editId && (
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ service_id: "", name: "", role: "", contact: "" });
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition font-medium"
          >
            Cancel Edit
          </button>
        )}
      </motion.div>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-8 border border-gray-100 mb-10"
      >
        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {editId ? "Update Manpower" : "Add New Manpower"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <select
            name="service_id"
            value={formData.service_id}
            onChange={handleChange}
            className="border-gray-300 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Service</option>
            {services.map((srv) => (
              <option key={srv.service_id} value={srv.service_id}>
                {srv.service_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="border-gray-300 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />

          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="border-gray-300 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="text"
            name="contact"
            placeholder="Contact"
            value={formData.contact}
            onChange={handleChange}
            className="border-gray-300 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg col-span-1 md:col-span-4 transition duration-200"
          >
            {editId ? "Update Manpower" : "Add Manpower"}
          </button>
        </form>
      </motion.div>

      {/* Search & Table */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
            📋 Manpower List (Grouped by Person)
          </h2>

          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredManpower.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="overflow-x-auto"
          >
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-blue-50">
                <tr className="text-gray-700 text-sm uppercase tracking-wide">
                  <th className="border p-3 text-left">Name</th>
                  <th className="border p-3 text-left">Contact</th>
                  <th className="border p-3 text-left">Services & Roles</th>
                  <th className="border p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredManpower.map((person, idx) => (
                  <motion.tr
                    key={`${person.name}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`hover:bg-blue-50 transition ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="border p-3 font-medium">{person.name}</td>
                    <td className="border p-3">{person.contact || "-"}</td>
                    <td className="border p-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {person.services.map((service, serviceIdx) => (
                          <div key={serviceIdx} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                            <span className="font-medium">{service.service_name}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              {service.role ? `(${service.role})` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border p-3 text-center">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {person.services.map((service, serviceIdx) => (
                          <div key={serviceIdx} className="flex justify-center space-x-2 py-1">
                            <button
                              onClick={() => handleEdit({
                                manpower_id: service.manpower_id,
                                service_id: service.service_id,
                                name: person.name,
                                role: service.role,
                                contact: person.contact
                              })}
                              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 text-sm px-2 py-1 border border-blue-200 rounded"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(service.manpower_id)}
                              className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1 text-sm px-2 py-1 border border-red-200 rounded"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <div className="text-center py-8 text-gray-500 italic">
            No manpower records found.
          </div>
        )}
      </div>
    </div>
  );
}
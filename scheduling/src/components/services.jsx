import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash2, PlusCircle, Wrench } from "lucide-react";

const API_URL = "https://manpower.cmti.online/api/services";

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to load services.");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        setMessage("✅ Service updated successfully!");
      } else {
        await axios.post(`${API_URL}/`, form);
        setMessage("✅ Service added successfully!");
      }
      setForm({ service_name: "", description: "" });
      setEditingId(null);
      fetchServices();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Something went wrong!");
    }
  };

  const handleEdit = (service) => {
    setForm({
      service_name: service.service_name,
      description: service.description || "",
    });
    setEditingId(service.service_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMessage("🗑️ Service deleted successfully!");
      fetchServices();
    } catch (err) {
      console.error(err);
      setError("Failed to delete service");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col items-center py-10 px-6">
      {/* Header */}
      <header className="w-full max-w-7xl text-center mb-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <Wrench className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 drop-shadow-md">
            Service Management Dashboard
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Manage, edit, and organize all available services in one place.
        </p>
      </header>

      {/* Alerts */}
      <div className="w-full max-w-5xl space-y-2 mb-4">
        {message && (
          <div className="px-4 py-2 text-green-700 bg-green-100 border border-green-200 rounded-md text-sm font-medium text-center shadow-sm animate-fadeIn">
            {message}
          </div>
        )}
        {error && (
          <div className="px-4 py-2 text-red-700 bg-red-100 border border-red-200 rounded-md text-sm font-medium text-center shadow-sm animate-fadeIn">
            {error}
          </div>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white/80 backdrop-blur-lg shadow-xl border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 mb-8 transition-all duration-500 hover:shadow-2xl"
      >
        <input
          type="text"
          placeholder="Enter service name"
          value={form.service_name}
          onChange={(e) => setForm({ ...form, service_name: e.target.value })}
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
        />
        <input
          type="text"
          placeholder="Enter description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition-all shadow-md hover:scale-105"
        >
          <PlusCircle size={18} />
          {editingId ? "Update Service" : "Add Service"}
        </button>
      </form>

      {/* Table */}
      <div className="w-full max-w-7xl bg-white/70 backdrop-blur-md shadow-xl border border-gray-200 rounded-2xl p-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white text-sm uppercase tracking-wider">
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Service Name</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr
                key={s.service_id}
                className={`transition-all ${
                  i % 2 === 0 ? "bg-white" : "bg-indigo-50/40"
                } hover:bg-indigo-100/60`}
              >
                <td className="py-3 px-4 font-medium text-gray-700">
                  {s.service_id}
                </td>
                <td className="py-3 px-4 font-semibold text-gray-800">
                  {s.service_name}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {s.description || "—"}
                </td>
                <td className="py-3 px-4 text-center flex justify-center gap-5">
                  <button
                    onClick={() => handleEdit(s)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-all"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.service_id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium transition-all"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="py-6 text-center text-gray-500 italic"
                >
                  No services found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer className="text-gray-500 text-sm mt-8">
        © {new Date().getFullYear()} Central Maintenance - Service Management
      </footer>
    </div>
  );
};

export default ServiceManager;

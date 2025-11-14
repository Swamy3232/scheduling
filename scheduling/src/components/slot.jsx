import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [manpowerList, setManpowerList] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedManpower, setSelectedManpower] = useState("");

  const [serviceManpower, setServiceManpower] = useState([]);
  const [freeManpower, setFreeManpower] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [priceType, setPriceType] = useState("");

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  /* ---------------------------- Fetch Initial Data --------------------------- */

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/services/`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load services");
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`);
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load bookings");
    }
  };

  const fetchManpower = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/manpower/`);
      setManpowerList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
    fetchManpower();
  }, []);

  /* ---------------------- When service changes → load manpower ---------------------- */

  useEffect(() => {
    if (!selectedService) {
      setServiceManpower([]);
      setSelectedManpower("");
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/bookings/api/service_manpower/${selectedService}`);
        setServiceManpower(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    load();
  }, [selectedService]);

  /* ------------------ Check FREE manpower when date or service changes ------------------ */

  useEffect(() => {
    if (!selectedService || !startDate || !endDate) {
      setFreeManpower([]);
      return;
    }

    const checkAvailability = async () => {
      try {
        const res = await axios.get(`${API_URL}/bookings/free_manpower`, {
          params: {
            start_date: startDate,
            end_date: endDate,
            service_id: selectedService,
          },
        });
        setFreeManpower(res.data.free);
      } catch (err) {
        console.log(err);
      }
    };

    checkAvailability();
  }, [selectedService, startDate, endDate]);

  /* ------------------------------ Helper Functions ------------------------------ */

  const toLocalInputFormat = (isoString) => {
    const d = new Date(isoString);
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const formatLocalDateTime = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("en-IN", { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    });
  };

  const toUTC = (v) => new Date(v).toISOString();

  const getStatusBadge = (b) => {
    const now = new Date();
    const s = new Date(b.start_date);
    const e = new Date(b.end_date);

    if (now > e)
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Completed</span>;
    if (now >= s && now <= e)
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">In Progress</span>;
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Scheduled</span>;
  };

  /* ------------------------------ Create Booking ------------------------------ */

  const createBooking = async () => {
    if (!selectedService || !selectedManpower || !startDate || !endDate) {
      setMessage("⚠️ Please fill all required fields");
      return;
    }

    if (!freeManpower.some((m) => m.manpower_id === Number(selectedManpower))) {
      setMessage("❌ Selected resource is not available in this time slot");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        service_id: Number(selectedService),
        manpower_id: Number(selectedManpower),
        start_date: toUTC(startDate),
        end_date: toUTC(endDate),
        category,
        department,
        price_type: priceType,
      };

      await axios.post(`${API_URL}/bookings/`, payload);
      setMessage("✅ Booking created successfully");
      fetchBookings();
      resetForm();
    } catch (err) {
      console.log(err);
      setMessage("❌ Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Edit Booking ------------------------------ */

  const handleEdit = (b) => {
    setEditId(b.booking_id);

    const srv = services.find((s) => s.service_name === b.service_name);
    setSelectedService(srv ? srv.service_id : "");

    setSelectedManpower(b.manpower_id || "");
    setStartDate(toLocalInputFormat(b.start_date));
    setEndDate(toLocalInputFormat(b.end_date));
    setCategory(b.category);
    setDepartment(b.department);
    setPriceType(b.price_type);

    setMessage(`✏️ Editing booking #${b.booking_id}`);
  };

  const updateBooking = async () => {
    if (!editId) return;

    try {
      setLoading(true);

      const params = {
        start_date: toUTC(startDate),
        end_date: toUTC(endDate),
        category,
        department,
        price_type: priceType,
        manpower_id: selectedManpower,
      };

      await axios.put(`${API_URL}/bookings/${editId}`, null, { params });

      setMessage("✅ Booking updated successfully");
      fetchBookings();
      resetForm();
    } catch (err) {
      console.log(err);
      setMessage("❌ Error updating booking");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Delete Booking ------------------------------ */

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await axios.delete(`${API_URL}/bookings/${id}`);
      setMessage("✅ Booking deleted successfully");
      fetchBookings();
    } catch (err) {
      console.log(err);
      setMessage("❌ Error deleting booking");
    }
  };

  const resetForm = () => {
    setSelectedService("");
    setSelectedManpower("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setDepartment("");
    setPriceType("");
    setEditId(null);
    setFreeManpower([]);
    setMessage("");
  };

  /* ------------------------------ UI Rendering ------------------------------ */

  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Service Booking Management</h1>
        <p className="text-gray-600">Schedule and manage service appointments</p>
      </div>

      {/* Booking Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editId ? "Edit Booking" : "Create New Booking"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service *
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Service</option>
              {services.map((s) => (
                <option key={s.service_id} value={s.service_id}>
                  {s.service_name}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource *
            </label>
            <select
              value={selectedManpower}
              onChange={(e) => setSelectedManpower(e.target.value)}
              disabled={!selectedService}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{selectedService ? "Select Resource" : "Select service first"}</option>
              {serviceManpower.map((mp) => (
                <option key={mp.manpower_id} value={mp.manpower_id}>
                  {mp.manpower_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="academic">Academic</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              <option value="SMPM">SMPM</option>
              <option value="CMF">CMF</option>
              <option value="MNTM">MNTM</option>
              <option value="ASMP">ASMP</option>
              <option value="AEAMT">AEAMT</option>
              <option value="SVT">SVT</option>
              <option value="PDE">PDE</option>
              <option value="PAT">PAT</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Price Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pricing Type
            </label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Pricing</option>
              <option value="per_hour">Per Hour</option>
              <option value="per_sample">Per Sample</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Availability Info */}
        {freeManpower.length > 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
            <div className="flex items-center text-green-800">
              <span className="text-lg mr-2">✓</span>
              <span className="font-medium">Available Resources:</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {freeManpower.map((m) => (
                <span 
                  key={m.manpower_id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    m.manpower_id === Number(selectedManpower)
                      ? "bg-green-500 text-white"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {m.manpower_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {editId ? (
            <>
              <button
                onClick={updateBooking}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Booking"}
              </button>
              <button 
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={createBooking}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.includes("❌")
                ? "bg-red-50 text-red-700 border border-red-200"
                : message.includes("⚠️")
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Booking History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((b) => (
                <tr key={b.booking_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{b.booking_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.service_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.manpower_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{b.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {b.price_type === 'per_hour' ? 'Per Hour' : 'Per Sample'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatLocalDateTime(b.start_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatLocalDateTime(b.end_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(b)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(b)}
                        className="text-blue-600 hover:text-blue-900 transition duration-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteBooking(b.booking_id)}
                        className="text-red-600 hover:text-red-900 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-lg mb-2">📅</span>
                      <p>No bookings found</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first booking to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
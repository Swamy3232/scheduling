import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
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

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  const formatLocalDateTime = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", { hour12: false });
  };

  const toLocalInputFormat = (isoString) => {
    const d = new Date(isoString);
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const toUTC = (localValue) => {
    const date = new Date(localValue);
    return date.toISOString();
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
    if (s === "completed")
      return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Completed</span>;
    if (s === "in-progress")
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">In Progress</span>;
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Scheduled</span>;
  };

  const createBooking = async () => {
    if (!selectedService || !startDate || !endDate || !category || !department || !priceType) {
      setMessage("⚠️ Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        service_id: Number(selectedService),
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
      setMessage("❌ Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setEditId(b.booking_id);

    const srv = services.find((s) => s.service_name === b.service_name);
    setSelectedService(srv ? srv.service_id : "");

    setStartDate(toLocalInputFormat(b.start_date));
    setEndDate(toLocalInputFormat(b.end_date));
    setCategory(b.category || "");
    setDepartment(b.department || "");
    setPriceType(b.price_type || "");

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
      };

      await axios.put(`${API_URL}/bookings/${editId}`, null, { params });
      setMessage("✅ Booking updated successfully");
      fetchBookings();
      resetForm();
    } catch (err) {
      setMessage("❌ Error updating booking");
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;

    try {
      await axios.delete(`${API_URL}/bookings/${id}`);
      setMessage("✅ Booking deleted");
      fetchBookings();
    } catch (err) {
      setMessage("❌ Error deleting booking");
    }
  };

  const resetForm = () => {
    setSelectedService("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setDepartment("");
    setPriceType("");
    setEditId(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 mt-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">📅 Service Booking Management</h2>

      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {editId ? `✏️ Edit Booking #${editId}` : "➕ Create New Booking"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border rounded-lg px-3 py-2"
            disabled={!!editId}
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s.service_id} value={s.service_id}>
                {s.service_name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Category</option>
            <option value="academic">Academic</option>
            <option value="industrial">Industrial</option>
          </select>

          const departments = ["SMPM", "CMF", "MNTM", "ASMP", "AEAMT", "SVT", "PDE", "PAT", "OTHER"];

<select
  value={department}
  onChange={(e) => setDepartment(e.target.value)}
  className="border rounded-lg px-3 py-2"
>
  <option value="">Select Department</option>

  {departments.map((dept) => (
    <option key={dept} value={dept}>
      {dept}
    </option>
  ))}
</select>


          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Price Type</option>
            <option value="per_hour">Per Hour</option>
            <option value="per_sample">Per Sample</option>
          </select>

          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex space-x-2">
          {editId ? (
            <>
              <button
                onClick={updateBooking}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {loading ? "Updating..." : "💾 Update"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={createBooking}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {loading ? "Creating..." : "📝 Create Booking"}
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("❌")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Price Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Manpower</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((b) => (
              <tr key={b.booking_id}>
                <td className="px-6 py-4">#{b.booking_id}</td>
                <td className="px-6 py-4">{b.service_name}</td>
                <td className="px-6 py-4">{b.category || "-"}</td>
                <td className="px-6 py-4">{b.department || "-"}</td>
                <td className="px-6 py-4">{b.price_type || "-"}</td>
                <td className="px-6 py-4">{b.manpower_name || "-"}</td>
                <td className="px-6 py-4">{formatLocalDateTime(b.start_date)}</td>
                <td className="px-6 py-4">{formatLocalDateTime(b.end_date)}</td>
                <td className="px-6 py-4">{getStatusBadge(b)}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleEdit(b)} className="text-blue-600 mr-2">
                    ✏️
                  </button>
                  <button onClick={() => deleteBooking(b.booking_id)} className="text-red-600">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

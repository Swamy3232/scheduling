import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online";

export default function ProfessionalBookingForm() {
  const [services, setServices] = useState([]);
  const [manpowerList, setManpowerList] = useState([]);
  const [serviceManpower, setServiceManpower] = useState([]);
  const [freeManpower, setFreeManpower] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedManpower, setSelectedManpower] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [priceType, setPriceType] = useState("");

  const [bookings, setBookings] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ------------------- Helpers ------------------- */
  const toUTC = (v) => new Date(v).toISOString();
  const toLocalInputFormat = (isoString) => {
    const d = new Date(isoString);
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };
  const formatLocalDateTime = (isoString) =>
    isoString ? new Date(isoString).toLocaleString("en-IN", { hour12: false }) : "-";

  const getStatusBadge = (b) => {
    const now = new Date();
    const s = new Date(b.start_date);
    const e = new Date(b.end_date);
    if (now > e) return <span className="bg-purple-200 px-2 py-1 rounded text-xs">Completed</span>;
    if (now >= s && now <= e) return <span className="bg-green-200 px-2 py-1 rounded text-xs">In Progress</span>;
    return <span className="bg-blue-200 px-2 py-1 rounded text-xs">Scheduled</span>;
  };

  /* ------------------- Fetch Data ------------------- */
  useEffect(() => {
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

    fetchServices();
    fetchBookings();
    fetchManpower();
  }, []);

  /* ------------------- Fetch Service Manpower ------------------- */
  useEffect(() => {
    if (!selectedService) {
      setServiceManpower([]);
      return;
    }

    const loadServiceManpower = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/bookings/api/service_manpower/${Number(selectedService)}`
        );
        console.log("Service manpower:", res.data);
        setServiceManpower(res.data);
      } catch (err) {
        console.log("Error fetching service manpower:", err);
      }
    };

    loadServiceManpower();
  }, [selectedService]);

  /* ------------------- Fetch Free Manpower ------------------- */
  useEffect(() => {
    if (!selectedService || !startDate || !endDate) {
      setFreeManpower([]);
      return;
    }

    const checkAvailability = async () => {
      try {
        const res = await axios.get(`${API_URL}/bookings/free_manpower`, {
          params: {
            start_date: toUTC(startDate),
            end_date: toUTC(endDate),
            service_id: Number(selectedService),
          },
        });
        console.log("Free manpower:", res.data);
        setFreeManpower(res.data.free || []);
      } catch (err) {
        console.log("Error fetching free manpower:", err);
        setFreeManpower([]);
      }
    };

    checkAvailability();
  }, [selectedService, startDate, endDate]);

  /* ------------------- Create or Update Booking ------------------- */
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

  const createBooking = async () => {
    if (!selectedService || !selectedManpower || !startDate || !endDate) {
      setMessage("⚠️ Please fill all fields");
      return;
    }

    const selectedMan = Number(selectedManpower);
    const isFree = freeManpower.some((m) => m.manpower_id === selectedMan || m.id === selectedMan);

    if (!isFree) {
      setMessage("❌ Selected manpower is not free in this time slot");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/bookings/`, {
        service_id: Number(selectedService),
        manpower_id: selectedMan,
        start_date: toUTC(startDate),
        end_date: toUTC(endDate),
        category,
        department,
        price_type: priceType,
      });
      setMessage("✅ Booking created successfully");
      resetForm();
    } catch (err) {
      console.log(err);
      setMessage("❌ Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setEditId(b.booking_id);
    setSelectedService(b.service_id || "");
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
      await axios.put(`${API_URL}/bookings/${editId}`, null, {
        params: {
          start_date: toUTC(startDate),
          end_date: toUTC(endDate),
          category,
          department,
          price_type: priceType,
          manpower_id: Number(selectedManpower),
        },
      });
      setMessage("✅ Booking updated successfully");
      resetForm();
    } catch (err) {
      console.log(err);
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
    } catch (err) {
      console.log(err);
      setMessage("❌ Error deleting booking");
    }
  };

  /* ------------------- Render ------------------- */
  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">📅 Service Booking</h2>

      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s.service_id} value={s.service_id}>
                {s.service_name}
              </option>
            ))}
          </select>

          <select
            value={selectedManpower}
            onChange={(e) => setSelectedManpower(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Manpower</option>
            {serviceManpower.length > 0 ? (
              serviceManpower.map((mp) => {
                const isFree = freeManpower.some((f) => f.manpower_id === mp.manpower_id || f.id === mp.manpower_id);
                return (
                  <option key={mp.manpower_id} value={mp.manpower_id} disabled={!isFree}>
                    {mp.name} {isFree ? "" : "(Busy)"}
                  </option>
                );
              })
            ) : (
              <option value="" disabled>
                No manpower assigned to this service
              </option>
            )}
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Select Category</option>
            <option value="academic">Academic</option>
            <option value="industrial">Industrial</option>
          </select>

          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded-lg px-3 py-2">
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

          <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Select Price Type</option>
            <option value="per_hour">Per Hour</option>
            <option value="per_sample">Per Sample</option>
          </select>

          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2" />
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>

        {freeManpower.length > 0 && (
          <div className="bg-green-50 border border-green-300 p-3 rounded mb-4 text-sm">
            <strong>Free manpower for this slot:</strong><br />
            {freeManpower.map((m) => (
              <span key={m.manpower_id || m.id} className="mr-2 px-2 py-1 bg-green-200 rounded">
                {m.manpower_name || m.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {editId ? (
            <>
              <button onClick={updateBooking} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex-1">
                {loading ? "Updating..." : "💾 Update Booking"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={createBooking} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1">
              {loading ? "Creating..." : "📝 Create Booking"}
            </button>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes("❌") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Booking ID</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Manpower</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Price Type</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.booking_id} className="border-b">
                <td className="px-4 py-2">#{b.booking_id}</td>
                <td className="px-4 py-2">{b.service_name}</td>
                <td className="px-4 py-2">{b.manpower_name}</td>
                <td className="px-4 py-2">{b.category}</td>
                <td className="px-4 py-2">{b.department}</td>
                <td className="px-4 py-2">{b.price_type}</td>
                <td className="px-4 py-2">{formatLocalDateTime(b.start_date)}</td>
                <td className="px-4 py-2">{formatLocalDateTime(b.end_date)}</td>
                <td className="px-4 py-2">{getStatusBadge(b)}</td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 mr-3" onClick={() => handleEdit(b)}>
                    ✏️
                  </button>
                  <button className="text-red-600" onClick={() => deleteBooking(b.booking_id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {bookings.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4 text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  User,
  UserCircle,
} from "lucide-react";

const Booking = ({ currentUser }) => {
  const [form, setForm] = useState({
    service_id: "",
    service_name: "",
    start_date: "",
    end_date: "",
    customer: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAvailable(false);
    setMessage(null);
  };

  // ✅ Step 1: Check availability
  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const startUTC = new Date(form.start_date).toISOString();
      const endUTC = new Date(form.end_date).toISOString();

      console.log("Checking availability:");
      console.log("Local start:", form.start_date);
      console.log("Local end:", form.end_date);
      console.log("UTC start:", startUTC);
      console.log("UTC end:", endUTC);

      const params = {
        service_id: form.service_id,
        start_date: startUTC,
        end_date: endUTC,
      };

      const res = await axios.get(
        "https://manpower.cmti.online/bookings/check",
        { params }
      );

      console.log("Check response:", res.data);

      if (res.data.available) {
        setAvailable(true);
        setMessage({ type: "success", text: res.data.message });
      } else {
        setAvailable(false);
        setMessage({ type: "error", text: res.data.message });
      }
    } catch (err) {
      console.error("Check error:", err.response || err);
      setAvailable(false);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Slot not available.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Book service
  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const startUTC = new Date(form.start_date).toISOString();
      const endUTC = new Date(form.end_date).toISOString();

      console.log("Booking service:");
      console.log("Local start:", form.start_date);
      console.log("Local end:", form.end_date);
      console.log("UTC start:", startUTC);
      console.log("UTC end:", endUTC);

      const payload = {
        service_id: parseInt(form.service_id),
        service_name: form.service_name || null,
        start_date: startUTC,
        end_date: endUTC,
        customer: form.customer,
      };

      console.log("Payload sent to backend:", payload);

      const res = await axios.post(
        "https://manpower.cmti.online/bookings/",
        payload,
        {
          params: { assigned_by: currentUser?.username || "system" },
        }
      );

      console.log("Booking response:", res.data);

      setMessage({
        type: "success",
        text: res.data.message || "✅ Booking confirmed!",
      });

      // Reset form
      setForm({
        service_id: "",
        service_name: "",
        start_date: "",
        end_date: "",
        customer: "",
      });
      setAvailable(false);
    } catch (err) {
      console.error("Booking error:", err.response || err);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Booking failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-10 border border-gray-200">
        <div className="flex items-center justify-center mb-8">
          <User className="w-10 h-10 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-blue-700">Service Booking</h2>
        </div>

        <form
          onSubmit={available ? handleBook : handleCheck}
          className="space-y-6"
        >
          {/* Customer Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-500" /> Customer Name
            </label>
            <input
              type="text"
              name="customer"
              value={form.customer}
              onChange={handleChange}
              required
              placeholder="Enter customer name"
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Service ID */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service ID
            </label>
            <input
              type="number"
              name="service_id"
              value={form.service_id}
              onChange={handleChange}
              required
              placeholder="Enter service ID"
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Name
            </label>
            <input
              type="text"
              name="service_name"
              value={form.service_name}
              onChange={handleChange}
              placeholder="Enter service name (optional)"
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> End Date & Time
            </label>
            <input
              type="datetime-local"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-3 font-semibold rounded-xl transition duration-200 text-white shadow-lg ${
              available
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : available ? (
              <>
                <CheckCircle className="w-5 h-5" /> Confirm Booking
              </>
            ) : (
              "Check Availability"
            )}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`mt-6 text-center font-medium text-lg ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;

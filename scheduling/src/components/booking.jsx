import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  User,
  UserCircle,
} from "lucide-react";

const Booking = ({ currentUser, editId = null }) => {
  const [form, setForm] = useState({
    service_id: "",
    service_name: "",
    start_date: "",
    end_date: "",
    customer: "",
    category: "",
    department: "",
    price_type: "",
    rate: "",
    remarks: "",
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // -----------------------------------------------------
  // 🔵 LOAD BOOKING DETAILS FOR EDIT MODE
  // -----------------------------------------------------
  useEffect(() => {
    if (editId) {
      setIsEdit(true);
      fetchBooking(editId);
    }
  }, [editId]);

  const fetchBooking = async (id) => {
    try {
      const res = await axios.get(`https://manpower.cmti.online/bookings/${id}`);
      const b = res.data;

      setForm({
        service_id: b.service_id,
        service_name: b.service_name,
        start_date: b.start_date.slice(0, 16),
        end_date: b.end_date.slice(0, 16),
        customer: b.customer,
        category: b.category,
        department: b.department,
        price_type: b.price_type,
        rate: b.rate,
        remarks: b.remarks,
      });

      setAvailable(true); // allow editing without rechecking
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load booking details." });
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAvailable(false);
    setMessage(null);
  };

  // -----------------------------------------------------
  // 🟢 CHECK AVAILABILITY
  // -----------------------------------------------------
  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = {
        service_id: form.service_id,
        start_date: form.start_date,
        end_date: form.end_date,
      };

      const res = await axios.get(
        "https://manpower.cmti.online/bookings/check",
        { params }
      );

      if (res.data.available) {
        setAvailable(true);
        setMessage({ type: "success", text: "Slot Available" });
      } else {
        setAvailable(false);
        setMessage({ type: "error", text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Slot not available" });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // 🔵 CREATE OR UPDATE BOOKING
  // -----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      service_id: form.service_id,
      service_name: form.service_name,
      start_date: form.start_date,
      end_date: form.end_date,
      customer: form.customer,
      category: form.category,
      department: form.department,
      price_type: form.price_type,
      rate: form.rate,
      remarks: form.remarks,
    };

    try {
      let res;

      if (isEdit) {
        // -----------------------------------
        // 🔵 PUT — Update Booking
        // -----------------------------------
        res = await axios.put(
          `https://manpower.cmti.online/bookings/${editId}`,
          payload,
          { params: { assigned_by: currentUser?.username || "system" } }
        );
      } else {
        // -----------------------------------
        // 🟢 POST — Create Booking
        // -----------------------------------
        res = await axios.post(
          "https://manpower.cmti.online/bookings/",
          payload,
          { params: { assigned_by: currentUser?.username || "system" } }
        );
      }

      setMessage({
        type: "success",
        text: isEdit
          ? "Booking Updated Successfully"
          : "Booking Created Successfully",
      });

      if (!isEdit) {
        setForm({
          service_id: "",
          service_name: "",
          start_date: "",
          end_date: "",
          customer: "",
          category: "",
          department: "",
          price_type: "",
          rate: "",
          remarks: "",
        });
        setAvailable(false);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Operation failed.",
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
          <h2 className="text-3xl font-bold text-blue-700">
            {isEdit ? "Edit Booking" : "Service Booking"}
          </h2>
        </div>

        <form
          onSubmit={available ? handleSubmit : handleCheck}
          className="space-y-6"
        >
          {/* CUSTOMER */}
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
              className="w-full border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* SERVICE ID */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service ID
            </label>
            <input
              type="text"
              name="service_id"
              value={form.service_id}
              onChange={handleChange}
              required
              placeholder="Enter service ID"
              className="w-full border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* SERVICE NAME */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Name
            </label>
            <input
              type="text"
              name="service_name"
              value={form.service_name}
              onChange={handleChange}
              placeholder="Enter service name"
              className="w-full border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* START DATE */}
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
              className="w-full border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* END DATE */}
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
              className="w-full border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* EXTRA FIELDS */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category"
              className="border border-gray-300 rounded-xl p-3"
            />

            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department"
              className="border border-gray-300 rounded-xl p-3"
            />

            <input
              name="price_type"
              value={form.price_type}
              onChange={handleChange}
              placeholder="per_hour / per_day"
              className="border border-gray-300 rounded-xl p-3"
            />

            <input
              name="rate"
              value={form.rate}
              onChange={handleChange}
              placeholder="Rate"
              className="border border-gray-300 rounded-xl p-3"
            />
          </div>

          {/* Remarks */}
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            placeholder="Remarks"
            className="w-full border border-gray-300 rounded-xl p-3"
          />

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-3 font-semibold rounded-xl text-white shadow-lg ${
              available
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : available ? (
              <>
                <CheckCircle className="w-5 h-5" />{" "}
                {isEdit ? "Update Booking" : "Confirm Booking"}
              </>
            ) : (
              "Check Availability"
            )}
          </button>
        </form>

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

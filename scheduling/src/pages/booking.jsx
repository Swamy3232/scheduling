import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  UserCircle,
  FileText,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea, Badge } from "../components/ui";

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
    file: null,
    file_url: "",
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
        file: null,
        file_url: b.file_url || "",
      });

      setAvailable(true);
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
  // 🔵 CREATE OR UPDATE BOOKING (WITH FILE)
  // -----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (key !== "file" && key !== "file_url") {
        formData.append(key, form[key]);
      }
    });

    if (form.file) {
      formData.append("file", form.file);
    }

    try {
      let res;

      if (isEdit) {
        res = await axios.put(
          `https://manpower.cmti.online/bookings/${editId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            params: { assigned_by: currentUser?.username || "system" },
          }
        );
      } else {
        res = await axios.post(
          "https://manpower.cmti.online/bookings/",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            params: { assigned_by: currentUser?.username || "system" },
          }
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
          file: null,
          file_url: "",
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container-responsive max-w-2xl py-8">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-blue-600" />
              </div>
              {isEdit ? "Edit Booking" : "Service Booking"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={available ? handleSubmit : handleCheck}
              className="space-y-6"
            >
              <Input
                label="Customer Name"
                name="customer"
                value={form.customer}
                onChange={handleChange}
                required
                placeholder="Enter customer name"
                leftIcon={<UserCircle size={20} className="text-gray-400" />}
              />

              <Input
                label="Service ID"
                name="service_id"
                value={form.service_id}
                onChange={handleChange}
                required
                placeholder="Enter service ID"
              />

              <Input
                label="Service Name"
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                placeholder="Enter service name"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date & Time"
                  name="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                  leftIcon={<Calendar size={20} className="text-gray-400" />}
                />

                <Input
                  label="End Date & Time"
                  name="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                  leftIcon={<Clock size={20} className="text-gray-400" />}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Category"
                  containerClassName="col-span-2 md:col-span-1"
                />

                <Input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Department"
                  containerClassName="col-span-2 md:col-span-1"
                />

                <Input
                  name="price_type"
                  value={form.price_type}
                  onChange={handleChange}
                  placeholder="per_hour / per_day"
                  containerClassName="col-span-2 md:col-span-1"
                />

                <Input
                  name="rate"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="Rate"
                  containerClassName="col-span-2 md:col-span-1"
                />
              </div>

              <Textarea
                label="Remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter any additional remarks"
                rows={3}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload PDF (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                    className="w-full"
                  />
                  {form.file && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center justify-center gap-2">
                      <FileText size={16} />
                      {form.file.name}
                    </p>
                  )}
                </div>
                {isEdit && form.file_url && (
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center gap-1"
                  >
                    <FileText size={16} />
                    View Existing PDF
                  </a>
                )}
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                variant={available ? "success" : "primary"}
                leftIcon={available && <CheckCircle size={20} />}
              >
                {loading ? "Processing..." : available ? (isEdit ? "Update Booking" : "Confirm Booking") : "Check Availability"}
              </Button>
            </form>

            {message && (
              <div className={`mt-6 p-4 rounded-xl text-center ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;

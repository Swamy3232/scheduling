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
  Layers,
  ArrowRight,
  Info,
  ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from "../components/ui";

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
      if (isEdit) {
        await axios.put(
          `https://manpower.cmti.online/bookings/${editId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            params: { assigned_by: currentUser?.username || "system" },
          }
        );
      } else {
        await axios.post(
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
    <div className="w-full px-6 py-8 max-w-2xl mx-auto">
      
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        
        {/* Card Header with Theme color */}
        <CardHeader className="pb-6 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-800">
              {isEdit ? "Edit Task Booking" : "New Service Booking Allocation"}
            </CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Assign technician competencies, schedule dates, and check overlaps</p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          
          {message && (
            <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 shadow-sm ${
              message.type === "success" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {message.type === "success" ? <CheckCircle size={20} /> : <Info size={20} />}
              <span className="text-xs">{message.text}</span>
            </div>
          )}

          <form onSubmit={available ? handleSubmit : handleCheck} className="space-y-6">
            
            {/* Customer */}
            <Input
              label="Customer/Partner Name *"
              name="customer"
              value={form.customer}
              onChange={handleChange}
              required
              placeholder="e.g. CMTI Aerospace Department"
              leftIcon={<UserCircle size={14} className="text-gray-400" />}
            />

            {/* Service IDs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Service ID *"
                name="service_id"
                value={form.service_id}
                onChange={handleChange}
                required
                placeholder="e.g. 5"
              />

              <Input
                label="Service Template Name"
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                placeholder="e.g. Vibration Analysis"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date & Time *"
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
                required
                leftIcon={<Calendar size={14} className="text-gray-400" />}
              />

              <Input
                label="End Date & Time *"
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
                required
                leftIcon={<Clock size={14} className="text-gray-400" />}
              />
            </div>

            {/* Pricing Parameters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Category</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="industrial"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dept</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="SMPM"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price Type</label>
                <input
                  name="price_type"
                  value={form.price_type}
                  onChange={handleChange}
                  placeholder="per_hour"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rate (₹)</label>
                <input
                  name="rate"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="1500"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Remarks / Scope of work</label>
              <Textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter any additional remarks or equipment details..."
                rows={3}
              />
            </div>

            {/* PDF Uploader */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Attach Service Order Document (PDF)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                  className="w-full text-xs text-gray-500 max-w-xs mx-auto"
                />
                {form.file && (
                  <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1 font-semibold">
                    <FileText size={14} className="text-blue-500" />
                    {form.file.name}
                  </p>
                )}
              </div>
              {isEdit && form.file_url && (
                <a
                  href={form.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold mt-2 inline-flex items-center gap-1"
                >
                  <FileText size={14} />
                  View Uploaded AMC Document
                </a>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-gray-50">
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className={`h-12 rounded-xl text-white font-medium shadow-sm transition-all ${
                  available 
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                }`}
                leftIcon={available ? <ShieldCheck size={18} /> : null}
                rightIcon={!available ? <ArrowRight size={18} /> : null}
              >
                {loading 
                  ? "Processing Allocation..." 
                  : available 
                    ? (isEdit ? "Confirm Booking Modification" : "Allocate Service Booking") 
                    : "Check Slot Schedule Overlaps"
                }
              </Button>
            </div>

          </form>

        </CardContent>
      </Card>

    </div>
  );
};

export default Booking;

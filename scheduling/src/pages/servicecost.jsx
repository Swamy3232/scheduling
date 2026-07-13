import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Edit, Trash2, RefreshCw, IndianRupee, Layers, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui";

const API_URL = "https://manpower.cmti.online/service_prices/";

export default function ServicePricePage() {
  const [prices, setPrices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    service_id: "",
    service_name: "",
    category: "",
    price_type: "",
    rate: "",
    remarks: "",
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setPrices(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching service prices:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  useEffect(() => {
    let result = prices;

    if (category) {
      result = result.filter((p) =>
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (priceType) {
      result = result.filter((p) =>
        p.price_type.toLowerCase().includes(priceType.toLowerCase())
      );
    }

    if (search) {
      result = result.filter((p) =>
        p.service_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [category, priceType, search, prices]);

  const handleAddNew = () => {
    setEditMode(false);
    setFormData({
      id: "",
      service_id: "",
      service_name: "",
      category: "",
      price_type: "",
      rate: "",
      remarks: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (price) => {
    setEditMode(true);
    setFormData(price);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${API_URL}${id}`);
      fetchPrices();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await axios.put(`${API_URL}${formData.id}`, {
          category: formData.category,
          price_type: formData.price_type,
          rate: parseFloat(formData.rate),
          remarks: formData.remarks,
        });
      } else {
        await axios.post(API_URL, {
          service_id: parseInt(formData.service_id),
          service_name: formData.service_name,
          category: formData.category,
          price_type: formData.price_type,
          rate: parseFloat(formData.rate),
          remarks: formData.remarks,
        });
      }
      setIsModalOpen(false);
      fetchPrices();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save data");
    }
  };

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <IndianRupee size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>💳</span> Service Pricing Matrix
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Define standard rate catalogs, price configurations, and contract values.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchPrices}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          <Button
            onClick={handleAddNew}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm shadow-blue-100"
            leftIcon={<Plus size={18} />}
          >
            Add New Rate
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Service Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Category Filter */}
            <input
              type="text"
              placeholder="Filter by Category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
            />

            {/* Price Type Filter */}
            <input
              type="text"
              placeholder="Filter by Price Type..."
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
            />

          </div>
        </CardContent>
      </Card>

      {/* Database Pricing Card List */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Fetching service rates...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No pricing catalogs found</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                We couldn't find any pricing catalog entries matching your filters. Add a new service rate.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filtered.map((price) => (
                    <tr key={price.id} className="hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚙️</span>
                          <span>{price.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100`}>
                          {price.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                          {price.price_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-extrabold text-emerald-600">₹{price.rate}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate" title={price.remarks}>
                        {price.remarks || "-"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(price)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(price.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* pricing Modal Sheet */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span>{editMode ? "Modify Service Price" : "Register Pricing Config"}</span>
            </div>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-4">
              {!editMode && (
                <>
                  <Input
                    label="Service ID *"
                    type="number"
                    placeholder="e.g. 5"
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    required
                  />
                  <Input
                    label="Service Template Name *"
                    type="text"
                    placeholder="e.g. Laser Alignment Verification"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    required
                  />
                </>
              )}
              <Input
                label="Category *"
                type="text"
                placeholder="e.g. industrial"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <Input
                label="Price Type *"
                type="text"
                placeholder="e.g. per_hour"
                value={formData.price_type}
                onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
                required
              />
              <Input
                label="Contract rate (₹) *"
                type="number"
                step="0.01"
                placeholder="e.g. 1500"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                leftIcon={<IndianRupee size={14} className="text-gray-400" />}
                required
              />
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Additional cost terms..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editMode ? "Save Changes" : "Create Pricing Entry"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

    </div>
  );
}

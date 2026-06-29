import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Edit, Trash2, RefreshCw, DollarSign } from "lucide-react";
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

  // ------------------------------
  // CRUD Operations
  // ------------------------------
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

  // ------------------------------
  // UI Rendering
  // ------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Price Management</h1>
            <p className="text-gray-600">Manage service pricing and rates</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={fetchPrices}
              leftIcon={<RefreshCw size={20} />}
            >
              Refresh
            </Button>
            <Button
              onClick={handleAddNew}
              leftIcon={<Plus size={20} />}
            >
              Add New
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search Service Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={18} className="text-gray-400" />}
              />
              <Input
                placeholder="Filter by Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Input
                placeholder="Filter by Price Type"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Service Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Price Type</th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Rate (₹)</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((price) => (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{price.service_name}</td>
                        <td className="py-3 px-4">{price.category}</td>
                        <td className="py-3 px-4">{price.price_type}</td>
                        <td className="py-3 px-4 text-right font-medium">₹{price.rate}</td>
                        <td className="py-3 px-4">{price.remarks || "-"}</td>
                        <td className="py-3 px-4 text-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(price)}
                            leftIcon={<Edit size={14} />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(price.id)}
                            leftIcon={<Trash2 size={14} />}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
          <ModalHeader>
            <CardTitle>{editMode ? "Edit Service Price" : "Add New Service Price"}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editMode && (
                <>
                  <Input
                    type="number"
                    placeholder="Service ID"
                    value={formData.service_id}
                    onChange={(e) =>
                      setFormData({ ...formData, service_id: e.target.value })
                    }
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Service Name"
                    value={formData.service_name}
                    onChange={(e) =>
                      setFormData({ ...formData, service_name: e.target.value })
                    }
                    required
                  />
                </>
              )}
              <Input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
              <Input
                type="text"
                placeholder="Price Type"
                value={formData.price_type}
                onChange={(e) =>
                  setFormData({ ...formData, price_type: e.target.value })
                }
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Rate (₹)"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
                leftIcon={<DollarSign size={18} className="text-gray-400" />}
                required
              />
              <Input
                type="text"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </form>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editMode ? "Update" : "Save"}</Button>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}

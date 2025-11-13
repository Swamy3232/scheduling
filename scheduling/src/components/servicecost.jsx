import React, { useEffect, useState } from "react";
import axios from "axios";

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Service Price Management
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Service Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full"
        />

        <input
          type="text"
          placeholder="Filter by Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full"
        />

        <input
          type="text"
          placeholder="Filter by Price Type"
          value={priceType}
          onChange={(e) => setPriceType(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full"
        />

        <button
          onClick={fetchPrices}
          className="bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300"
        >
          Refresh
        </button>

        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition"
        >
          + Add New
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-blue-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Service Name</th>
              <th className="py-2 px-4 border-b text-left">Category</th>
              <th className="py-2 px-4 border-b text-left">Price Type</th>
              <th className="py-2 px-4 border-b text-right">Rate (₹)</th>
              <th className="py-2 px-4 border-b text-left">Remarks</th>
              <th className="py-2 px-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{price.service_name}</td>
                  <td className="py-2 px-4 border-b">{price.category}</td>
                  <td className="py-2 px-4 border-b">{price.price_type}</td>
                  <td className="py-2 px-4 border-b text-right">{price.rate}</td>
                  <td className="py-2 px-4 border-b">{price.remarks || "-"}</td>
                  <td className="py-2 px-4 border-b text-center space-x-2">
                    <button
                      onClick={() => handleEdit(price)}
                      className="bg-yellow-400 px-3 py-1 rounded text-white hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(price.id)}
                      className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Edit Service Price" : "Add New Service Price"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!editMode && (
                <>
                  <input
                    type="number"
                    placeholder="Service ID"
                    value={formData.service_id}
                    onChange={(e) =>
                      setFormData({ ...formData, service_id: e.target.value })
                    }
                    className="border rounded-lg p-2 w-full"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Service Name"
                    value={formData.service_name}
                    onChange={(e) =>
                      setFormData({ ...formData, service_name: e.target.value })
                    }
                    className="border rounded-lg p-2 w-full"
                    required
                  />
                </>
              )}

              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
                required
              />

              <input
                type="text"
                placeholder="Price Type"
                value={formData.price_type}
                onChange={(e) =>
                  setFormData({ ...formData, price_type: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
                required
              />

              <input
                type="number"
                step="0.01"
                placeholder="Rate (₹)"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
                required
              />

              <input
                type="text"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
              />

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

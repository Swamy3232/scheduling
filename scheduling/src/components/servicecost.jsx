import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://manpower.cmti.online/service_prices/";

export default function ServicePricePage() {
  const [prices, setPrices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("");
  const [search, setSearch] = useState("");

  // Fetch data
  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await axios.get(API_URL);
      setPrices(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching service prices:", err);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Service Price Report</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Service Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full focus:ring focus:ring-blue-200"
        />

        <input
          type="text"
          placeholder="Filter by Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full focus:ring focus:ring-blue-200"
        />

        <input
          type="text"
          placeholder="Filter by Price Type"
          value={priceType}
          onChange={(e) => setPriceType(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full focus:ring focus:ring-blue-200"
        />

        <button
          onClick={fetchPrices}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition"
        >
          Refresh
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
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{price.service_name}</td>
                  <td className="py-2 px-4 border-b">{price.category}</td>
                  <td className="py-2 px-4 border-b">{price.price_type}</td>
                  <td className="py-2 px-4 border-b text-right">{price.rate}</td>
                  <td className="py-2 px-4 border-b">{price.remarks || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

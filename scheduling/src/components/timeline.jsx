import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";

const API_URL = "https://manpower.cmti.online/bookings/";

export default function Timeline() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Fetch bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get(API_URL);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-gray-600">Loading timeline...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center mt-10 text-gray-500">No bookings available.</div>;
  }

  // 🧭 Prepare data for Gantt-like chart
  const timelineData = [
    {
      x: bookings.flatMap((b) => [b.start_date, b.end_date]),
      y: bookings.flatMap((b) => [b.service_name, b.service_name]),
      mode: "lines+markers",
      line: { width: 10 },
      marker: { size: 8 },
      name: "Bookings",
      hoverinfo: "text",
      text: bookings.flatMap((b) => [
        `Service: ${b.service_name}<br>Start: ${new Date(b.start_date).toLocaleString()}`,
        `End: ${new Date(b.end_date).toLocaleString()}`,
      ]),
    },
  ];

  // 🕒 Layout setup
  const layout = {
    title: {
      text: "📅 Scheduled Timeline",
      font: { size: 22 },
    },
    xaxis: {
      title: "Date & Time",
      type: "date",
      tickformat: "%d-%b %H:%M",
    },
    yaxis: {
      title: "Service Name",
      type: "category",
      automargin: true,
    },
    showlegend: false,
    height: 600,
    margin: { l: 150, r: 50, t: 80, b: 80 },
    plot_bgcolor: "#f9fafb",
    paper_bgcolor: "#f9fafb",
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
        🕒 Service Booking Timeline
      </h2>

      <Plot
        data={timelineData}
        layout={layout}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        config={{ responsive: true }}
      />
    </div>
  );
}

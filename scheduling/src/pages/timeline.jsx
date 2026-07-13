import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { RefreshCw, Calendar, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../components/ui";

const API_URL = "https://manpower.cmti.online/bookings/";

export default function Timeline() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="w-full px-6 py-8 max-w-none">
        <div className="p-12 text-center text-gray-400 space-y-3 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
          <p className="text-xs">Generating Gantt timeline view...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="w-full px-6 py-8 max-w-none">
        <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center bg-white border border-gray-100 rounded-2xl">
          <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Info size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">No active bookings</h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
            There are no booking allocations to display on the timeline chart.
          </p>
        </div>
      </div>
    );
  }

  const timelineData = [
    {
      x: bookings.flatMap((b) => [b.start_date, b.end_date]),
      y: bookings.flatMap((b) => [b.service_name, b.service_name]),
      mode: "lines+markers",
      line: { width: 6, color: "#3B82F6" },
      marker: { size: 8, color: "#1D4ED8" },
      name: "Bookings",
      hoverinfo: "text",
      text: bookings.flatMap((b) => [
        `Service: ${b.service_name}<br>Start: ${new Date(b.start_date).toLocaleString()}`,
        `End: ${new Date(b.end_date).toLocaleString()}`,
      ]),
    },
  ];

  const layout = {
    title: {
      text: "AMC Scheduled Timeline",
      font: { size: 14, color: "#1f2937", family: "Inter, sans-serif" },
    },
    xaxis: {
      title: "Date & Time",
      type: "date",
      tickformat: "%d-%b %H:%M",
      titlefont: { color: "#6b7280", size: 11 },
      tickfont: { color: "#6b7280", size: 10 },
      gridcolor: "#f3f4f6"
    },
    yaxis: {
      title: "Service Competency",
      type: "category",
      automargin: true,
      titlefont: { color: "#6b7280", size: 11 },
      tickfont: { color: "#6b7280", size: 10 },
      gridcolor: "#f3f4f6"
    },
    showlegend: false,
    height: 500,
    margin: { l: 150, r: 50, t: 80, b: 80 },
    plot_bgcolor: "#ffffff",
    paper_bgcolor: "#ffffff",
  };

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>📊</span> Service Booking Gantt Timeline
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Visualize overlapping bookings, schedule blockouts, and load levels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchBookings}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Timeline Gantt Chart Card */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-6">
          <Plot
            data={timelineData}
            layout={layout}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </CardContent>
      </Card>

    </div>
  );
}

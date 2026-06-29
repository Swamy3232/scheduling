import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { RefreshCw, Calendar } from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading timeline...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Calendar size={48} className="opacity-30" />
              <span className="text-lg">No bookings available</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const layout = {
    title: {
      text: "Scheduled Timeline",
      font: { size: 20, color: "#1f2937" },
    },
    xaxis: {
      title: "Date & Time",
      type: "date",
      tickformat: "%d-%b %H:%M",
      titlefont: { color: "#6b7280" },
      tickfont: { color: "#6b7280" },
    },
    yaxis: {
      title: "Service Name",
      type: "category",
      automargin: true,
      titlefont: { color: "#6b7280" },
      tickfont: { color: "#6b7280" },
    },
    showlegend: false,
    height: 600,
    margin: { l: 150, r: 50, t: 80, b: 80 },
    plot_bgcolor: "#ffffff",
    paper_bgcolor: "#ffffff",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Booking Timeline</h1>
            <p className="text-gray-600">Visualize scheduled bookings over time</p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchBookings}
            leftIcon={<RefreshCw size={20} />}
          >
            Refresh
          </Button>
        </div>

        <Card className="animate-slide-up">
          <CardContent className="p-6">
            <Plot
              data={timelineData}
              layout={layout}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

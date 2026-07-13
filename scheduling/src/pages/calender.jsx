import React, { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Calendar,
  BarChart3,
  PieChart,
  Users,
  Building,
  Filter,
  Download,
  Eye,
  Clock,
  TrendingUp,
  RefreshCw,
  Info,
  Layers,
  Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BookingDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("calendar"); // calendar, analytics, list
  const [filters, setFilters] = useState({
    category: "all",
    department: "all",
    manpower: "all"
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeManpower: 0,
    departments: 0,
    hoursBooked: 0
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      calculateStats();
    }
  }, [events]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://manpower.cmti.online/bookings/");
      const data = res.data;

      const formattedEvents = data.map((item) => ({
        id: item.booking_id,
        title: `${item.service_name} - ${item.manpower_name}`,
        start: item.start_date,
        end: item.end_date,
        backgroundColor: getEventColor(item.category),
        borderColor: getEventColor(item.category),
        textColor: "#ffffff",
        extendedProps: {
          serviceName: item.service_name,
          manpowerName: item.manpower_name,
          category: item.category,
          department: item.department,
          assignedBy: item.assigned_by,
          priceType: item.price_type,
          remarks: item.remarks,
          remarksUpdate: item.remarks_update,
          duration: calculateDuration(item.start_date, item.end_date),
          bookingId: item.booking_id
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate - startDate) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const getEventColor = (category) => {
    const colors = {
      industrial: "#3b82f6",
      academic: "#10b981",
      research: "#8b5cf6",
      default: "#6b7280"
    };
    return colors[category] || colors.default;
  };

  const calculateStats = () => {
    const uniqueManpower = [...new Set(events.map(e => e.extendedProps.manpowerName))];
    const uniqueDepartments = [...new Set(events.map(e => e.extendedProps.department))];
    
    let totalHours = 0;
    events.forEach(event => {
      totalHours += parseFloat(event.extendedProps.duration);
    });

    setStats({
      totalBookings: events.length,
      activeManpower: uniqueManpower.length,
      departments: uniqueDepartments.length,
      hoursBooked: totalHours.toFixed(1)
    });
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const props = event.extendedProps;
      return (
        (filters.category === "all" || props.category === filters.category) &&
        (filters.department === "all" || props.department === filters.department) &&
        (filters.manpower === "all" || props.manpowerName === filters.manpower)
      );
    });
  }, [events, filters]);

  const getChartData = () => {
    const categories = {};
    filteredEvents.forEach(event => {
      const cat = event.extendedProps.category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const departments = {};
    filteredEvents.forEach(event => {
      const dept = event.extendedProps.department;
      departments[dept] = (departments[dept] || 0) + 1;
    });

    return {
      categoryData: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: Object.keys(categories).map(cat => getEventColor(cat)),
          borderWidth: 1
        }]
      },
      departmentData: {
        labels: Object.keys(departments),
        datasets: [{
          label: 'Bookings',
          data: Object.values(departments),
          backgroundColor: '#3b82f6',
          borderColor: '#1d4ed8',
          borderWidth: 1
        }]
      }
    };
  };

  const chartData = getChartData();

  const handleEventClick = (info) => {
    setSelectedEvent({
      ...info.event.extendedProps,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end
    });
  };

  const handleDateClick = (info) => {
    console.log("Date clicked:", info.dateStr);
  };

  // Get unique filters
  const filterOptions = useMemo(() => {
    const categories = [...new Set(events.map(e => e.extendedProps.category))];
    const departments = [...new Set(events.map(e => e.extendedProps.department))];
    const manpower = [...new Set(events.map(e => e.extendedProps.manpowerName))];
    return { categories, departments, manpower };
  }, [events]);

  const renderRemarksUpdateBadge = (ru) => {
    const val = (ru || "waiting").toLowerCase();
    switch (val) {
      case "accepted":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Accepted</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      case "waiting":
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Waiting</span>;
    }
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
              <span>📅</span> Master Schedule Calendar
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Visualize service timelines, tracking ongoing operations, and analyze departmental cost distributions.
            </p>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "calendar" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "analytics" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Table View
            </button>
          </div>
          <Button
            variant="secondary"
            onClick={fetchBookings}
            className="h-11 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 font-medium px-4"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Allocations</span>
              <span className="text-2xl font-extrabold text-gray-800 block">{stats.totalBookings}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Engineers</span>
              <span className="text-2xl font-extrabold text-indigo-600 block">{stats.activeManpower}</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Clients</span>
              <span className="text-2xl font-extrabold text-purple-600 block">{stats.departments}</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Building size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Inspected Hours</span>
              <span className="text-2xl font-extrabold text-emerald-600 block">{stats.hoursBooked}h</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters toolbar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="all">All Categories</option>
                {filterOptions.categories.filter(Boolean).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.filter(Boolean).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Manpower */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Engineer</label>
              <select
                value={filters.manpower}
                onChange={(e) => setFilters(prev => ({ ...prev, manpower: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white font-semibold text-gray-600"
              >
                <option value="all">All Engineers</option>
                {filterOptions.manpower.filter(Boolean).map(mp => (
                  <option key={mp} value={mp}>{mp}</option>
                ))}
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main View Area */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 space-y-3 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
          <p className="text-xs">Generating schedule workspace...</p>
        </div>
      ) : viewMode === "calendar" ? (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6 overflow-hidden">
          <div className="fc-theme-premium">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              events={filteredEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              editable={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              height="auto"
            />
          </div>
        </Card>
      ) : viewMode === "analytics" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <PieChart size={16} /> Category Allocations
            </CardTitle>
            <div className="h-64 flex items-center justify-center">
              <Pie 
                data={chartData.categoryData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <BarChart3 size={16} /> Department Bookings
            </CardTitle>
            <div className="h-64 flex items-center justify-center">
              <Bar 
                data={chartData.departmentData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engineer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredEvents.map((event) => {
                    const props = event.extendedProps;
                    return (
                      <tr key={event.id} className="hover:bg-blue-50/10 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800">#{event.id}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>⚙️</span>
                            <span>{props.serviceName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                              {props.manpowerName ? props.manpowerName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <span>{props.manpowerName || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">{props.department || "-"}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <Calendar size={11} className="text-gray-400" />
                              {new Date(event.start).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(event.start).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                          <button
                            onClick={() => setSelectedEvent(props)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>Allocated Task Details</span>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Service Template</span>
              <h4 className="text-xs font-extrabold text-gray-800 mt-1 flex items-center gap-2">
                <span>⚙️</span> {selectedEvent.serviceName}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Engineer</span>
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mt-1">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 flex items-center justify-center font-bold rounded-full text-[9px]">
                    {selectedEvent.manpowerName ? selectedEvent.manpowerName.charAt(0).toUpperCase() : "U"}
                  </span>
                  {selectedEvent.manpowerName || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Department / Client</span>
                <span className="text-xs font-bold text-gray-700 mt-1 block">{selectedEvent.department || "-"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Remarks Verification</span>
                <span className="block mt-1">{renderRemarksUpdateBadge(selectedEvent.remarksUpdate)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Inspected duration</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1">
                  <Clock size={10} /> {selectedEvent.duration} Hours
                </span>
              </div>
            </div>

            {selectedEvent.remarks && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Observations Notes</span>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{selectedEvent.remarks}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Close Details
            </Button>
          </ModalFooter>
        </Modal>
      )}

    </div>
  );
};

export default BookingDashboard;
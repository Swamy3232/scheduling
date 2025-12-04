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
  TrendingUp
} from "lucide-react";

// Register all Chart.js components once
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
    // Category distribution
    const categories = {};
    filteredEvents.forEach(event => {
      const cat = event.extendedProps.category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Department distribution
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

  const exportData = () => {
    const exportEvents = filteredEvents.map(event => ({
      BookingID: event.extendedProps.bookingId,
      Service: event.extendedProps.serviceName,
      Manpower: event.extendedProps.manpowerName,
      Category: event.extendedProps.category,
      Department: event.extendedProps.department,
      Start: event.start,
      End: event.end,
      Duration: `${event.extendedProps.duration} hours`,
      AssignedBy: event.extendedProps.assignedBy,
      PriceType: event.extendedProps.priceType,
      Status: event.extendedProps.remarksUpdate
    }));

    const csvContent = [
      Object.keys(exportEvents[0]).join(","),
      ...exportEvents.map(e => Object.values(e).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export.csv';
    a.click();
  };

  const ViewSelector = () => (
    <div className="flex space-x-2 mb-6">
      <button
        onClick={() => setViewMode("calendar")}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
          viewMode === "calendar" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <Calendar size={20} />
        <span>Calendar</span>
      </button>
      <button
        onClick={() => setViewMode("analytics")}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
          viewMode === "analytics" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <BarChart3 size={20} />
        <span>Analytics</span>
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
          viewMode === "list" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <Eye size={20} />
        <span>List View</span>
      </button>
    </div>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold">{stats.totalBookings}</p>
          </div>
          <Calendar className="text-blue-500" size={24} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Manpower</p>
            <p className="text-2xl font-bold">{stats.activeManpower}</p>
          </div>
          <Users className="text-green-500" size={24} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Departments</p>
            <p className="text-2xl font-bold">{stats.departments}</p>
          </div>
          <Building className="text-purple-500" size={24} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Hours Booked</p>
            <p className="text-2xl font-bold">{stats.hoursBooked}h</p>
          </div>
          <Clock className="text-orange-500" size={24} />
        </div>
      </div>
    </div>
  );

  const FiltersPanel = () => {
    const uniqueCategories = [...new Set(events.map(e => e.extendedProps.category))];
    const uniqueDepartments = [...new Set(events.map(e => e.extendedProps.department))];
    const uniqueManpower = [...new Set(events.map(e => e.extendedProps.manpowerName))];

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center space-x-2">
            <Filter size={20} />
            <span>Filters</span>
          </h3>
          <button
            onClick={() => setFilters({ category: "all", department: "all", manpower: "all" })}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manpower</label>
            <select
              value={filters.manpower}
              onChange={(e) => setFilters({...filters, manpower: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">All Manpower</option>
              {uniqueManpower.map(mp => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const EventDetailsModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">Booking Details</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{selectedEvent.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Manpower:</span>
              <span className="font-medium">{selectedEvent.manpowerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{selectedEvent.duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium capitalize">{selectedEvent.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{selectedEvent.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price Type:</span>
              <span className="font-medium">{selectedEvent.priceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                selectedEvent.remarksUpdate === 'completed' ? 'bg-green-100 text-green-800' :
                selectedEvent.remarksUpdate === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedEvent.remarksUpdate || 'pending'}
              </span>
            </div>
            {selectedEvent.remarks && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Remarks:</p>
                <p className="mt-1">{selectedEvent.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and analyze all bookings in one place</p>
          </div>
          <button
            onClick={exportData}
            className="mt-4 md:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center space-x-2 hover:bg-green-700 transition"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>

        <StatsCards />
        <ViewSelector />
        <FiltersPanel />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <>
            {viewMode === "calendar" && (
              <div className="bg-white p-4 rounded-lg shadow">
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
                  height="70vh"
                  weekends={true}
                  editable={true}
                  selectable={true}
                  dayMaxEvents={3}
                />
              </div>
            )}

            {viewMode === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <PieChart size={20} />
                    <span>Category Distribution</span>
                  </h3>
                  <div className="h-64">
                    <Pie 
                      data={chartData.categoryData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <BarChart3 size={20} />
                    <span>Department Bookings</span>
                  </h3>
                  <div className="h-64">
                    <Bar 
                      data={chartData.departmentData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === "list" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manpower</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.extendedProps.serviceName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{event.extendedProps.manpowerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(event.start).toLocaleDateString()}
                              <br />
                              <span className="text-gray-500 text-xs">
                                {new Date(event.start).toLocaleTimeString()} - {new Date(event.end).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {event.extendedProps.duration}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full capitalize"
                                  style={{ 
                                    backgroundColor: `${getEventColor(event.extendedProps.category)}20`,
                                    color: getEventColor(event.extendedProps.category)
                                  }}>
                              {event.extendedProps.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.extendedProps.remarksUpdate === 'completed' ? 'bg-green-100 text-green-800' :
                              event.extendedProps.remarksUpdate === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.extendedProps.remarksUpdate || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedEvent({
                                ...event.extendedProps,
                                title: event.title,
                                start: event.start,
                                end: event.end
                              })}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EventDetailsModal />
    </div>
  );
};

export default BookingDashboard;
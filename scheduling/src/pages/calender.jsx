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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, ModalHeader, ModalBody, ModalFooter, StatusBadge } from "../components/ui";

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
      <Button
        variant={viewMode === "calendar" ? "primary" : "secondary"}
        onClick={() => setViewMode("calendar")}
        leftIcon={<Calendar size={20} />}
      >
        Calendar
      </Button>
      <Button
        variant={viewMode === "analytics" ? "primary" : "secondary"}
        onClick={() => setViewMode("analytics")}
        leftIcon={<BarChart3 size={20} />}
      >
        Analytics
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "secondary"}
        onClick={() => setViewMode("list")}
        leftIcon={<Eye size={20} />}
      >
        List View
      </Button>
    </div>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <Calendar className="text-blue-500" size={24} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Manpower</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeManpower}</p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
            </div>
            <Building className="text-purple-500" size={24} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hours Booked</p>
              <p className="text-2xl font-bold text-gray-900">{stats.hoursBooked}h</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const FiltersPanel = () => {
    const uniqueCategories = [...new Set(events.map(e => e.extendedProps.category))];
    const uniqueDepartments = [...new Set(events.map(e => e.extendedProps.department))];
    const uniqueManpower = [...new Set(events.map(e => e.extendedProps.manpowerName))];

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter size={20} />
              <span>Filters</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ category: "all", department: "all", manpower: "all" })}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Manpower</option>
                {uniqueManpower.map(mp => (
                  <option key={mp} value={mp}>{mp}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EventDetailsModal = () => {
    if (!selectedEvent) return null;

    return (
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} size="sm">
        <ModalHeader>
          <CardTitle>Booking Details</CardTitle>
        </ModalHeader>
        <ModalBody>
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
              <StatusBadge 
                status={selectedEvent.remarksUpdate === 'completed' ? 'inactive' : selectedEvent.remarksUpdate === 'waiting' ? 'pending' : 'active'} 
                label={selectedEvent.remarksUpdate || 'pending'}
              />
            </div>
            {selectedEvent.remarks && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Remarks:</p>
                <p className="mt-1">{selectedEvent.remarks}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setSelectedEvent(null)} fullWidth>Close</Button>
        </ModalFooter>
      </Modal>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Dashboard</h1>
            <p className="text-gray-600">Manage and analyze all bookings in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={fetchBookings}
              leftIcon={<RefreshCw size={20} />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={exportData}
              leftIcon={<Download size={20} />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <StatsCards />
        <ViewSelector />
        <FiltersPanel />

        {loading ? (
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-500">Loading bookings...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "calendar" && (
              <Card>
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            )}

            {viewMode === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart size={20} />
                      <span>Category Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Pie 
                        data={chartData.categoryData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 size={20} />
                      <span>Department Bookings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>
            )}

            {viewMode === "list" && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
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
                              <StatusBadge 
                                status={event.extendedProps.remarksUpdate === 'completed' ? 'inactive' : event.extendedProps.remarksUpdate === 'waiting' ? 'pending' : 'active'} 
                                label={event.extendedProps.remarksUpdate || 'pending'}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEvent({
                                  ...event.extendedProps,
                                  title: event.title,
                                  start: event.start,
                                  end: event.end
                                })}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <EventDetailsModal />
    </div>
  );
};

export default BookingDashboard;
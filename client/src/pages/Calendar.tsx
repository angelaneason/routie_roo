import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, ChevronRight, MapPin, ChevronDown, ChevronRight as ChevronRightIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { formatDistance } from "@shared/distance";
import { AddEventDialog } from "@/components/AddEventDialog";
import { EditEventDialog } from "@/components/EditEventDialog";

type ViewMode = "day" | "week" | "month";

export default function Calendar() {
  const { user, loading: authLoading, refresh: refreshAuth } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visibleCalendars, setVisibleCalendars] = useState<string[]>([]);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Fetch calendar list with refetch on mount
  const utils = trpc.useUtils();
  const calendarsQuery = trpc.calendar.getCalendarList.useQuery(undefined, {
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  // Refetch user data on mount to get latest tokens
  useEffect(() => {
    refreshAuth();
  }, []);
  
  // Initialize visible calendars when calendars are loaded
  const calendars = calendarsQuery.data || [];
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendars.length === 0) {
      setVisibleCalendars(calendars.map((c: any) => c.id));
    }
  }, [calendars.length]);
  
  const eventsQuery = trpc.calendar.getEvents.useQuery({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    visibleCalendars: visibleCalendars, // Pass visible calendar IDs to backend
  }, {
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Events are already filtered by backend based on visibleCalendars
  const events = eventsQuery.data || [];

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get display title based on view mode
  const getDisplayTitle = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    if (viewMode === "day") {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (viewMode === "week") {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  // Helper to get week start (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Get event color based on calendar
  const getEventColor = (event: any) => {
    if (event.type === 'route') {
      return 'bg-blue-500';
    }
    if (event.type === 'rescheduled') {
      return 'bg-orange-500'; // Orange for rescheduled stops
    }
    // Find calendar and use its color
    const calendar = calendars.find((c: any) => c.id === event.calendarId);
    return calendar?.backgroundColor || 'bg-gray-400';
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
    const dayEvents = events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === currentDate.toDateString();
    });

    const now = new Date();
    const isToday = currentDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return (
      <div className="relative">
        {/* Time column + events */}
        <div className="flex">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200 text-sm text-gray-500 pr-2 text-right pt-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 relative border-l border-gray-200">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200" />
            ))}

            {/* Current time indicator */}
            {isToday && currentHour >= 6 && currentHour <= 22 && (
              <div 
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                style={{ top: `${((currentHour - 6) * 64) + (currentMinute / 60 * 64)}px` }}
              >
                <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
              </div>
            )}

            {/* Event blocks */}
            {dayEvents.map((event, idx) => {
              const startDate = new Date(event.start);
              const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 3600000);
              
              const startHour = startDate.getHours();
              const startMinute = startDate.getMinutes();
              const endHour = endDate.getHours();
              const endMinute = endDate.getMinutes();
              
              if (startHour < 6 || startHour > 22) return null;
              
              const top = ((startHour - 6) * 64) + (startMinute / 60 * 64);
              const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
              const height = Math.max((duration / 60) * 64, 32);
              
              const bgColor = getEventColor(event);
              
              return (
                <div
                  key={event.id}
                  className={`absolute left-2 right-2 text-white rounded px-2 py-1 text-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    backgroundColor: bgColor.replace('bg-', '')
                  }}
                  onClick={() => {
                    if (event.routeId) {
                      window.location.href = `/route/${event.routeId}`;
                    }
                  }}
                >
                  <div className="font-medium truncate">{event.summary}</div>
                  <div className="text-xs opacity-90">
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return (
      <div className="relative overflow-x-auto">
        <div className="flex min-w-[800px]">
          {/* Time column */}
          <div className="w-16 flex-shrink-0">
            <div className="h-12 border-b border-gray-200" /> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200 text-xs text-gray-500 pr-1 text-right pt-1">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIdx) => {
            const isToday = day.toDateString() === now.toDateString();
            const dayEvents = events.filter(event => {
              if (!event.start) return false;
              const eventDate = new Date(event.start);
              return eventDate.toDateString() === day.toDateString();
            });

            return (
              <div key={dayIdx} className="flex-1 min-w-[100px] border-l border-gray-200">
                {/* Day header */}
                <div className={`h-12 border-b border-gray-200 text-center py-2 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-500">{dayNames[day.getDay()]}</div>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>{day.getDate()}</div>
                </div>

                {/* Hours grid */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-200" />
                  ))}

                  {/* Current time indicator */}
                  {isToday && currentHour >= 6 && currentHour <= 22 && (
                    <div 
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                      style={{ top: `${((currentHour - 6) * 64) + (currentMinute / 60 * 64)}px` }}
                    />
                  )}

                  {/* Event blocks */}
                  {dayEvents.map((event) => {
                    const startDate = new Date(event.start);
                    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 3600000);
                    
                    const startHour = startDate.getHours();
                    const startMinute = startDate.getMinutes();
                    const endHour = endDate.getHours();
                    const endMinute = endDate.getMinutes();
                    
                    if (startHour < 6 || startHour > 22) return null;
                    
                    const top = ((startHour - 6) * 64) + (startMinute / 60 * 64);
                    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                    const height = Math.max((duration / 60) * 64, 24);
                    
                    const bgColor = getEventColor(event);
                    
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-0.5 right-0.5 text-white rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          backgroundColor: bgColor.replace('bg-', '')
                        }}
                        onClick={() => {
                          if (event.routeId) {
                            window.location.href = `/route/${event.routeId}`;
                          }
                        }}
                        title={`${event.summary}\n${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      >
                        <div className="font-medium truncate">{event.summary}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month view (existing grid)
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(year, month, day));
    }

    const eventsByDate = new Map<string, typeof events>();
    events.forEach(event => {
      if (event.start) {
        const dateKey = new Date(event.start).toDateString();
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
      }
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-medium text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50 rounded" />;
            }

            const dateKey = day.toDateString();
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 rounded border ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => {
                    const bgColor = getEventColor(event);
                    return (
                      <div
                        key={event.id}
                        className={`text-xs text-white px-2 py-1 rounded truncate cursor-pointer hover:opacity-80`}
                        style={{ backgroundColor: bgColor.replace('bg-', '') }}
                        onClick={() => {
                          if (event.routeId) {
                            window.location.href = `/route/${event.routeId}`;
                          }
                        }}
                        title={event.summary}
                      >
                        {event.summary}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedDayEvents(dayEvents);
                        setShowEventDialog(true);
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Routie Roo Calendar - Let's hop to it!</h1>
            <p className="text-muted-foreground">View and manage your scheduled routes</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddEventDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Calendar sidebar */}
          {!sidebarCollapsed && (
            <Card className="w-64 flex-shrink-0 p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">My Calendars</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await refreshAuth();
                      await calendarsQuery.refetch();
                    }}
                    className="h-6 w-6 p-0"
                    title="Refresh calendar list"
                  >
                    <Loader2 className={`h-3 w-3 ${calendarsQuery.isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {calendarsQuery.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : calendars.length === 0 ? (
                <p className="text-sm text-gray-500">No calendars found</p>
              ) : (
                <div className="space-y-2">
                  {calendars.map((calendar: any) => (
                    <label
                      key={calendar.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <Checkbox
                        checked={visibleCalendars.includes(calendar.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVisibleCalendars([...visibleCalendars, calendar.id]);
                          } else {
                            setVisibleCalendars(visibleCalendars.filter(id => id !== calendar.id));
                          }
                        }}
                      />
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                      />
                      <span className="text-sm truncate">{calendar.summary}</span>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          )}
          
          {/* Collapsed sidebar button */}
          {sidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(false)}
              className="h-10 px-2 flex-shrink-0"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          )}

          <Card className="p-6 flex-1">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold ml-4">{getDisplayTitle()}</h2>
              </div>

              {/* View switcher */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Button>
              </div>
            </div>
            
            {/* Event type legend */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-600">Routes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-gray-600">Rescheduled Stops</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400" />
                <span className="text-gray-600">Google Calendar</span>
              </div>
            </div>

            {/* Loading state */}
            {eventsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Render appropriate view */}
                {viewMode === "day" && renderDayView()}
                {viewMode === "week" && renderWeekView()}
                {viewMode === "month" && renderMonthView()}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Event details dialog for month view */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Events on {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDayEvents.map(event => {
              const startDate = event.start ? new Date(event.start) : null;
              const endDate = event.end ? new Date(event.end) : null;
              
              // Use calendar color if available, otherwise fallback to type-based colors
              let bgColor = 'bg-gray-100 border-gray-300';
              let textColor = 'text-gray-900';
              
              if (event.color) {
                // Google Calendar events have a color property
                bgColor = `border-2`;
                textColor = 'text-gray-900';
              } else if (event.type === 'route') {
                bgColor = 'bg-blue-500 border-blue-600';
                textColor = 'text-white';
              } else if (event.type === 'rescheduled') {
                bgColor = 'bg-orange-500 border-orange-600';
                textColor = 'text-white';
              }
              
              return (
                <div 
                  key={event.id} 
                  className={`p-4 rounded border ${bgColor} ${textColor}`}
                  style={event.color ? { backgroundColor: event.color, borderColor: event.color } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium text-lg ${textColor}`}>{event.summary}</h3>
                      {startDate && (
                        <p className={`text-sm mt-1 ${event.color || event.type === 'route' || event.type === 'rescheduled' ? 'text-white/90' : 'text-gray-600'}`}>
                          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {endDate && ` - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                        </p>
                      )}
                      {event.location && (
                        <p className={`text-sm mt-1 flex items-center gap-1 ${event.color || event.type === 'route' || event.type === 'rescheduled' ? 'text-white/90' : 'text-gray-600'}`}>
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className={`text-sm mt-2 ${event.color || event.type === 'route' || event.type === 'rescheduled' ? 'text-white/90' : 'text-gray-700'}`}>{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {event.routeId && (
                        <Link href={`/route/${event.routeId}`}>
                          <Button size="sm">View Route</Button>
                        </Link>
                      )}
                      {event.type === 'google' && event.googleEventId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingEvent(event);
                            setShowEditDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Event Dialog */}
      <AddEventDialog
        open={showAddEventDialog}
        onOpenChange={setShowAddEventDialog}
        onEventCreated={() => {
          eventsQuery.refetch();
        }}
      />
      
      {/* Edit Event Dialog */}
      <EditEventDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        event={editingEvent}
        onEventUpdated={() => {
          eventsQuery.refetch();
          setShowEventDialog(false);
        }}
      />
    </div>
  );
}

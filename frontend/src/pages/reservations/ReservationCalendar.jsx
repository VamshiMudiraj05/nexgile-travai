import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  BedDouble, 
  Loader2,
  CalendarDays
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomService } from '../../services/roomService';
import { reservationService } from '../../services/reservationService';
import { Calendar } from '@/components/ui/calendar';

export const ReservationCalendar = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsCalendarPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate array of 14 consecutive days starting from startDate
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await propertyService.getProperties({ limit: 100 });
        setProperties(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedPropertyId(data.items[0].id || data.items[0]._id);
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      const loadData = async () => {
        try {
          setLoading(true);
          const [roomData, resData] = await Promise.all([
            roomService.getRoomsByProperty(selectedPropertyId, { limit: 100 }),
            reservationService.getReservations({
              property_id: selectedPropertyId,
              limit: 200,
            }),
          ]);
          setRooms(roomData.items || []);
          setReservations(resData.items || []);
        } catch (err) {
          console.error('Failed to load calendar data:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [selectedPropertyId, startDate]);

  const handlePrevDays = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d);
  };

  const handleNextDays = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d);
  };

  const handleToday = () => {
    setStartDate(new Date());
  };

  const getBookingForRoomDate = (roomId, dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    return reservations.find((r) => {
      return (
        String(r.room_id) === String(roomId) &&
        r.status !== 'CANCELLED' &&
        r.check_in_date <= dateStr &&
        r.check_out_date > dateStr
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#13152C] border border-[#2C315E] p-4 rounded-[4px] shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-[#DFB76C]" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="luxury-input text-xs font-semibold bg-[#1B1E3D] cursor-pointer"
          >
            {properties.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 relative" ref={calendarRef}>
          <button
            onClick={handlePrevDays}
            className="p-1.5 rounded-[2px] bg-[#13152C] border border-[#2C315E] text-white hover:bg-[#1B1E3D] cursor-pointer"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToday}
            className="btn-luxury-secondary text-xs py-1 px-3"
          >
            Today
          </button>

          <button
            onClick={handleNextDays}
            className="p-1.5 rounded-[2px] bg-[#13152C] border border-[#2C315E] text-white hover:bg-[#1B1E3D] cursor-pointer"
            title="Next 7 Days"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* EasyUI Interactive Calendar Trigger */}
          <button
            type="button"
            onClick={() => setIsCalendarPickerOpen(!isCalendarPickerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/60 text-[#DFB76C] text-xs font-cinzel font-semibold tracking-wider transition-all cursor-pointer ml-1 shadow-xs"
            title="Click to jump to date using EasyUI Calendar"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#DFB76C]" />
            <span>
              {days[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
              {days[days.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </button>

          {/* EasyUI Calendar Gliding Pill Popover */}
          {isCalendarPickerOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Calendar
                  mode="single"
                  value={startDate}
                  onChange={(d) => {
                    if (d) {
                      setStartDate(d);
                      setIsCalendarPickerOpen(false);
                    }
                  }}
                  className="shadow-2xl border-[#DFB76C]/40"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="py-20 text-center text-white/60">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DFB76C] mb-2" />
          <p className="font-cinzel text-xs tracking-wider uppercase">Loading timeline occupancy...</p>
        </div>
      ) : (
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#1B1E3D] text-white/70 border-b border-[#2C315E] font-cinzel">
                  <th className="py-3 px-4 font-bold uppercase sticky left-0 z-20 bg-[#1B1E3D] w-48 border-r border-[#2C315E] text-[10px] tracking-wider">
                    Suite / Unit
                  </th>
                  {days.map((day) => {
                    const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    return (
                      <th
                        key={day.toISOString()}
                        className={`py-3 px-2.5 text-center font-semibold min-w-[72px] border-r border-[#2C315E] ${
                          isToday ? 'bg-[#DFB76C]/20 text-white font-bold' : ''
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider text-white/50">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="font-editorial text-base font-normal text-white">{day.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFB76C]/15 font-sans">
                {rooms.map((room) => {
                  const rId = room.id || room._id;
                  return (
                    <tr key={rId} className="hover:bg-[#1B1E3D]/40 transition-colors">
                      {/* Room Header Column */}
                      <td className="py-3 px-4 font-bold sticky left-0 z-10 bg-[#13152C] border-r border-[#2C315E]">
                        <div className="flex items-center gap-2.5">
                          <BedDouble className="w-4 h-4 text-[#DFB76C] flex-shrink-0" />
                          <div>
                            <span className="font-editorial text-base font-normal text-white">Suite #{room.room_number}</span>
                            <span className="font-sans text-[10px] text-white/60 block font-normal">
                              {room.room_type_name || 'Standard'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {days.map((day) => {
                        const booking = getBookingForRoomDate(rId, day);
                        const isCheckInDay = booking && booking.check_in_date === day.toISOString().split('T')[0];

                        let statusColor = 'bg-transparent';
                        if (booking) {
                          if (booking.status === 'CHECKED_IN') statusColor = 'bg-[#F2F8F4] text-[#2D5A40] border border-[#2D5A40]/30';
                          else if (booking.status === 'CONFIRMED') statusColor = 'bg-[#13152C] text-[#DFB76C] border border-[#2C315E]';
                          else statusColor = 'bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E]';
                        }

                        return (
                          <td
                            key={day.toISOString()}
                            className="p-1 border-r border-[#2C315E] text-center relative h-14"
                          >
                            {booking ? (
                              <Link
                                to={`/reservations/${booking.id || booking._id}`}
                                className={`w-full h-full rounded-[2px] p-1 flex flex-col items-center justify-center text-[10px] font-semibold transition-transform hover:scale-95 shadow-sm ${statusColor}`}
                                title={`${booking.guest_name} (${booking.status})`}
                              >
                                {isCheckInDay ? (
                                  <span className="truncate max-w-[62px] text-xs font-editorial">
                                    {booking.guest_name?.split(' ')[0]}
                                  </span>
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                )}
                              </Link>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationCalendar;

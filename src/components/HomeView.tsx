import React, { useState, useEffect } from 'react';
import { 
  Bell, Utensils, Clock, Map, Flame, Calendar, 
  Umbrella, CheckCircle2, AlertTriangle, LogOut, Check
} from 'lucide-react';
import { Shift, ClockSession } from '../types';

interface HomeProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  clockSession: ClockSession;
  setClockSession: React.Dispatch<React.SetStateAction<ClockSession>>;
  weeklyHours: number;
  setWeeklyHours: React.Dispatch<React.SetStateAction<number>>;
  hotStreaks: number;
  vacationStatus: string;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export default function HomeView({
  shifts,
  setShifts,
  clockSession,
  setClockSession,
  weeklyHours,
  setWeeklyHours,
  hotStreaks,
  vacationStatus,
  onNavigate,
  showToast,
}: HomeProps) {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showNotifications, setShowNotifications] = useState(false);
  const [shiftRoleFilter, setShiftRoleFilter] = useState<string>('All');

  // Filter shifts that are available to claim
  const openShifts = shifts.filter(s => s.status === 'Available');
  const roleOptions = ['All', ...Array.from(new Set(openShifts.map(s => s.role)))];
  const filteredOpenShifts = shiftRoleFilter === 'All'
    ? openShifts
    : openShifts.filter(s => s.role === shiftRoleFilter);

  // Find the next upcoming shift for today
  const nextShift = shifts.find(s => s.isMyShift && s.date === 'May 9' && s.status === 'Confirmed');

  // Manage clock in timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (clockSession.isClockedIn && clockSession.start_time) {
      const updateTimer = () => {
        const start = new Date(clockSession.start_time!).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;

        const secs = Math.floor((diffMs / 1000) % 60);
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));

        const pad = (num: number) => String(num).padStart(2, '0');
        setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00:00');
    }

    return () => clearInterval(intervalId);
  }, [clockSession.isClockedIn, clockSession.start_time]);

  const handleClockToggle = () => {
    if (!clockSession.isClockedIn) {
      // Clock In
      const nowStr = new Date().toISOString();
      setClockSession({
        isClockedIn: true,
        start_time: nowStr,
        accumulatedMinutes: clockSession.accumulatedMinutes
      });
      showToast("Clocked in successfully. Have a great shift!", "success");
    } else {
      // Clock Out
      const start = new Date(clockSession.start_time!).getTime();
      const now = new Date().getTime();
      const diffMinutes = Math.floor((now - start) / (1000 * 60));
      
      // Minimum 1 min increment or 0.1 hours for testing purposes
      const hoursAdded = Math.max(0.1, Number((diffMinutes / 60).toFixed(1)));
      // Let's add standard mockup hours (e.g., 6 hours) if elapsed time was just a few seconds
      const simulatedHours = diffMinutes < 1 ? 6 : hoursAdded;

      setWeeklyHours(prev => Number((prev + simulatedHours).toFixed(1)));
      setClockSession({
        isClockedIn: false,
        start_time: null,
        accumulatedMinutes: clockSession.accumulatedMinutes + Math.round(simulatedHours * 60)
      });
      
      showToast(`Clocked out successfully! Recorded ${simulatedHours} hours.`, "success");
    }
  };

  const handleClaimShift = (shiftId: string) => {
    const shiftToClaim = shifts.find(s => s.id === shiftId);
    if (!shiftToClaim) return;

    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return { ...s, status: 'Confirmed', isMyShift: true };
      }
      return s;
    }));

    setWeeklyHours(prev => prev + shiftToClaim.hours);
    showToast(`Claimed ${shiftToClaim.role} shift on ${shiftToClaim.date}!`, "success");
  };

  const mockNotifications = [
    { id: 1, title: "Shift Approved", text: "Sarah approved your shift trade for Wednesday.", time: "1 hour ago", unread: true },
    { id: 2, title: "Summer Grill-off", text: "Don't forget the team picnic this Sunday at 2 PM!", time: "4 hours ago", unread: true },
    { id: 3, title: "Sanitization Rules", text: "New protocols document is posted in #kitchen-staff.", time: "1 day ago", unread: false }
  ];

  return (
    <div>
      {/* Header top portion */}
      <div className="flex justify-between items-center mb-lg">
        <div className="space-y-base">
          <h2 className="text-2xl font-bold font-headline-md text-secondary">Good morning, Alex</h2>
          <p className="font-body-md text-on-surface-variant flex items-center gap-1.5">
            <Clock size={16} className="text-primary" /> Here is your schedule for the day.
          </p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-100 border border-outline-variant/20 bg-white"
          >
            <Bell size={20} className="text-primary" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
          </button>

          {/* Quick Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-sm bg-surface-container-low font-semibold text-secondary text-sm flex justify-between border-b border-outline-variant">
                <span>Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:underline">Close</button>
              </div>
              <div className="divide-y divide-outline-variant max-h-60 overflow-y-auto">
                {mockNotifications.map(notif => (
                  <div key={notif.id} className={`p-sm text-xs space-y-1 ${notif.unread ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-secondary flex items-center gap-1">
                        {notif.unread && <span className="h-1.5 w-1.5 rounded-full bg-error"></span>}
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">{notif.time}</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">{notif.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clock In Live stopwatch HUD */}
      {clockSession.isClockedIn && (
        <div className="mb-md p-md bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-container"></span>
            </span>
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-wider">ACTIVE WORK SHIFT</p>
              <p className="text-sm font-semibold text-on-primary-container">Server • Wayback Bar & Grill</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant font-mono">ELAPSED TIME</p>
            <p className="text-lg font-bold font-mono text-primary">{elapsedTime}</p>
          </div>
        </div>
      )}

      {/* Main Shift Status Card */}
      <section className="mb-lg">
        {nextShift ? (
          <div className="bg-surface-container-lowest rounded-xl custom-shadow overflow-hidden status-bar-emerald border-l-4">
            <div className="p-md space-y-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-primary">NEXT SHIFT</span>
                  <h3 className="text-lg font-semibold text-secondary mt-1">Today, {nextShift.timeRange}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant">
                    <Utensils size={16} className="text-primary" />
                    <p className="text-sm font-body-sm">{nextShift.role} • {nextShift.location}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  Confirmed
                </div>
              </div>

              <div className="flex gap-sm">
                <button 
                  onClick={handleClockToggle}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition-transform active:scale-95 duration-100 ${
                    clockSession.isClockedIn 
                      ? 'bg-error text-white shadow-sm'
                      : 'bg-primary-container text-on-primary-container shadow-sm hover:brightness-105'
                  }`}
                  id="clockInBtn"
                >
                  {clockSession.isClockedIn ? <LogOut size={18} /> : <Clock size={18} />}
                  {clockSession.isClockedIn ? 'Clock Out' : 'Clock In'}
                </button>
                <a 
                  href="https://maps.google.com/?q=Wayback+Grill" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-12 h-12 border border-secondary/20 text-secondary rounded-xl flex items-center justify-center hover:bg-surface-container transition-colors bg-white hover:border-primary/50"
                  title="View Route Map"
                >
                  <Map size={18} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-md text-center border-2 border-dashed border-outline-variant">
            <Clock size={24} className="mx-auto text-on-surface-variant/40 mb-2" />
            <p className="font-semibold text-secondary">No shift scheduled for today</p>
            <button 
              onClick={() => onNavigate('schedule')}
              className="text-primary text-xs mt-1 hover:underline font-bold"
            >
              Browse Available Shifts &rarr;
            </button>
          </div>
        )}
      </section>

      {/* Stats Bento Box Grid */}
      <div className="grid grid-cols-2 gap-sm mb-lg">
        {/* Weekly Hours with progress bar */}
        <div className="bg-surface-container-lowest p-md rounded-xl custom-shadow flex flex-col justify-between border border-outline-variant/10">
          <div className="flex items-center justify-between">
            <Calendar size={18} className="text-secondary" />
            <span className="text-xs font-medium text-on-surface-variant">Weekly</span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-secondary">{weeklyHours}</p>
            <p className="text-xs text-on-surface-variant">/ 40 hrs goal</p>
          </div>
          <div className="mt-2">
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (weeklyHours / 40) * 100)}%`,
                  background: weeklyHours >= 40 ? '#00a86b' : 'linear-gradient(90deg, #006d43, #00a86b)'
                }}
              />
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {weeklyHours >= 40 ? '🎉 Goal reached!' : `${Math.max(0, 40 - weeklyHours).toFixed(1)} hrs to goal`}
            </p>
          </div>
        </div>

        {/* Hot Streaks */}
        <div className="bg-secondary text-on-secondary p-md rounded-xl custom-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Flame size={18} className="text-white/80" />
            <span className="text-xs font-medium text-white/70">Hot Streaks</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{hotStreaks}</p>
            <p className="text-xs text-white/70">Shifts in a row</p>
          </div>
        </div>

        {/* Estimated Earnings card */}
        <div className="col-span-2 bg-gradient-to-r from-primary to-primary-container p-md rounded-xl custom-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Est. Earnings This Week</p>
            <p className="text-2xl font-bold text-white mt-1">${(weeklyHours * 22).toFixed(0)}</p>
            <p className="text-[11px] text-white/70 mt-0.5">Based on {weeklyHours} hrs × $22/hr</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
            <Check size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Open Shifts Section */}
      <section className="space-y-sm mb-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-secondary">Open Shifts</h3>
          <button 
            onClick={() => onNavigate('schedule')}
            className="text-primary text-xs font-bold hover:underline"
          >
            View All
          </button>
        </div>

        {/* Role Filter Chips */}
        {roleOptions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {roleOptions.map(role => (
              <button
                key={role}
                onClick={() => setShiftRoleFilter(role)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  shiftRoleFilter === role
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-sm">
          {filteredOpenShifts.length > 0 ? (
            filteredOpenShifts.slice(0, 3).map((opS) => (
              <div 
                key={opS.id}
                className="bg-surface-container-lowest p-md rounded-xl custom-shadow status-bar-orange border-l-4 flex justify-between items-center border border-outline-variant/10"
              >
                <div>
                  <p className="text-xs font-bold text-tertiary">Available Shift</p>
                  <p className="text-sm font-semibold text-secondary mt-0.5">{opS.dateLabel} • {opS.timeRange}</p>
                  <p className="text-xs text-on-surface-variant">{opS.role} • {opS.location}</p>
                  <p className="text-xs font-semibold text-primary mt-0.5">~${opS.rate * opS.hours} est. earnings</p>
                </div>
                <button 
                  onClick={() => handleClaimShift(opS.id)}
                  className="bg-secondary-fixed text-on-secondary-fixed hover:bg-primary-container hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <div className="bg-surface-container-low p-4 rounded-xl text-center text-xs text-on-surface-variant">
              No open shift opportunities{shiftRoleFilter !== 'All' ? ` for ${shiftRoleFilter}` : ''} available at this time.
            </div>
          )}
        </div>
      </section>

      {/* Pending Vacation Requests */}
      <section className="space-y-sm mb-lg">
        <h3 className="text-lg font-semibold text-secondary">Pending Requests</h3>
        <div className="bg-surface-container-lowest p-md rounded-xl custom-shadow flex items-center gap-md border border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Umbrella size={22} className="stroke-[2.5px]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-secondary">Vacation Request</p>
            <p className="text-xs text-on-surface-variant">June 20 – June 25</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              vacationStatus === 'Approved'
                ? 'bg-emerald-50 text-primary'
                : 'bg-amber-50 text-amber-700'
            }`}>
              <CheckCircle2 size={13} />
              {vacationStatus}
            </span>
            <p className="text-[10px] text-on-surface-variant mt-1">2 days ago</p>
          </div>
        </div>
      </section>

      {/* Safety Updates Alert Banner */}
      <section className="mb-6">
        <div className="relative bg-tertiary-fixed rounded-xl p-md overflow-hidden flex items-center justify-between border border-tertiary/20">
          <div className="relative z-10 space-y-1 pr-6">
            <h4 className="text-md font-bold text-on-tertiary-fixed">Safety Update</h4>
            <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed">
              New sanitization protocols are in effect starting Monday. Please review details in Channels.
            </p>
          </div>
          <AlertTriangle 
            size={48} 
            className="text-tertiary opacity-10 absolute right-4 top-1/2 -translate-y-1/2 rotate-12 scale-[2]" 
          />
        </div>
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Calendar, MapPin, Moon, Plus, Check, RefreshCw, 
  X, AlertCircle, History, Sparkles, Star, Coffee, Clock,
  CheckCircle2
} from 'lucide-react';
import { Shift, Announcement } from '../types';

interface ScheduleViewProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  weeklyHours: number;
  setWeeklyHours: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  swapHistory: any[];
  setSwapHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ScheduleView({
  shifts,
  setShifts,
  weeklyHours,
  setWeeklyHours,
  showToast,
  swapHistory,
  setSwapHistory,
}: ScheduleViewProps) {
  // Navigation tabs: 'schedule' (Screen 2) vs 'board' (Screen 4)
  const [subTab, setSubTab] = useState<'schedule' | 'board'>('schedule');
  
  // Tab within Trade Board: 'available' | 'my' | 'history'
  const [boardTab, setBoardTab] = useState<'available' | 'my' | 'history'>('available');

  // Filter schedules by day
  const [selectedDay, setSelectedDay] = useState<number>(9); // Default Thursday May 9

  // Pick Date modal/input state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState('2026-05-09');

  // Confirmation modal for destructive release
  const [confirmReleaseShiftId, setConfirmReleaseShiftId] = useState<string | null>(null);

  // Role filter for trade board
  const [boardRoleFilter, setBoardRoleFilter] = useState<string>('All');

  // AI Compliance Assistant states
  const [aiReviewStatus, setAiReviewStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(true);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string>('');

  // Labor Compliance Checks
  const getComplianceIssues = () => {
    const issues: { type: 'warning' | 'info' | 'success'; message: string; details?: string }[] = [];
    const myShifts = shifts.filter(s => s.isMyShift);
    
    // 1. Weekly Hours / Overtime (FLSA limit 40 hrs)
    const totalHours = myShifts.reduce((acc, s) => acc + s.hours, 0);
    if (totalHours > 40) {
      issues.push({
        type: 'warning',
        message: 'FLSA Overtime Threshold Exceeded',
        details: `Your current schedule is ${totalHours} hours, which incurs ${totalHours - 40} hours of overtime pay (1.5x rate). Check manager authorization.`
      });
    }

    // 2. Consecutive Days limit (5 days)
    const daysScheduled = myShifts.map(s => getShiftDateDayNum(s.date)).sort((a, b) => a - b);
    let consecutiveCount = 0;
    let maxConsecutive = 0;
    for (let day = 6; day <= 12; day++) {
      if (daysScheduled.includes(day)) {
        consecutiveCount++;
        if (consecutiveCount > maxConsecutive) {
          maxConsecutive = consecutiveCount;
        }
      } else {
        consecutiveCount = 0;
      }
    }
    if (maxConsecutive > 5) {
      issues.push({
        type: 'warning',
        message: 'Consecutive Days Limit Warning',
        details: `You are scheduled to work ${maxConsecutive} consecutive days. Local policy recommends maximum 5 consecutive shifts to prevent fatigue.`
      });
    }

    // 3. Short Rest Period ("Clopenings")
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(' ');
      if (parts.length < 2) return 12;
      const [hourStr, minStr] = parts[0].split(':');
      let hour = parseInt(hourStr);
      const min = minStr ? parseInt(minStr) : 0;
      const ampm = parts[1].toUpperCase();
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour + min / 60;
    };

    for (let day = 6; day < 12; day++) {
      const shiftD = myShifts.find(s => getShiftDateDayNum(s.date) === day);
      const shiftNext = myShifts.find(s => getShiftDateDayNum(s.date) === day + 1);
      if (shiftD && shiftNext) {
        const timeRangeD = shiftD.timeRange.split(' - ');
        const timeRangeNext = shiftNext.timeRange.split(' - ');
        if (timeRangeD.length === 2 && timeRangeNext.length === 2) {
          const endHourD = parseTime(timeRangeD[1]);
          const startHourNext = parseTime(timeRangeNext[0]);
          const restHours = (24 - endHourD) + startHourNext;
          if (restHours < 11) {
            issues.push({
              type: 'warning',
              message: `Short Rest Cycle Warning (May ${day} to ${day + 1})`,
              details: `Only ${restHours.toFixed(1)} hours of rest between your shift on May ${day} and May ${day + 1}. Standard rest requirement is 11 hours.`
            });
          }
        }
      }
    }

    // 4. Overlap checks
    const dayCounts: Record<number, number> = {};
    daysScheduled.forEach(d => {
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    const doubleDays = Object.keys(dayCounts).filter(k => dayCounts[Number(k)] > 1);
    if (doubleDays.length > 0) {
      issues.push({
        type: 'warning',
        message: 'Multiple Shifts on Same Day',
        details: `You are scheduled for multiple shifts on May ${doubleDays.join(', ')}. Ensure times do not overlap.`
      });
    }

    if (issues.length === 0) {
      issues.push({
        type: 'success',
        message: 'All Compliance Checks Passed',
        details: 'No overtime, rest violations, or double-shifts detected. Your schedule is fully compliant with bar guidelines.'
      });
    }

    return issues;
  };

  const handleSimulateAiReview = () => {
    setAiReviewStatus('scanning');
    setAiFeedbackMessage('');
    setTimeout(() => {
      setAiReviewStatus('complete');
      const issues = getComplianceIssues();
      const warningCount = issues.filter(i => i.type === 'warning').length;
      if (warningCount > 0) {
        setAiFeedbackMessage(`AI scan completed. Found ${warningCount} policy/compliance warning(s) that might require manager clearance or shift trade.`);
      } else {
        setAiFeedbackMessage("AI scan completed. Perfect compliance! Your schedule aligns beautifully with Wayback's labor constraints.");
      }
      showToast("AI schedule analysis complete!", "success");
    }, 1800);
  };

  // New Shift Swap Post form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState('Server');
  const [newRate, setNewRate] = useState(22);
  const [newDate, setNewDate] = useState('May 14');
  const [newTimeRange, setNewTimeRange] = useState('4:00 PM - 10:00 PM');
  const [newLocation, setNewLocation] = useState('Wayback Bar & Grill');

  // Dynamic week label computed from pickedDate
  const getWeekLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0=Sun,1=Mon,...
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(mon)} — ${fmt(sun)}`;
  };
  const weekLabel = getWeekLabel(pickedDate);

  const daysOfWeek = [
    { num: 6, label: 'MON' },
    { num: 7, label: 'TUE' },
    { num: 8, label: 'WED' },
    { num: 9, label: 'THU', isToday: true },
    { num: 10, label: 'FRI' },
    { num: 11, label: 'SAT' },
    { num: 12, label: 'SUN' },
  ];

  const announcements: Announcement[] = [
    { id: '1', title: 'Staff Summer Grill-off', subtitle: 'This Sunday @ 2PM', type: 'cel', icon: 'celebration' },
    { id: '2', title: 'New training module ready', subtitle: 'Completed status required', type: 'check', icon: 'verified' },
    { id: '3', title: 'Policy updates for June', subtitle: 'Signed copies to Sarah', type: 'update', icon: 'update' }
  ];

  const handlePickShift = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return { ...s, status: 'Confirmed', isMyShift: true };
      }
      return s;
    }));

    setWeeklyHours(prev => prev + shift.hours);
    
    // Add transaction to swap history log
    setSwapHistory(prev => [
      {
        id: Math.random().toString(),
        type: 'Shift Picked Up',
        detail: `${shift.role} on ${shift.date}`,
        meta: `+$${shift.rate * shift.hours} Estimated Earnings`,
        time: 'Just now',
        status: 'completed'
      },
      ...prev
    ]);

    showToast(`Successfully picked up ${shift.role} shift!`, 'success');
  };

  const handleReleaseShift = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return { ...s, status: 'Available', isMyShift: false };
      }
      return s;
    }));

    setWeeklyHours(prev => Math.max(0, prev - shift.hours));

    setSwapHistory(prev => [
      {
        id: Math.random().toString(),
        type: 'Shift Released',
        detail: `${shift.role} on ${shift.date}`,
        meta: `-${shift.hours}h Removed`,
        time: 'Just now',
        status: 'pending'
      },
      ...prev
    ]);

    setConfirmReleaseShiftId(null);
    showToast(`You released your ${shift.role} shift. It is now up for grabs.`, 'warning');
  };

  const handleRequestSwap = (shiftId: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return { ...s, status: 'Swap Requested' };
      }
      return s;
    }));

    showToast(`Swap request published for your ${shifts.find(s => s.id === shiftId)?.role} shift!`, 'info');
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const newShiftItem: Shift = {
      id: Math.random().toString(),
      role: newRole,
      rate: Number(newRate),
      hours: 6,
      date: newDate,
      dateLabel: `Thursday, ${newDate}`,
      timeRange: newTimeRange,
      location: newLocation,
      status: 'Available',
      isMyShift: false
    };

    setShifts(prev => [...prev, newShiftItem]);
    setShowAddModal(false);
    showToast(`Published open opportunity for ${newRole} at $${newRate}/hr!`, 'success');
  };

  // Helper date mapping to day index
  const getShiftDateDayNum = (dateStr: string): number => {
    if (dateStr.includes('6')) return 6;
    if (dateStr.includes('7')) return 7;
    if (dateStr.includes('8')) return 8;
    if (dateStr.includes('9')) return 9;
    if (dateStr.includes('10')) return 10;
    if (dateStr.includes('11')) return 11;
    if (dateStr.includes('12')) return 12;
    return 9; // Fallback THU
  };

  // Scheduled shifts on calendar day filtered
  const calendarShiftsFiltered = shifts.filter(s => getShiftDateDayNum(s.date) === selectedDay);

  return (
    <div className="pb-16">
      {/* Top Header Toggle (Screen Sub Module Selector) */}
      <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/20 mb-lg">
        <button
          onClick={() => setSubTab('schedule')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'schedule'
              ? 'bg-white text-secondary shadow-md'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          My Calendar
        </button>
        <button
          onClick={() => setSubTab('board')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'board'
              ? 'bg-white text-secondary shadow-md'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          Shift Swap Board
        </button>
      </div>

      {/* ==================== SUBTAB: MY SCHEDULE (Screen 2) ==================== */}
      {subTab === 'schedule' && (
        <div className="space-y-lg animate-[slideUp_0.3s_ease] duration-100">
          <div className="flex justify-between items-end mb-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Your Schedule</p>
              <h2 className="text-xl font-bold font-headline-md-mobile text-on-surface">{weekLabel}</h2>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-xl text-xs font-semibold active-scale transition-all flex items-center gap-1.5 focus:ring-2 focus:ring-primary/20"
              >
                <Calendar size={14} />
                Pick Date
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 bg-white border border-outline-variant rounded-xl p-3 shadow-xl z-50 animate-fadeIn">
                  <label className="block text-xs font-bold text-secondary mb-1">Go to date:</label>
                  <input 
                    type="date" 
                    value={pickedDate}
                    onChange={(e) => {
                      setPickedDate(e.target.value);
                      setShowDatePicker(false);
                      const parsed = new Date(e.target.value);
                      showToast(`Navigated to week of ${parsed.toLocaleDateString()}`, 'info');
                    }}
                    className="border border-outline-variant rounded p-1 text-xs" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Scroller Dates of Week */}
          <div className="flex gap-sm overflow-x-auto hide-scrollbar pb-1">
            {daysOfWeek.map((day) => {
              const worksOnThisDay = shifts.some(s => s.isMyShift && getShiftDateDayNum(s.date) === day.num && s.status === 'Confirmed');
              const isSelected = selectedDay === day.num;

              return (
                <button
                  key={day.num}
                  onClick={() => setSelectedDay(day.num)}
                  className={`flex flex-col items-center justify-center min-w-[56px] transition-all rounded-xl cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container h-24 shadow-md -mt-2 border-2 border-primary/20'
                      : 'bg-surface-container-lowest h-20 border border-outline-variant/30 hover:border-primary/40'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'opacity-90' : 'text-on-surface-variant'}`}>{day.label}</span>
                  <span className={`text-lg font-bold mt-1 ${isSelected ? 'text-xl' : 'text-on-surface'}`}>{day.num}</span>
                  {worksOnThisDay && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isSelected ? 'bg-on-primary-container' : 'bg-primary-container'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* AI Labor & Compliance Assistant Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-secondary to-indigo-950 text-white rounded-2xl shadow-xl overflow-hidden p-[1px] border border-white/10 my-md">
            <div className="bg-slate-950/40 p-md flex justify-between items-center cursor-pointer" onClick={() => setIsAiPanelExpanded(!isAiPanelExpanded)}>
              <div className="flex items-center gap-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-wide">AI Labor &amp; Compliance Assistant</h4>
                  <p className="text-[10px] text-white/60">Automated Smart Shift Inspector</p>
                </div>
              </div>
              <button className="text-xs text-white/60 hover:text-white transition-colors bg-white/10 px-2 py-0.5 rounded">
                {isAiPanelExpanded ? 'Hide' : 'Show'}
              </button>
            </div>

            {isAiPanelExpanded && (
              <div className="p-md bg-slate-950/70 space-y-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-sm">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">STATUS</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        aiReviewStatus === 'complete' 
                          ? getComplianceIssues().some(i => i.type === 'warning') ? 'bg-amber-400' : 'bg-emerald-400'
                          : aiReviewStatus === 'scanning' ? 'bg-indigo-400 animate-ping' : 'bg-slate-400'
                      }`} />
                      <span className="text-xs font-semibold">
                        {aiReviewStatus === 'idle' && 'Ready to scan'}
                        {aiReviewStatus === 'scanning' && 'Scanning schedule compliance...'}
                        {aiReviewStatus === 'complete' && (getComplianceIssues().some(i => i.type === 'warning') ? 'Attention Required' : 'Fully Compliant')}
                      </span>
                    </div>
                  </div>
                  {aiReviewStatus !== 'scanning' ? (
                    <button 
                      onClick={handleSimulateAiReview}
                      className="bg-primary hover:bg-primary-container text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Sparkles size={11} />
                      {aiReviewStatus === 'complete' ? 'Re-scan' : 'Scan with AI'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  )}
                </div>

                {/* Scanning animation bar */}
                {aiReviewStatus === 'scanning' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-indigo-400 animate-[progressBar_1.8s_ease-out_infinite] w-[60%]" style={{ animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
                  </div>
                )}

                {aiReviewStatus === 'complete' && (
                  <div className="space-y-sm">
                    {aiFeedbackMessage && (
                      <p className="text-[11px] text-white/95 bg-white/5 border border-white/10 p-sm rounded-lg leading-relaxed">
                        {aiFeedbackMessage}
                      </p>
                    )}

                    <div className="space-y-xs">
                      {getComplianceIssues().map((issue, idx) => (
                        <div 
                          key={idx}
                          className={`p-sm rounded-lg flex items-start gap-sm border ${
                            issue.type === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                          }`}
                        >
                          {issue.type === 'warning' ? (
                            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold leading-none">{issue.message}</p>
                            {issue.details && <p className="text-[10px] opacity-80 leading-relaxed">{issue.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiReviewStatus === 'idle' && (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-xs text-white/60">Scan your active schedule to identify shift overlaps, overtime thresholds, and clopenings.</p>
                    <button 
                      onClick={handleSimulateAiReview}
                      className="mx-auto bg-white/10 text-white hover:bg-white/20 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                    >
                      Inspect Shifts Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule Shifts Card List */}
          <section className="space-y-md">
            {calendarShiftsFiltered.length > 0 ? (
              calendarShiftsFiltered.map((shift) => {
                const borderClass = shift.isMyShift 
                  ? shift.status === 'Swap Requested' ? 'status-bar-orange border-l-4' : 'status-bar-emerald border-l-4'
                  : 'status-bar-blue border-l-4 border-dashed';

                return (
                  <div key={shift.id} className="relative pl-xs">
                    <div className={`bg-surface-container-lowest rounded-xl p-md border border-outline-variant/15 shadow-sm hover:shadow-md transition-all ${borderClass}`}>
                      
                      {/* Card Content Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-xs font-semibold ${shift.isMyShift ? 'text-primary' : 'text-secondary'}`}>
                            {shift.dateLabel}
                          </p>
                          <h3 className="text-md font-bold text-on-surface mt-1">{shift.role}</h3>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                            <MapPin size={13} className="text-outline shrink-0" />
                            {shift.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-md font-bold text-on-surface">{shift.timeRange.split(' - ')[0]}</p>
                          <p className="text-xs text-on-surface-variant">to {shift.timeRange.split(' - ')[1]}</p>
                        </div>
                      </div>

                      {/* Interactive Button row inside item card */}
                      <div className="flex flex-wrap gap-sm justify-between items-center mt-4 pt-sm border-t border-dotted border-outline-variant/40">
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            shift.isMyShift 
                              ? shift.status === 'Swap Requested' 
                                ? 'bg-tertiary-container/10 text-tertiary' 
                                : 'bg-emerald-50 text-primary'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {shift.status === 'Swap Requested' ? 'Swap Requested' : shift.isMyShift ? 'My Shift' : 'Open Opportunity'}
                          </span>
                          {!shift.isMyShift && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary">
                              ~${shift.rate * shift.hours} est.
                            </span>
                          )}
                        </div>

                        {shift.isMyShift ? (
                          <div className="flex gap-2">
                            {shift.status !== 'Swap Requested' && (
                              <button 
                                onClick={() => handleRequestSwap(shift.id)}
                                className="text-xs text-tertiary border border-tertiary/20 hover:bg-tertiary/5 px-2.5 py-1 rounded"
                              >
                                Request Trade
                              </button>
                            )}
                            <button 
                              onClick={() => setConfirmReleaseShiftId(shift.id)}
                              className="text-xs text-error border border-error/20 hover:bg-error/5 px-2.5 py-1 rounded"
                            >
                              Release
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handlePickShift(shift.id)}
                            className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-primary-container"
                          >
                            Claim Shift
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              // Empty Day condition (off-duty)
              <div className="bg-surface-container-low rounded-xl p-lg flex flex-col items-center justify-center text-center opacity-85">
                <Moon size={32} className="text-outline/60 mb-2 animate-bounce-slow" />
                <h3 className="text-md font-bold text-secondary">Congratulations! No Shifts Scheduled</h3>
                <p className="text-xs text-on-surface-variant mt-1 px-md">Take a rest, recharge your batteries, or pick up a shift below.</p>
              </div>
            )}
          </section>

          {/* Announcements section (Bento layout) from Schedule view */}
          <section className="mt-6">
            <h4 className="text-md font-bold text-on-surface mb-sm">Team Announcements</h4>
            <div className="grid grid-cols-2 gap-sm">
              
              {/* Asymmetrical large banner */}
              <div className="col-span-2 bg-secondary-container text-on-secondary-container p-md rounded-2xl flex flex-col justify-between min-h-[140px] shadow-sm relative overflow-hidden">
                <Sparkles size={32} className="text-secondary opacity-15 absolute right-4 top-4" />
                <span className="bg-white/20 inline-block text-[10px] w-fit font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Up</span>
                <div>
                  <h5 className="text-lg font-bold leading-tight">Staff Summer Grill-off</h5>
                  <p className="text-xs opacity-80 mt-1">This Sunday @ 2PM. Families welcome!</p>
                </div>
              </div>

              {/* Smaller quick indicator blocks */}
              <div className="bg-surface-container-low p-md rounded-2xl flex flex-col justify-center items-center text-center border border-outline-variant/10 aspect-square">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Star size={18} />
                </div>
                <p className="text-xs font-bold text-secondary">New training module ready</p>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Compliant required</span>
              </div>

              <div className="bg-surface-container-low p-md rounded-2xl flex flex-col justify-center items-center text-center border border-outline-variant/10 aspect-square">
                <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary mb-2">
                  <Coffee size={18} />
                </div>
                <p className="text-xs font-bold text-secondary">Policy updates for June</p>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Signed copies to Sarah</span>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* ==================== SUBTAB: TRADE BOARD (Screen 4) ==================== */}
      {subTab === 'board' && (
        <div className="space-y-lg animate-[slideUp_0.3s_ease]">
          
          {/* Sub Header for Board sections */}
          <div className="flex border-b border-outline-variant/40">
            {['available', 'my', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setBoardTab(tab as any)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                  boardTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-secondary'
                }`}
              >
                {tab === 'available' ? 'Available Shifts' : tab === 'my' ? 'My Shifts' : 'Swap History'}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: AVAILABLE BOARD SHIFTS */}
          {boardTab === 'available' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-sm text-sm font-bold text-secondary">Open Opportunities</h3>
                <span className="bg-primary-container text-on-primary-container text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                  {shifts.filter(s => s.status === 'Available').length} Opportunities
                </span>
              </div>

              {/* Role filter chips */}
              {(() => {
                const availRoles = ['All', ...Array.from(new Set(shifts.filter(s => s.status === 'Available').map(s => s.role)))];
                return availRoles.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {availRoles.map(role => (
                      <button
                        key={role}
                        onClick={() => setBoardRoleFilter(role)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                          boardRoleFilter === role
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {shifts.filter(s => s.status === 'Available' && (boardRoleFilter === 'All' || s.role === boardRoleFilter)).map(shift => (
                <div key={shift.id} className="relative bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden hover:border-primary/50 transition-all">
                  <div className="accent-bar bg-tertiary-container"></div>
                  <div className="p-md pl-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">OPEN OPPORTUNITY</p>
                        <h3 className="text-md font-bold text-secondary mt-1">{shift.role} • {shift.location}</h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-2">
                          <Clock size={13} />
                          {shift.dateLabel} • {shift.timeRange}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">${shift.rate}/hr</p>
                        <p className="text-[9px] text-on-surface-variant uppercase">~${shift.rate * shift.hours} est.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handlePickShift(shift.id)}
                      className="w-full bg-primary text-on-primary font-bold text-xs h-10 rounded-lg flex items-center justify-center gap-2 mt-4 hover:brightness-[1.05] active:scale-[0.98] transition-all"
                    >
                      <Plus size={14} />
                      Pick Up Shift
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CONTENT: MY SHIFTS IN TRADE */}
          {boardTab === 'my' && (
            <div className="space-y-md">
              <h3 className="font-headline-sm text-sm font-bold text-secondary">Your Upcoming Schedule</h3>

              {shifts.filter(s => s.isMyShift).map(shift => (
                <div key={shift.id} className="relative bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
                  <div className={`accent-bar ${shift.status === 'Swap Requested' ? 'bg-tertiary-container' : 'bg-primary-container'}`}></div>
                  <div className="p-md pl-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${shift.status === 'Swap Requested' ? 'text-tertiary' : 'text-primary'}`}>
                          {shift.status === 'Swap Requested' ? 'SWAP OFFER PENDING' : 'CONFIRMED SCHEDULED'}
                        </p>
                        <h3 className="text-md font-bold text-secondary mt-1">{shift.role} • Bar</h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-2">
                          <Calendar size={13} />
                          {shift.dateLabel} • {shift.timeRange}
                        </p>
                      </div>
                      <div className="text-right text-xs shrink-0 font-bold text-on-surface-variant">
                        {shift.hours} Hours
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-sm mt-4">
                      {shift.status !== 'Swap Requested' ? (
                        <button 
                          onClick={() => handleRequestSwap(shift.id)}
                          className="bg-secondary-container text-on-secondary-container text-xs font-bold h-10 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors active:scale-95"
                        >
                          <RefreshCw size={14} />
                          Request Swap
                        </button>
                      ) : (
                        <div className="bg-orange-50 text-tertiary text-xs font-bold rounded-lg border border-orange-150 h-10 flex items-center justify-center gap-1.5">
                          <Clock size={13} /> Swap Published
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setConfirmReleaseShiftId(shift.id)}
                        className="border border-tertiary-container text-tertiary text-xs font-bold h-10 rounded-lg flex items-center justify-center gap-1.5 hover:bg-tertiary-fixed-dim/10 transition-colors active:scale-95"
                      >
                        <X size={14} />
                        Release Shift
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Attendance warning banner */}
              <div className="bg-tertiary-container/10 border border-tertiary-container/15 rounded-xl p-md flex gap-md items-start mt-4">
                <AlertCircle size={20} className="text-tertiary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-on-tertiary-container leading-none text-sm">Can&apos;t make your shift?</p>
                  <p className="text-xs text-on-tertiary-container leading-relaxed opacity-85">
                    Release it at least 24 hours in advance to allow coworkers to pick it up and avoid standard attendance policy points.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SWAP RECENT COMPLETED LOGS */}
          {boardTab === 'history' && (
            <div className="space-y-md">
              <h3 className="font-headline-sm text-sm font-bold text-secondary">Recent Swaps &amp; Release History</h3>
              <div className="bg-surface-container-lowest rounded-xl divide-y divide-outline-variant overflow-hidden shadow-sm border border-outline-variant/15">
                {swapHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-md flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {item.status === 'completed' ? <Check size={18} /> : <History size={18} className="text-on-surface-variant" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary">{item.type}</p>
                        <p className="text-[11px] text-on-surface-variant font-medium">{item.detail} • {item.time}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Floating Action Button: Screen 4 Swap Post triggering Modal */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-container-margin w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95 duration-100 hover:scale-105"
        title="Post Shift or Request Trade"
      >
        <Plus size={28} />
      </button>

      {/* Offer creation modal popup */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[384px] overflow-hidden animate-[slideUp_0.2s_ease-out]">
            <div className="bg-primary p-md text-white flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wide">Publish Swap Opportunity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOffer} className="p-md space-y-md">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Role / Position</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg p-2 text-xs bg-white focus:outline-primary"
                >
                  <option value="Server">Server</option>
                  <option value="Host">Host</option>
                  <option value="Bartender">Bartender</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Hourly Pay ($)</label>
                  <input 
                    type="number" 
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full border border-outline-variant rounded-lg p-2 text-xs focus:outline-primary" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Date</label>
                  <input 
                    type="text" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. May 14"
                    className="w-full border border-outline-variant rounded-lg p-2 text-xs focus:outline-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Time Frame</label>
                <input 
                  type="text" 
                  value={newTimeRange}
                  onChange={(e) => setNewTimeRange(e.target.value)}
                  placeholder="e.g. 11:00 AM - 5:00 PM"
                  className="w-full border border-outline-variant rounded-lg p-2 text-xs focus:outline-primary" 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary-container text-on-primary-container font-semibold py-2.5 rounded-lg text-xs hover:brightness-105 active:scale-[0.98] transition-all"
              >
                Publish Availability Swap
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====== Release Shift Confirmation Modal ====== */}
      {confirmReleaseShiftId && (() => {
        const shiftToRelease = shifts.find(s => s.id === confirmReleaseShiftId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[384px] overflow-hidden animate-[slideUp_0.2s_ease-out]">
              <div className="bg-error/10 p-md text-center border-b border-error/15">
                <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={24} className="text-error" />
                </div>
                <h3 className="font-bold text-secondary text-md">Release This Shift?</h3>
              </div>
              <div className="p-lg space-y-md text-center">
                {shiftToRelease && (
                  <div className="bg-surface-container-low rounded-xl p-sm text-xs text-on-surface-variant">
                    <p className="font-bold text-secondary">{shiftToRelease.role}</p>
                    <p>{shiftToRelease.dateLabel} • {shiftToRelease.timeRange}</p>
                    <p className="mt-1 text-error font-semibold">-{shiftToRelease.hours} hrs from your schedule</p>
                  </div>
                )}
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  This will make your shift available to other team members. This action cannot be undone from this screen.
                </p>
                <div className="grid grid-cols-2 gap-sm">
                  <button
                    onClick={() => setConfirmReleaseShiftId(null)}
                    className="h-11 border border-outline-variant rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container transition-colors active:scale-95"
                  >
                    Keep Shift
                  </button>
                  <button
                    onClick={() => handleReleaseShift(confirmReleaseShiftId)}
                    className="h-11 bg-error text-white rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 transition-all"
                  >
                    Yes, Release
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
export type { ScheduleViewProps };

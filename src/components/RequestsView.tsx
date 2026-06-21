import React, { useState } from 'react';
import { FileText, Umbrella, Calendar, HeartPulse, Send, AlertCircle, Trash2 } from 'lucide-react';

interface VacationObj {
  id: string;
  type: string;
  reason: string;
  start: string;
  end: string;
  status: 'Approved' | 'Pending' | 'Denied';
  submittedAt: string;
}

interface RequestsViewProps {
  vacations: VacationObj[];
  setVacations: React.Dispatch<React.SetStateAction<VacationObj[]>>;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export default function RequestsView({
  vacations,
  setVacations,
  showToast
}: RequestsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('Vacation');
  const [start, setStart] = useState('2026-06-20');
  const [end, setEnd] = useState('2026-06-25');
  const [reason, setReason] = useState('');

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      showToast("Please provide a brief reason or notes for your request.", "warning");
      return;
    }

    // Format dates nicely, e.g. June 20 — June 25
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
    };

    const newReq: VacationObj = {
      id: Math.random().toString(),
      type: type,
      reason: reason,
      start: formatDate(start),
      end: formatDate(end),
      status: 'Pending',
      submittedAt: 'Just now'
    };

    setVacations(prev => [newReq, ...prev]);
    setShowForm(false);
    setReason('');
    showToast(`Leave request for ${newReq.type} submitted successfully!`, 'success');
  };

  const handleCancelRequest = (id: string, name: string) => {
    setVacations(prev => prev.filter(v => v.id !== id));
    showToast(`Cancelled leave request for ${name}`, 'info');
  };

  return (
    <div className="space-y-lg animate-[slideUp_0.3s_ease] pb-16">
      
      {/* Page Title Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-lg font-bold text-secondary">Time-Off Requests</h2>
          <p className="text-xs text-on-surface-variant">Submit and review vacation or sick leave</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-primary-container transition-colors active:scale-95"
          >
            New Request
          </button>
        )}
      </div>

      {showForm ? (
        
        // leave REQUEST FORM
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-md border border-outline-variant/10 animate-[slideUp_0.2s_ease-out]">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold text-sm uppercase text-secondary">Submit Leave Request</h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-xs text-on-surface-variant hover:underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-md text-xs">
            
            {/* leave Type select */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Leave Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#f7f9fb] border border-outline-variant rounded-lg p-2.5 text-xs text-secondary outline-none focus:bg-white focus:border-primary"
              >
                <option value="Vacation">Vacation Time-Off</option>
                <option value="Personal Leave">Personal Day Leave</option>
                <option value="Medical/Sick">Urgent Medical / Sick Day</option>
              </select>
            </div>

            {/* Dates row inputs */}
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Start Date</label>
                <input 
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-[#f7f9fb] border border-outline-variant rounded-lg p-2.5 outline-none focus:bg-white focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">End Date</label>
                <input 
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-[#f7f9fb] border border-outline-variant rounded-lg p-2.5 outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </div>

            {/* Reason Text */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Notes / Reason for Leave</label>
              <textarea 
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write a short explanation to Sarah..."
                className="w-full bg-[#f7f9fb] border border-outline-variant rounded-lg p-2.5 outline-none focus:bg-white focus:border-primary resize-none text-secondary"
              />
            </div>

            {/* Safety policy tip */}
            <div className="bg-amber-50 rounded-lg p-3 text-amber-800 flex gap-xs items-start border border-amber-200/40">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Vacation and Personal leave requests require manual approval from Manager Sarah. Sick leave is logged automatically but must still align with attendance logs.
              </p>
            </div>

            {/* Actions button */}
            <button
              type="submit"
              className="w-full h-11 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all outline-none"
            >
              Submit Request
              <Send size={13} />
            </button>

          </form>
        </div>
      ) : (
        
        // LIST OF SUBMITTED VACATIONS
        <div className="space-y-sm">
          {vacations.length > 0 ? (
            vacations.map((vac) => {
              const statusColors = {
                Approved: 'bg-emerald-50 text-primary border border-emerald-100',
                Pending: 'bg-amber-50 text-amber-700 border border-amber-100',
                Denied: 'bg-red-50 text-error border border-red-100'
              };

              const Icon = vac.type === 'Medical/Sick' ? HeartPulse : Umbrella;

              return (
                <div 
                  key={vac.id}
                  className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/10 flex justify-between items-center gap-md hover:border-primary/20 transition-all"
                >
                  <div className="flex gap-md items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon size={20} className="stroke-[2.5px]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary leading-none">{vac.type}</p>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">{vac.start} – {vac.end}</p>
                      <p className="text-[10px] text-on-surface-variant/75 mt-1 truncate max-w-[180px] font-medium italic">&ldquo;{vac.reason}&rdquo;</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-sm">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[vac.status]}`}>
                      {vac.status}
                    </span>
                    {vac.status === 'Pending' && (
                      <button 
                        onClick={() => handleCancelRequest(vac.id, vac.type)}
                        className="text-[10px] text-error hover:underline flex items-center gap-0.5 font-bold"
                        title="Cancel Pending Request"
                      >
                        <Trash2 size={11} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-surface-container-low p-8 rounded-xl text-center text-xs text-on-surface-variant border-2 border-dashed border-outline-variant/50">
              <FileText size={28} className="mx-auto text-on-surface-variant/30 mb-2 animate-pulse" />
              <p className="font-semibold text-secondary">No leave requests logged</p>
              <p className="text-[10px] text-on-surface-variant mt-1">Tap &ldquo;New Request&rdquo; to submit time-off</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
export type { VacationObj };

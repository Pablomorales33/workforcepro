import React, { useState } from 'react';
import { 
  Send, Lock, Award, Frown, Meh, Smile, Laugh, CheckCircle, 
  MapPin, Users, HelpCircle, ShieldCheck, DollarSign
} from 'lucide-react';
import { SurveyResponse } from '../types';

interface ProfileViewProps {
  survey: SurveyResponse;
  setSurvey: React.Dispatch<React.SetStateAction<SurveyResponse>>;
  weeklyHours: number;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  surveyHistory: SurveyResponse[];
  setSurveyHistory: React.Dispatch<React.SetStateAction<SurveyResponse[]>>;
  subscriptionStatus: 'free' | 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  onNavigate: (tab: string) => void;
  isDbConnected?: boolean;
  onLogout?: () => void;
}

export default function ProfileView({
  survey,
  setSurvey,
  weeklyHours,
  showToast,
  surveyHistory,
  setSurveyHistory,
  subscriptionStatus,
  billingCycle,
  onNavigate,
  isDbConnected = false,
  onLogout
}: ProfileViewProps) {
  // Current active rating selection
  const [activeRating, setActiveRating] = useState<number | null>(survey.rating);
  const [commentText, setCommentText] = useState(survey.challenges);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(survey.factors);
  const [isDone, setIsDone] = useState(!!survey.submittedAt);

  const emojiButtons = [
    { rating: 1, label: 'Awful', icon: Frown, colorOnSelect: '#ba1a1a' },
    { rating: 2, label: 'Bad', icon: Meh, colorOnSelect: '#9b4500' },
    { rating: 3, label: 'Okay', icon: Meh, colorOnSelect: '#545f73' },
    { rating: 4, label: 'Good', icon: Smile, colorOnSelect: '#00a86b' },
    { rating: 5, label: 'Great', icon: Laugh, colorOnSelect: '#006d43' },
  ];

  const commonFactors = ['Kitchen Delay', 'Busy Rush', 'Good Teamwork', 'Staff Shortage'];

  const handleRatingSelect = (rateNum: number) => {
    setActiveRating(rateNum);
  };

  const handleFactorToggle = (factor: string) => {
    setSelectedFactors(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor) 
        : [...prev, factor]
    );
  };

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRating) {
      showToast("Please tap a rating emoji before submitting!", "warning");
      return;
    }

    const nowStr = new Date().toLocaleString();
    const subObj: SurveyResponse = {
      rating: activeRating,
      challenges: commentText,
      factors: selectedFactors,
      submittedAt: nowStr
    };

    setSurvey(subObj);
    setSurveyHistory(prev => [subObj, ...prev]);
    setIsDone(true);
    showToast("Feedback submitted anonymously. Thank you!", "success");
  };

  const handleResetSurvey = () => {
    // Reset inputs
    setActiveRating(null);
    setCommentText('');
    setSelectedFactors([]);
    setIsDone(false);
    setSurvey({ rating: 0, challenges: '', factors: [], submittedAt: null });
  };

  // Stats averages calculation
  const averageSatisfaction = surveyHistory.length > 0 
    ? (surveyHistory.reduce((acc, curr) => acc + curr.rating, 0) / surveyHistory.length).toFixed(1)
    : '5.0';

  return (
    <div className="pb-16 max-w-[512px] mx-auto scroll-smooth animate-[slideUp_0.3s_ease]">
      
      {/* Background Decor (Visual influence) */}
      <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden -z-10">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-container rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-secondary-container rounded-full blur-3xl" />
      </div>

      {/* Profile Bio details */}
      <div className="bg-surface-container-lowest rounded-xl p-md mb-md shadow-sm border border-outline-variant/10 flex items-center gap-sm">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
          <img 
            alt="Employee Avatar" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1pdgsUgDQhMYjJrzll_Hluh_RltuhYNzkbFQ-a2OeVdq1xqT8EH_cICJJ9pKNFEmiHGLdyagN_NllbDRBi7tiY1pcDUj7FKAXVL-h_6mmA_c7McSMlL8hrK2MPpPtNjuyrc8as5tdyyTD5s1Ny8G_wL_7uiIDcgUWedFg00kkd_Es3jdLji89wIQAimO806Yhe9djbS0MZFuwiU_05QSAEyCtmgi41YbVpnRuasjwQ9vzBzlSWa20S_n28Ts-VDvN32GFjqY9dH-5"
          />
        </div>
        <div>
          <h3 className="text-md font-bold text-secondary">Alex Cooper</h3>
          <p className="text-xs text-on-surface-variant">Server / Bartender • Wayback Bar & Grill</p>
          <div className="flex gap-4 mt-1.5 text-xs">
            <span className="flex items-center gap-0.5 font-bold text-primary">
              <Award size={13} /> Lvl 3 Expert
            </span>
            <span className="flex items-center gap-0.5 text-on-surface-variant font-semibold">
              <DollarSign size={13} /> $22/hr Base
            </span>
          </div>
        </div>
      </div>

      {/* Database Connection Status Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-sm mb-md shadow-xs border border-outline-variant/10 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          Database status: <strong className="text-secondary">{isDbConnected ? 'Live Cloud (Firebase)' : 'Offline Simulation (Local)'}</strong>
        </span>
        {!isDbConnected && (
          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Demo Mode</span>
        )}
      </div>

      {/* SaaS Subscription Status & Action Card */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-md mb-md shadow-sm border border-primary/10 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">SaaS Subscription Status</span>
          <p className="text-sm font-bold text-secondary mt-0.5">
            {subscriptionStatus === 'free' 
              ? 'Free Trial Account' 
              : `${subscriptionStatus.toUpperCase()} Subscription`}
            {subscriptionStatus !== 'free' && (
              <span className="text-[10px] text-on-surface-variant font-medium ml-1">
                ({billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => onNavigate('pricing')}
          className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all duration-150 active:scale-95 flex items-center gap-xs cursor-pointer shadow-sm"
        >
          {subscriptionStatus === 'free' ? 'Upgrade Plan' : 'Manage Billing'}
        </button>
      </div>

      {/* Tab Panel Row: Shift rating or metrics */}
      {!isDone ? (
        <div className="space-y-lg">
          {/* Shift Context Card */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-sm border-l-4 border-primary border border-outline-variant/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-base">
              <div>
                <h2 className="text-md font-bold text-on-surface">Last Shift Summary</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Thursday, June 20 • 4:00 PM - 10:30 PM</p>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">Server</span>
            </div>
            
            <div className="mt-4 flex gap-md text-xs text-on-surface-variant font-medium">
              <div className="flex items-center gap-1">
                <MapPin size={13} />
                <span>Main Dining Hall</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={13} />
                <span>Team B (6 people)</span>
              </div>
            </div>
          </div>

          {/* Survey Input Body */}
          <section className="bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/10 overflow-hidden">
            <form onSubmit={handleSubmitSurvey} className="p-lg">
              
              <div className="text-center mb-lg">
                <h1 className="text-lg font-bold text-on-surface mb-1">How was your shift?</h1>
                <p className="text-xs text-on-surface-variant max-w-[320px] mx-auto">
                  Your feedback helps us create a better workplace environment for everyone.
                </p>
              </div>

              {/* Rating Emoticons Scale */}
              <div className="flex justify-between items-center gap-1 mb-xl px-2">
                {emojiButtons.map((btn) => {
                  const Icon = btn.icon;
                  const isSelected = activeRating === btn.rating;
                  // Selected visual custom colors
                  const iconStyle = isSelected ? { color: btn.colorOnSelect } : {};

                  return (
                    <button
                      key={btn.rating}
                      type="button"
                      onClick={() => handleRatingSelect(btn.rating)}
                      className="flex flex-col items-center gap-1 cursor-pointer select-none transition-transform hover:scale-110 active:scale-90 shrink-0"
                    >
                      <Icon 
                        size={32}
                        className={`transition-colors text-on-surface-variant/70 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`}
                        style={iconStyle}
                      />
                      <span className={`text-[11px] font-semibold transition-colors mt-0.5 ${isSelected ? 'text-secondary font-bold' : 'text-on-surface-variant/70'}`}>
                        {btn.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Textarea comments block */}
              <div className="mb-lg">
                <label className="block text-xs font-bold text-on-surface-variant/90 mb-1.5 ml-1" htmlFor="challenges">What challenges did you face?</label>
                <textarea 
                  id="challenges"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="e.g. Understaffed during peak hours, equipment issues..."
                  className="w-full bg-surface-container-low border border-outline-variant/45 rounded-lg p-3 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none placeholder:text-on-surface-variant/40 text-on-surface focus:bg-white"
                />
              </div>

              {/* Common factor chips */}
              <div className="mb-xl">
                <span className="block text-xs font-bold text-on-surface-variant/90 mb-2 ml-1">Common factors today:</span>
                <div className="flex flex-wrap gap-xs">
                  {commonFactors.map((factor) => {
                    const isSelected = selectedFactors.includes(factor);
                    return (
                      <button
                        key={factor}
                        type="button"
                        onClick={() => handleFactorToggle(factor)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-secondary-container/50 border-primary text-secondary'
                            : 'border-outline-variant text-on-surface-variant hover:bg-slate-50'
                        }`}
                      >
                        {factor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Survey Submit button */}
              <button 
                type="submit"
                className="w-full h-11 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-95 transition-all text-xs"
              >
                Submit Feedback
                <Send size={14} />
              </button>
            </form>

            {/* Bottom lock disclaimer */}
            <div className="bg-surface-container-low p-3 border-t border-outline-variant/20 flex justify-center items-center gap-1">
              <Lock size={12} className="text-on-surface-variant" />
              <p className="text-[10px] text-on-surface-variant text-center">
                Your feedback is anonymous to your shift manager.
              </p>
            </div>
          </section>
        </div>
      ) : (
        // Completed survey thanks banner
        <div className="space-y-lg animate-fadeIn duration-200">
          <div className="bg-surface-container-lowest rounded-xl p-6 text-center border border-outline-variant/10 shadow-sm flex flex-col items-center">
            <CheckCircle size={44} className="text-primary mb-3" />
            <h2 className="text-lg font-bold text-secondary">Feedback Submitted Successfully!</h2>
            <p className="text-xs text-on-surface-variant mt-2 max-w-[320px] leading-relaxed">
              Thanks, Alex! Your response has been securely filed inside the anonymous satisfaction dashboard. 
              Your feedback is pooled with other staff responses to improve shift workloads.
            </p>
            <button 
              onClick={handleResetSurvey}
              className="mt-4 text-xs font-semibold text-primary hover:underline"
            >
              Rate Another Shift
            </button>
          </div>

          {/* Historical Surveys reports list */}
          <section className="space-y-sm">
            <h4 className="text-sm font-bold text-secondary flex justify-between">
              <span>Feedback Dashboard Metrics</span>
              <span className="text-[11px] text-primary">Avg: {averageSatisfaction}/5.0</span>
            </h4>
            
            {surveyHistory.length > 0 ? (
              <div className="space-y-sm">
                {surveyHistory.map((hist, idx) => (
                  <div key={idx} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/15 text-xs space-y-2">
                    <div className="flex justify-between items-center bg-surface-container-low p-2 rounded">
                      <span className="font-semibold text-secondary">Feedback Submitted</span>
                      <span className="text-[10px] text-on-surface-variant">{hist.submittedAt}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Rating: <strong className="text-primary">{hist.rating}/5</strong></span>
                      <span className="text-on-surface-variant">Factors: {hist.factors.join(', ') || 'None selected'}</span>
                    </div>
                    {hist.challenges && (
                      <p className="text-on-surface-variant leading-relaxed text-[11px] italic bg-slate-50 p-2 rounded">
                        &ldquo;{hist.challenges}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low p-4 rounded-xl text-center text-xs text-on-surface-variant">
                No past feedback records logged.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tactile atmospheric vector illustration placeholder */}
      <div className="mt-lg flex justify-center opacity-80 shrink-0">
        <img 
          alt="Workplace Setting illustration" 
          className="w-44 h-44 rounded-full object-cover shadow-md border-4 border-white"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrum3X1-Rs-xZufnZPvKeI_AW7OpbqB24Xr1G2eg7UG312r6Y7wTMT0ZvgEo-bED6XJWCCvRlQU9W-hFcgGxQhRulB7NmFCyC8NPTiI8tSkN1D7cqf39A4cC56nQZ7zTeh5XpTxGVhRduoSiZIAOYZfOsu5_IuSv9sHtEQ8E9amywojrNgmKSb4uArZWQJYT_YxfmgZNfJAEg2dwxA2mOMxpB4c98kiIhfhWySvxNF3jwpKRaf_JNbN8ArxlS2eVV_JpFqZOzf2Ny0"
        />
      </div>

      {/* SaaS Landing Page exit button */}
      <div className="mt-md flex justify-center">
        <button
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              onNavigate('landing');
            }
          }}
          className="text-xs font-bold text-on-surface-variant/65 hover:text-primary transition-all px-4 py-2 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-white active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
        >
          Sign Out &amp; Return to Landing Site
        </button>
      </div>

    </div>
  );
}
export type { ProfileViewProps };

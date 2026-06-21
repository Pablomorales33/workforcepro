import React, { useState } from 'react';
import { 
  Calendar, Clock, ShieldCheck, Zap, Sparkles, MessageSquare, 
  TrendingUp, Award, Play, ChevronRight, Mail, Users, ArrowRight,
  Search, Globe, Star, CheckCircle, Smartphone
} from 'lucide-react';
import PricingView from './PricingView';

interface LandingViewProps {
  onLaunchApp: () => void;
  onNavigateToPricing: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  subscription: {
    status: 'free' | 'starter' | 'pro' | 'enterprise';
    billingCycle: 'monthly' | 'annual';
    simulated: boolean;
    sessionId?: string;
  };
}

function InteractiveFeaturePreview({ activeTab }: { activeTab: 'schedule' | 'ai' | 'clock' | 'morale' }) {
  if (activeTab === 'schedule') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-full h-[280px] flex flex-col justify-between text-xs text-gray-700">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-extrabold text-[#002171] uppercase tracking-wider text-[11px]">Shift Scheduler - Friday</h5>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Budget: $1,200/day</span>
          </div>
          <div className="space-y-2">
            {/* Employee 1 */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Alex Rivera (Chef)</span>
              <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px]">08:00 AM - 04:00 PM</span>
            </div>
            {/* Employee 2 */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Sarah Connor (Server)</span>
              <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px]">11:00 AM - 07:00 PM</span>
            </div>
            {/* Employee 3 */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">John Doe (Host)</span>
              <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px]">04:00 PM - 11:00 PM</span>
            </div>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between items-center text-[10px] text-gray-500">
          <span>Total Hours: 23 hrs</span>
          <span className="text-[#002171] font-bold">Labor Cost: 11.8% of Sales</span>
        </div>
      </div>
    );
  }

  if (activeTab === 'ai') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-full h-[280px] flex flex-col justify-between text-xs text-gray-700">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-extrabold text-[#002171] uppercase tracking-wider text-[11px]">Gemini AI Assistant</h5>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Auto-Audit</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-3">
            <p className="font-semibold text-purple-950 text-[11px] mb-1">Swap Request Detected:</p>
            <p className="text-[11px] text-purple-900 leading-snug">
              <strong>Alex R.</strong> wants to swap <strong>Friday Evening</strong> with <strong>Sarah C.</strong>
            </p>
          </div>
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
              <span className="text-emerald-500">✓</span> No overtime threshold breached (Alex: 32h, Sarah: 28h)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
              <span className="text-emerald-500">✓</span> Qualifications match (Both certified food handlers)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
              <span className="text-emerald-500">✓</span> 11-hour rest period compliance verified
            </div>
          </div>
        </div>
        <button className="w-full bg-[#002b6b] hover:bg-[#002171] text-white font-bold py-2 rounded-lg text-center transition-colors text-[10px] cursor-pointer">
          Approve AI Suggested Swap
        </button>
      </div>
    );
  }

  if (activeTab === 'clock') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-full h-[280px] flex flex-col justify-between text-xs text-gray-700">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-extrabold text-[#002171] uppercase tracking-wider text-[11px]">GPS Clock-In Verification</h5>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">On-Site</span>
          </div>
          <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-[#002171] text-white flex items-center justify-center font-bold text-sm shrink-0">
              AR
            </div>
            <div>
              <p className="font-bold text-[11px] text-gray-900">Alex Rivera</p>
              <p className="text-[10px] text-gray-500">Scheduled: 08:00 AM (Chef)</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center gap-2 text-[10px] text-emerald-800 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
            <span>GPS Match: Within 15 meters of restaurant venue</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-center text-[10px] cursor-pointer">
            Clock In (08:01 AM)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-full h-[280px] flex flex-col justify-between text-xs text-gray-700">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h5 className="font-extrabold text-[#002171] uppercase tracking-wider text-[11px]">Anonymous Shift Feedback</h5>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Live Analytics</span>
        </div>
        <p className="text-[10px] text-gray-500 mb-3 text-center">How was your shift today?</p>
        <div className="flex justify-around items-center mb-4">
          <button className="text-2xl hover:scale-125 transition-transform duration-100 cursor-pointer">😠</button>
          <button className="text-2xl hover:scale-125 transition-transform duration-100 cursor-pointer">😐</button>
          <button className="text-3xl hover:scale-125 transition-transform duration-100 cursor-pointer filter drop-shadow">😊</button>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2.5 py-1 rounded-full">Great Teamwork</span>
          <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2.5 py-1 rounded-full">Understaffed</span>
          <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2.5 py-1 rounded-full">Busy & Fun</span>
        </div>
      </div>
      <div className="border-t pt-2 text-center">
        <span className="text-[10px] font-bold text-gray-900">Weekly Morale Score: 4.6 / 5.0</span>
      </div>
    </div>
  );
}

export default function LandingView({ onLaunchApp, onNavigateToPricing, showToast, subscription }: LandingViewProps) {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'schedule' | 'ai' | 'clock' | 'morale'>('schedule');
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    restaurant: '',
    size: '1-15',
    message: ''
  });
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email || !demoForm.restaurant) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }
    setDemoSubmitted(true);
    showToast('Demo request submitted! Our scheduling expert will contact you.', 'success');
  };

  const featureShowcases = {
    schedule: {
      title: 'Visual Shift Scheduling & Budgeting',
      desc: 'Build, optimize, and publish employee schedules in minutes. Control overtime, monitor weekly hours, and match staffing levels exactly with expected guest traffic to minimize labor waste.',
      metrics: 'Save 6 hours per week in manager scheduling overhead.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrum3X1-Rs-xZufnZPvKeI_AW7OpbqB24Xr1G2eg7UG312r6Y7wTMT0ZvgEo-bED6XJWCCvRlQU9W-hFcgGxQhRulB7NmFCyC8NPTiI8tSkN1D7cqf39A4cC56nQZ7zTeh5XpTxGVhRduoSiZIAOYZfOsu5_IuSv9sHtEQ8E9amywojrNgmKSb4uArZWQJYT_YxfmgZNfJAEg2dwxA2mOMxpB4c98kiIhfhWySvxNF3jwpKRaf_JNbN8ArxlS2eVV_JpFqZOzf2Ny0',
      icon: Calendar
    },
    ai: {
      title: 'Gemini AI Shift Swaps & Compliance',
      desc: 'Let our integrated AI handle shift coverage suggestions. When an employee requests a swap, Gemini automatically checks qualifications, verifies compliance rules, and suggests the best candidates to fill the gap.',
      metrics: 'Reduce empty shift holes by 84% through automated matching.',
      image: '/ai_shift_swaps.png',
      icon: Sparkles
    },
    clock: {
      title: 'GPS-Bounded Mobile Clock-In',
      desc: 'Enable seamless clock-in/out directly from employee mobile devices when they arrive at the location. Monitor active sessions in real time, review timesheets, and export data directly to payroll.',
      metrics: 'Eliminate buddy clocking and save 2.4% on labor leakage.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrum3X1-Rs-xZufnZPvKeI_AW7OpbqB24Xr1G2eg7UG312r6Y7wTMT0ZvgEo-bED6XJWCCvRlQU9W-hFcgGxQhRulB7NmFCyC8NPTiI8tSkN1D7cqf39A4cC56nQZ7zTeh5XpTxGVhRduoSiZIAOYZfOsu5_IuSv9sHtEQ8E9amywojrNgmKSb4uArZWQJYT_YxfmgZNfJAEg2dwxA2mOMxpB4c98kiIhfhWySvxNF3jwpKRaf_JNbN8ArxlS2eVV_JpFqZOzf2Ny0',
      icon: Clock
    },
    morale: {
      title: 'Anonymous Shift Surveys & Feedback',
      desc: 'Keep a pulse on kitchen and floor stress. Employees submit quick anonymous satisfaction surveys at the end of their shifts, giving managers aggregate ratings to improve workload distribution.',
      metrics: 'Increase staff retention by 30% through proactive feedback loops.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrum3X1-Rs-xZufnZPvKeI_AW7OpbqB24Xr1G2eg7UG312r6Y7wTMT0ZvgEo-bED6XJWCCvRlQU9W-hFcgGxQhRulB7NmFCyC8NPTiI8tSkN1D7cqf39A4cC56nQZ7zTeh5XpTxGVhRduoSiZIAOYZfOsu5_IuSv9sHtEQ8E9amywojrNgmKSb4uArZWQJYT_YxfmgZNfJAEg2dwxA2mOMxpB4c98kiIhfhWySvxNF3jwpKRaf_JNbN8ArxlS2eVV_JpFqZOzf2Ny0',
      icon: MessageSquare
    }
  };

  const activeShowcase = featureShowcases[activeFeatureTab];
  const ActiveIcon = activeShowcase.icon;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased pb-16">
      
      {/* Public Marketing Header matching Fourth */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/15 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-6 py-4 flex justify-between items-center">
          
          {/* Logo with Google-inspired design */}
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png?v=4" alt="WorkforcePro Logo" className="h-12 w-auto object-contain" />
          </div>

          {/* Navigation links matching Fourth */}
          <nav className="hidden lg:flex items-center gap-md text-xs font-semibold text-on-surface-variant">
            <a href="#features" className="hover:text-primary transition-colors py-2">Workforce iQ</a>
            <a href="#features" className="hover:text-primary transition-colors py-2">Solutions</a>
            <a href="#features" className="hover:text-primary transition-colors py-2">Products</a>
            <a href="#features" className="hover:text-primary transition-colors py-2">Integrations</a>
            <a href="#impact" className="hover:text-primary transition-colors py-2">Resources</a>
            <a href="#pricing" className="hover:text-primary transition-colors py-2">Pricing</a>
            <button onClick={onLaunchApp} className="hover:text-primary transition-colors py-2 font-bold text-[#002171]">Login</button>
            <div className="h-4 w-[1px] bg-outline-variant/40" />
            <Search size={15} className="text-on-surface-variant cursor-pointer hover:text-primary" />
            <Globe size={15} className="text-on-surface-variant cursor-pointer hover:text-primary" />
          </nav>

          {/* CTA Get a Demo Button on the right */}
          <div className="flex items-center gap-sm">
            <a 
              href="#demo"
              className="bg-[#2bcbba] hover:bg-[#20bf6b] text-white text-xs font-bold py-2.5 px-5 rounded-full transition-all duration-150 active:scale-95 shadow-sm"
            >
              Get a Demo
            </a>
          </div>
        </div>
      </header>

      {/* Blue Promo Banner under header */}
      <div className="bg-[#002b6b] text-white py-3 text-center text-xs font-semibold px-4 flex flex-wrap justify-center items-center gap-sm border-t border-white/5">
        <span>Get 1 year of Advanced AI Scheduling – on us!</span>
        <a 
          href="#demo"
          className="border border-white hover:bg-white hover:text-[#002b6b] text-[10px] uppercase font-bold py-1 px-4 rounded-full transition-colors"
        >
          Learn More
        </a>
      </div>

      {/* Hero Section with custom Fourth-style gradient & graphics layout */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-r from-[#003d8f] via-[#005ba3] to-[#2bcbba] text-white border-b border-outline-variant/10">
        <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
          
          {/* Left Text content */}
          <div className="lg:col-span-5 space-y-md z-10">
            <span className="text-sm font-bold tracking-wider text-emerald-300 uppercase block">
              AI-Powered Restaurant Software
            </span>
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              Smoother shifts.<br />
              Smarter decisions.<br />
              Powered by people + AI.
            </h2>
            
            <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-[512px] font-medium">
              Turn data into action, help managers run more profitable shifts, and drive sustainable growth with the AI-powered platform built for restaurants.
            </p>

            <div className="flex flex-wrap gap-sm pt-xs">
              <a 
                href="#demo"
                className="bg-[#2bcbba] hover:bg-[#20bf6b] text-white text-xs font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-150 active:scale-95 flex items-center gap-xs"
              >
                <span>Get a Demo</span>
                <ArrowRight size={14} />
              </a>
              <button 
                onClick={onLaunchApp}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold py-3 px-6 rounded-full transition-all duration-150 active:scale-95"
              >
                Launch App Dashboard
              </button>
            </div>
          </div>

          {/* Right graphics area representing Fourth's Hero UI and Chef */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center min-h-[420px]">
            
            {/* Background green decorative circle behind chef */}
            <div className="absolute w-[240px] h-[240px] bg-[#2bcbba]/40 rounded-full blur-2xl top-10 left-10 -z-10" />
            <div className="absolute w-[320px] h-[320px] bg-blue-500/30 rounded-full blur-3xl bottom-10 right-10 -z-10" />

            {/* Main graphics container */}
            <div className="relative w-full max-w-[550px] space-y-md">
              
              {/* Graphic 1: The Chef card */}
              <div className="flex items-center gap-sm bg-white/15 backdrop-blur-md border border-white/20 p-sm rounded-2xl shadow-xl max-w-[420px] mr-auto animate-fadeIn transform hover:scale-102 transition-transform duration-200">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400 shrink-0 shadow-sm bg-white">
                  <img 
                    alt="Chef Supervisor" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmoRYXJYNXQE0GC4jcNmDeq6_M3NPn69zQ2pl9kK5pZZAwX2vkNGqo1IC0y5ly3KRpXmOV7fdPf1-T3sdJkXnpr3fMPWn3IhD3ZdNYrNIlp_DFJ32BZ_XaWG0fjFcYylefnyinlvIOwmepjxqFEn9_sxxPfdbY6kcpeCQNs_4BXDewRugDT7UG2z_UC1Vzk2lqTvpcq_2fd-iHc5YqedeDaVa0wb92vJVO0w5vmYllO-OaMmA4qxysYE9MaP5b6kjuxzp2-L-QweDO"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-emerald-300 uppercase tracking-widest block">Workforce Pro iQ</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Review your sales and labor plans for Friday: forecast up 9.4%</h4>
                  <span className="inline-block bg-[#002b6b]/40 text-[8px] font-bold text-white px-2 py-0.5 rounded-full border border-white/10 mt-1.5">
                    Pre-Approved
                  </span>
                </div>
              </div>

              {/* Graphic 2: The Dashboard Mockup */}
              <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-2xl p-md text-on-surface overflow-hidden max-w-[480px] ml-auto">
                {/* Dashboard Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-xs mb-sm">
                  <div className="flex items-center gap-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-[#002171] tracking-wider">Forecast Manager</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="bg-[#002171] text-white text-[8px] font-bold px-2 py-0.5 rounded">Sales</span>
                    <span className="bg-surface-container text-on-surface-variant text-[8px] font-bold px-2 py-0.5 rounded">Labor</span>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-surface-container-low p-sm rounded-xl border border-outline-variant/10">
                    <span className="text-[8px] font-bold text-on-surface-variant uppercase">AI Forecast Sales</span>
                    <p className="text-md font-black text-[#002171] mt-0.5">$41,705.20</p>
                    <span className="text-[8px] font-bold text-emerald-600 block mt-0.5">▲ +32.74% vs last year</span>
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-xl border border-outline-variant/10">
                    <span className="text-[8px] font-bold text-on-surface-variant uppercase">Adjusted Labor Budget</span>
                    <p className="text-md font-black text-[#002171] mt-0.5">$5,248.50</p>
                    <span className="text-[8px] font-bold text-[#002171]/60 block mt-0.5">Daily Goal: 12.5% ratio</span>
                  </div>
                </div>
              </div>

              {/* Graphic 3: The Floating Chat Assistant */}
              <div className="bg-white border border-[#002b6b]/15 rounded-2xl p-sm shadow-2xl max-w-[320px] ml-16 flex items-center gap-sm transform translate-y-3">
                <div className="w-10 h-10 rounded-full bg-[#002171] flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#002171] leading-snug">
                    Hi there! 👋 Are you ready to improve profitability and grow your business faster?
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid Section */}
      <section id="features" className="py-16 max-w-[1240px] mx-auto px-6 border-b border-outline-variant/10">
        <div className="text-center mb-lg">
          <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#002171]">Designed for the Rhythms of Service Businesses</h3>
          <p className="text-xs text-on-surface-variant max-w-[448px] mx-auto">
            Traditional scheduling tools are built for desks. WorkforcePro is optimized for mobile service staff, restaurant floors, and active supervisors.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-xs mb-lg">
          {(Object.keys(featureShowcases) as Array<keyof typeof featureShowcases>).map((key) => {
            const item = featureShowcases[key];
            const isActive = activeFeatureTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFeatureTab(key)}
                className={`py-2.5 px-6 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#002b6b] text-white shadow-sm' 
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {item.title.split(' & ')[0]}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="bg-surface-container-low rounded-3xl p-lg border border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-lg items-center">
          <div className="space-y-md">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ActiveIcon size={20} />
            </div>
            <h4 className="text-xl font-bold tracking-tight text-[#002171]">{activeShowcase.title}</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">{activeShowcase.desc}</p>
            
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300/20 rounded-xl p-sm flex items-start gap-xs">
              <TrendingUp size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Key Business Metric</span>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{activeShowcase.metrics}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-outline-variant/15 flex items-center justify-center bg-gray-50 p-4">
            <InteractiveFeaturePreview activeTab={activeFeatureTab} />
          </div>
        </div>
      </section>

      {/* Business Impact Section */}
      <section id="impact" className="py-16 max-w-[1240px] mx-auto px-6 border-b border-outline-variant/10 text-center">
        <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#002171]">Quantifiable Value for Managers</h3>
        <p className="text-xs text-on-surface-variant max-w-[448px] mx-auto mb-lg">
          We build tools that directly impact your restaurant or hospitality group's bottom line.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="p-md bg-surface-container rounded-2xl border border-outline-variant/10 space-y-xs">
            <span className="text-3xl font-black text-primary">18%</span>
            <h4 className="font-bold text-xs text-on-surface">Labor Costs Reduction</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Optimize schedules to match forecast guest counts and alert managers before employees enter overtime.
            </p>
          </div>
          <div className="p-md bg-surface-container rounded-2xl border border-outline-variant/10 space-y-xs">
            <span className="text-3xl font-black text-primary">92%</span>
            <h4 className="font-bold text-xs text-on-surface">Swap Request Automation</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Employees coordinate shift swaps using pre-approved compliance paths. Less micro-managing, zero paper logs.
            </p>
          </div>
          <div className="p-md bg-surface-container rounded-2xl border border-outline-variant/10 space-y-xs">
            <span className="text-3xl font-black text-primary">4.8/5</span>
            <h4 className="font-bold text-xs text-on-surface">Employee Satisfaction Rating</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Staff love having control of their shift calendars, transparent hours metrics, and the ability to claim offers on mobile.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Integration Section */}
      <section id="pricing" className="py-16 max-w-[1240px] mx-auto px-6 border-b border-outline-variant/10">
        <div className="text-center mb-md">
          <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#002171]">Simple, Transparent Pricing</h3>
          <p className="text-xs text-on-surface-variant max-w-[448px] mx-auto">
            Choose the plan that fits your staff size. Every tier starts with a 14-day free trial.
          </p>
        </div>

        {/* Pricing View embedded here */}
        <PricingView 
          showToast={showToast}
          subscription={subscription}
          onNavigate={onLaunchApp}
        />
      </section>

      {/* Interactive Demo Request Section */}
      <section id="demo" className="py-16 max-w-[448px] mx-auto px-6">
        <div className="text-center mb-lg">
          <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#002171]">Book a Live 1-on-1 Demo</h3>
          <p className="text-xs text-on-surface-variant max-w-[320px] mx-auto">
            Speak with our restaurant solutions engineer. We will set up your trial account and import your current staff rosters.
          </p>
        </div>

        {demoSubmitted ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl p-lg text-center space-y-xs">
            <Award size={36} className="text-primary mx-auto mb-2" />
            <h4 className="font-bold text-base text-secondary">Demo Request Logged!</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Thank you {demoForm.name}. We have sent a scheduler link to your inbox at <strong>{demoForm.email}</strong>. 
              Let's get your labor costs under control!
            </p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="bg-surface-container rounded-2xl p-md border border-outline-variant/15 space-y-sm shadow-sm">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant/90 mb-1 ml-1" htmlFor="demo-name">Your Name</label>
              <input 
                id="demo-name"
                type="text"
                required
                value={demoForm.name}
                onChange={(e) => setDemoForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sarah Miller"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary focus:bg-white text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant/90 mb-1 ml-1" htmlFor="demo-email">Work Email</label>
              <input 
                id="demo-email"
                type="email"
                required
                value={demoForm.email}
                onChange={(e) => setDemoForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="sarah@yourrestaurant.com"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary focus:bg-white text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant/90 mb-1 ml-1" htmlFor="demo-biz">Restaurant/Business Name</label>
              <input 
                id="demo-biz"
                type="text"
                required
                value={demoForm.restaurant}
                onChange={(e) => setDemoForm(prev => ({ ...prev, restaurant: e.target.value }))}
                placeholder="Wayback Bar & Grill"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary focus:bg-white text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant/90 mb-1 ml-1" htmlFor="demo-size">Roster Size</label>
              <select 
                id="demo-size"
                value={demoForm.size}
                onChange={(e) => setDemoForm(prev => ({ ...prev, size: e.target.value }))}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary focus:bg-white text-on-surface"
              >
                <option value="1-15">1-15 Employees (Starter)</option>
                <option value="16-50">16-50 Employees (Pro)</option>
                <option value="50+">50+ Employees (Enterprise)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant/90 mb-1 ml-1" htmlFor="demo-msg">Specific Challenges</label>
              <textarea 
                id="demo-msg"
                rows={3}
                value={demoForm.message}
                onChange={(e) => setDemoForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Overtime tracking, constant schedule text messages, inventory waste..."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary focus:bg-white text-on-surface resize-none"
              />
            </div>
            <button 
              type="submit"
              className="w-full h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-xs shadow hover:brightness-105 active:scale-98 transition-all text-xs cursor-pointer"
            >
              <Mail size={14} /> Book My Free Strategy Session
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="max-w-[1240px] mx-auto px-6 border-t border-outline-variant/10 pt-lg text-center text-[10px] text-on-surface-variant/60 flex flex-col md:flex-row justify-between items-center gap-sm">
        <p>&copy; {new Date().getFullYear()} WorkforcePro Solutions. Inspired by Fourth.com B2B best practices.</p>
        <div className="flex gap-md font-semibold">
          <a href="#features" className="hover:underline">Product Features</a>
          <a href="#pricing" className="hover:underline">SaaS Pricing</a>
          <a href="#demo" className="hover:underline">Book Demo</a>
        </div>
      </footer>

    </div>
  );
}

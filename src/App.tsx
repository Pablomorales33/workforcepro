import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { Shift, ChatSession, SurveyResponse, ClockSession } from './types';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import ScheduleView from './components/ScheduleView';
import ProfileView from './components/ProfileView';
import MessagesView from './components/MessagesView';
import RequestsView, { VacationObj } from './components/RequestsView';
import PricingView from './components/PricingView';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import ManagerView from './components/ManagerView';
import { db, auth, isConfigured } from './firebase';
import { collection, onSnapshot, setDoc, doc, getDocs, getDoc } from 'firebase/firestore';



export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('payment') || params.get('portal')) ? 'app' : 'landing';
  });

  useEffect(() => {
    if (window.history.state === null) {
      window.history.replaceState({ viewMode }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.viewMode) {
        setViewMode(event.state.viewMode);
      } else {
        setViewMode('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewMode]);

  const navigateToView = (newMode: 'landing' | 'app') => {
    setViewMode(newMode);
    if (!window.history.state || window.history.state.viewMode !== newMode) {
      window.history.pushState({ viewMode: newMode }, '');
    }
  };

  const [activeTab, setActiveTab] = useState<string>('home');
  const [weeklyHours, setWeeklyHours] = useState<number>(32);
  const [hotStreaks, setHotStreaks] = useState<number>(5);
  const [vacationStatus, setVacationStatus] = useState<'Approved' | 'Pending' | 'Denied'>('Approved');

  // Authentication State Hooks
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; role: 'employee' | 'manager'; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('wfpro-dark') === 'true';
  });

  const [subscription, setSubscription] = useState<{
    status: 'free' | 'starter' | 'pro' | 'enterprise';
    billingCycle: 'monthly' | 'annual';
    simulated: boolean;
    sessionId?: string;
  }>(() => {
    const saved = localStorage.getItem('wfpro-subscription');
    return saved ? JSON.parse(saved) : {
      status: 'free',
      billingCycle: 'monthly',
      simulated: true
    };
  });

  useEffect(() => {
    localStorage.setItem('wfpro-subscription', JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('wfpro-dark', String(darkMode));
  }, [darkMode]);

  // Monitor Firebase Auth State
  useEffect(() => {
    if (!isConfigured || !auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: userData.role || 'employee',
              name: userData.name || 'User',
            });
          } else {
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'employee',
              name: 'User',
            });
          }
        } catch (e) {
          console.error('[Firebase] Failed reading user document:', e);
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'employee',
            name: 'User',
          });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isConfigured && auth) {
      await auth.signOut();
    }
    setCurrentUser(null);
    navigateToView('landing');
    showToast('Signed out successfully.', 'info');
  };



  // Multi-day calendar schedules
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: 's1',
      role: 'Host',
      location: 'Wayback Bar & Grill',
      date: 'May 7',
      dateLabel: 'Tuesday, May 7',
      timeRange: '4:00 PM - 8:00 PM',
      hours: 4,
      rate: 22,
      status: 'Confirmed',
      isMyShift: true
    },
    {
      id: 's2',
      role: 'Bartender',
      location: 'Wayback Bar & Grill',
      date: 'May 8',
      dateLabel: 'Wednesday, May 8',
      timeRange: '5:00 PM - 1:00 AM',
      hours: 8,
      rate: 22,
      status: 'Swap Requested',
      isMyShift: true
    },
    {
      id: 's3',
      role: 'Kitchen Staff',
      location: 'Wayback Bar & Grill',
      date: 'May 9',
      dateLabel: 'Thursday, May 9',
      timeRange: '8:00 AM - 4:00 PM',
      hours: 8,
      rate: 22,
      status: 'Available',
      isMyShift: false
    },
    {
      id: 's4',
      role: 'Dinner Server',
      location: 'Wayback Bar & Grill',
      date: 'May 10',
      dateLabel: 'Friday, May 10',
      timeRange: '4:00 PM - 11:00 PM',
      hours: 7,
      rate: 22,
      status: 'Available',
      isMyShift: false,
      details: 'Multiple positions open'
    },
    // Future Open Offers shown in Home Claims
    {
      id: 'o1',
      role: 'Bartender',
      location: 'Wayback Bar & Grill (Floor 2)',
      date: 'May 15',
      dateLabel: 'Wed, May 15',
      timeRange: '11:00 AM - 5:00 PM',
      hours: 6,
      rate: 22,
      status: 'Available',
      isMyShift: false
    },
    {
      id: 'o2',
      role: 'Host',
      location: 'Wayback Bar & Grill (Main Entrance)',
      date: 'May 17',
      dateLabel: 'Fri, May 17',
      timeRange: '4:00 PM - 11:00 PM',
      hours: 7,
      rate: 22,
      status: 'Available',
      isMyShift: false
    }
  ]);

  // Firestore sync for shifts
  useEffect(() => {
    if (!isConfigured || !db) return;

    const shiftsCol = collection(db, 'shifts');

    // Seed database if empty
    getDocs(shiftsCol).then((snapshot) => {
      if (snapshot.empty) {
        shifts.forEach((s) => {
          setDoc(doc(db, 'shifts', s.id), s);
        });
      }
    });

    const unsubscribe = onSnapshot(shiftsCol, (snapshot) => {
      const fetchedShifts: Shift[] = [];
      snapshot.forEach((docSnap) => {
        fetchedShifts.push(docSnap.data() as Shift);
      });
      if (fetchedShifts.length > 0) {
        fetchedShifts.sort((a, b) => a.id.localeCompare(b.id));
        setShifts(fetchedShifts);
      }
    });

    return () => unsubscribe();
  }, []);

  const setShiftsWithFirestore: React.Dispatch<React.SetStateAction<Shift[]>> = (value) => {
    setShifts((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (isConfigured && db) {
        next.forEach((shift: Shift) => {
          const prevShift = prev.find((p) => p.id === shift.id);
          if (!prevShift || JSON.stringify(prevShift) !== JSON.stringify(shift)) {
            setDoc(doc(db, 'shifts', shift.id), shift).catch((err) => {
              console.error('[Firebase] Error updating shift:', err);
            });
          }
        });
      }
      return next;
    });
  };

  // Clock In active state stopwatch session
  const [clockSession, setClockSession] = useState<ClockSession>({
    isClockedIn: false,
    start_time: null,
    accumulatedMinutes: 1920 // Initial 32 hours prelogged
  });

  // Vacation Requests
  const [vacations, setVacations] = useState<VacationObj[]>([
    {
      id: 'v1',
      type: 'Vacation',
      reason: 'Summer family trip approval requested',
      start: 'June 20',
      end: 'June 25',
      status: 'Approved',
      submittedAt: '2 days ago'
    }
  ]);

  // Survey Session
  const [survey, setSurvey] = useState<SurveyResponse>({
    rating: 0,
    challenges: '',
    factors: [],
    submittedAt: null
  });
  const [surveyHistory, setSurveyHistory] = useState<SurveyResponse[]>([]);

  // Messages Session preloaded lists (Sarah, rivers, chef) with responsive chat logs
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const initial: (Omit<ChatSession, 'avatar'> & { imageUrl?: string; avatar?: string })[] = [
      {
        id: 'general',
        name: '#general',
        isChannel: true,
        messages: [
          {
            id: 'g1',
            sender: 'agent',
            senderName: 'Sarah (Manager)',
            text: 'Reminder: New sanitization protocols document is active. Please review it on the channel files and sign off.',
            timestamp: '3 days ago'
          }
        ]
      },
      {
        id: 'kitchen-staff',
        name: '#kitchen-staff',
        isChannel: true,
        messages: [
          {
            id: 'k1',
            sender: 'agent',
            senderName: 'Chef Marco',
            text: 'Need someone to cover Thursday lines sub. If anyone is free, claim it in the Shift Swap board or let me know.',
            timestamp: 'Yesterday'
          }
        ]
      },
      {
        id: 'sarah',
        name: 'Sarah',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuExchange-sarah-manager',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIxRGx2H8jmXya0HIQ06Iw_aIznoNlWXR3idhUtfeMTYho0ZSlYgwqyIBXhCqLXMNJ4nKseLWn0CCCQoITu6epwhXVriS5h9mPNI6kYeP0JdtWN3p7OzdyAepYXB0mzItgI-pxeY8gZRpvHyt2JU9oTbOILXBqgxjeCCFMKUg6A1hSba2WTMfMOzMnSBF5xTu1n_PAzFjrMDRmEiwlZaKQtZOG0v00uk0kt07Zxs8T5gqgkIj5I6R5ONgjM-TPgKJWqJbk_vSa_OIJ',
        isChannel: false,
        role: 'General Manager',
        unread: true,
        messages: [
          {
            id: 's1',
            sender: 'agent',
            senderName: 'Sarah',
            text: 'Hey Alex! Just a reminder to submit your shift satisfaction survey review for yesterday closing schedule shift.',
            timestamp: 'Yesterday'
          }
        ]
      },
      {
        id: 'rivers',
        name: 'Alex Rivers',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJVGK1_BgBDHoi93ms1c8q6QgAkw8lfVoGsGj6ukgiFc5kjSJanwrosoLqC-Bnnhe5v6a2iYJ8xX5jGUIWtP6F610vDf3MxGSk_Pbrr7Hl_H7XpmNgtEvYA-a6oVFIA5qeN8HME0zEvcUURQrRmZfq4Lm3i5TDvs7DXKDdWsblk9X0f2CwMff4r__sHkHfOjX266_2kLx7Ixs_tf-jjBotZVjp66nT6kEtoR5ukM5iERPfvPLQiZF77B_D3JwbCMFeUe2lO_iGCdly',
        isChannel: false,
        role: 'Lead Bartender',
        unread: false,
        messages: [
          {
            id: 'r1',
            sender: 'agent',
            senderName: 'Alex Rivers',
            text: 'Yo, did you hear about the summer Grill-off team picnic this Sunday? I heard Sarah is bringing full catering!',
            timestamp: '2 hours ago'
          }
        ]
      },
      {
        id: 'chef',
        name: 'Chef Marco',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmoRYXJYNXQE0GC4jcNmDeq6_M3NPn69zQ2pl9kK5pZZAwX2vkNGqo1IC0y5ly3KRpXmOV7fdPf1-T3sdJkXnpr3fMPWn3IhD3ZdNYrNIlp_DFJ32BZ_XaWG0fjFcYylefnyinlvIOwmepjxqFEn9_sxxPfdbY6kcpeCQNs_4BXDewRugDT7UG2z_UC1Vzk2lqTvpcq_2fd-iHc5YqedeDaVa0wb92vJVO0w5vmYllO-OaMmA4qxysYE9MaP5b6kjuxzp2-L-QweDO',
        isChannel: false,
        role: 'Kitchen Supervisor',
        unread: false,
        messages: [
          {
            id: 'c1',
            sender: 'agent',
            senderName: 'Chef Marco',
            text: 'Cooper, we need a Dinner Server available Wed shift Floor 2. Can you pick it up?',
            timestamp: '4 hours ago'
          }
        ]
      }
    ];
    return initial.map(s => ({
      ...s,
      avatar: s.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1pdgsUgDQhMYjJrzll_Hluh_RltuhYNzkbFQ-a2OeVdq1xqT8EH_cICJJ9pKNFEmiHGLdyagN_NllbDRBi7tiY1pcDUj7FKAXVL-h_6mmA_c7McSMlL8hrK2MPpPtNjuyrc8as5tdyyTD5s1Ny8G_wL_7uiIDcgUWedFg00kkd_Es3jdLji89wIQAimO806Yhe9djbS0MZFuwiU_05QSAEyCtmgi41YbVpnRuasjwQ9vzBzlSWa20S_n28Ts-VDvN32GFjqY9dH-5'
    }));
  });

  // Firestore sync for chat sessions
  useEffect(() => {
    if (!isConfigured || !db) return;

    const chatsCol = collection(db, 'chatSessions');

    // Seed database if empty
    getDocs(chatsCol).then((snapshot) => {
      if (snapshot.empty) {
        chatSessions.forEach((session) => {
          setDoc(doc(db, 'chatSessions', session.id), session);
        });
      }
    });

    const unsubscribe = onSnapshot(chatsCol, (snapshot) => {
      const fetchedSessions: ChatSession[] = [];
      snapshot.forEach((docSnap) => {
        fetchedSessions.push(docSnap.data() as ChatSession);
      });
      if (fetchedSessions.length > 0) {
        const order = ['general', 'kitchen-staff', 'sarah', 'rivers', 'chef'];
        fetchedSessions.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        setChatSessions(fetchedSessions);
      }
    });

    return () => unsubscribe();
  }, []);

  const setChatSessionsWithFirestore: React.Dispatch<React.SetStateAction<ChatSession[]>> = (value) => {
    setChatSessions((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (isConfigured && db) {
        next.forEach((session: ChatSession) => {
          const prevSession = prev.find((p) => p.id === session.id);
          if (!prevSession || JSON.stringify(prevSession) !== JSON.stringify(session)) {
            setDoc(doc(db, 'chatSessions', session.id), session).catch((err) => {
              console.error('[Firebase] Error updating chat session:', err);
            });
          }
        });
      }
      return next;
    });
  };

  // Historical swap board loggers
  const [swapHistory, setSwapHistory] = useState<any[]>([
    {
      id: 'h1',
      type: 'Swap Completed',
      detail: 'With Alex Rivers • Oct 10',
      meta: '+$132 Added',
      time: '2 days ago',
      status: 'completed'
    },
    {
      id: 'h2',
      type: 'Shift Released',
      detail: 'Unfilled • Oct 8',
      meta: '8h Released',
      time: '4 days ago',
      status: 'pending'
    }
  ]);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // Listen for Stripe callback parameters in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    const plan = params.get('plan');
    const cycle = params.get('cycle');
    const portal = params.get('portal');

    if (payment === 'success' && plan) {
      setSubscription({
        status: plan as any,
        billingCycle: (cycle || 'monthly') as any,
        simulated: sessionId?.startsWith('mock_') || false,
        sessionId: sessionId || undefined
      });
      navigateToView('app');
      setActiveTab('profile'); // Direct user to Profile to view the upgrade
      showToast(`Subscription successful! Upgraded to ${plan.toUpperCase()}.`, 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancel') {
      navigateToView('app');
      showToast('Payment checkout cancelled.', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (portal === 'simulated') {
      navigateToView('app');
      showToast('Billing Portal session completed.', 'info');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync vacation status based on requests logs
  useEffect(() => {
    const hasPending = vacations.some(v => v.status === 'Pending');
    if (vacations.length > 0) {
      setVacationStatus(vacations[0].status);
    }
  }, [vacations]);

  // Render proper child view
  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            shifts={shifts}
            setShifts={setShiftsWithFirestore}
            clockSession={clockSession}
            setClockSession={setClockSession}
            weeklyHours={weeklyHours}
            setWeeklyHours={setWeeklyHours}
            hotStreaks={hotStreaks}
            vacationStatus={vacationStatus}
            onNavigate={setActiveTab}
            showToast={showToast}
          />
        );
      case 'schedule':
        return (
          <ScheduleView
            shifts={shifts}
            setShifts={setShiftsWithFirestore}
            weeklyHours={weeklyHours}
            setWeeklyHours={setWeeklyHours}
            showToast={showToast}
            swapHistory={swapHistory}
            setSwapHistory={setSwapHistory}
          />
        );
      case 'messages':
        return (
          <MessagesView
            chatSessions={chatSessions}
            setChatSessions={setChatSessionsWithFirestore}
            showToast={showToast}
          />
        );
      case 'requests':
        return (
          <RequestsView 
            vacations={vacations}
            setVacations={setVacations}
            showToast={showToast}
          />
        );
      case 'profile':
        return (
          <ProfileView
            survey={survey}
            setSurvey={setSurvey}
            weeklyHours={weeklyHours}
            showToast={showToast}
            surveyHistory={surveyHistory}
            setSurveyHistory={setSurveyHistory}
            subscriptionStatus={subscription.status}
            billingCycle={subscription.billingCycle}
            isDbConnected={isConfigured}
            onLogout={handleLogout}
            onNavigate={(tab) => {
              if (tab === 'landing') {
                navigateToView('landing');
              } else {
                setActiveTab(tab);
              }
            }}
          />
        );
      case 'pricing':
        return (
          <PricingView
            showToast={showToast}
            subscription={subscription}
            onNavigate={(tab) => {
              if (tab === 'landing') {
                navigateToView('landing');
              } else {
                setActiveTab(tab);
              }
            }}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  const unreadMessagesCount = chatSessions.filter(s => s.unread).length;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans select-none">
      
      {/* Toast Banner Component absolute fixed floating at top screen */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-[320px] px-container-margin animate-fadeIn">
          <div className={`p-md rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-primary border-emerald-200' 
              : toast.type === 'warning' 
                ? 'bg-rose-50 text-error border-rose-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-[10px] uppercase font-bold opacity-75 hover:opacity-100 ml-sm outline-none cursor-pointer"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {viewMode === 'landing' ? (
        <LandingView
          onLaunchApp={() => {
            if (currentUser) {
              navigateToView('app');
            } else {
              setShowAuthModal(true);
            }
          }}
          onNavigateToPricing={() => {
            navigateToView('app');
            setActiveTab('pricing');
          }}
          showToast={showToast}
          subscription={subscription}
        />
      ) : currentUser?.role === 'manager' ? (
        <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans select-none p-lg">
          <ManagerView
            shifts={shifts}
            setShifts={setShiftsWithFirestore}
            vacations={vacations}
            setVacations={setVacations}
            showToast={showToast}
            onLogout={handleLogout}
            managerName={currentUser.name}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col pb-24">
          {/* Top Main Application bar — glassmorphism gradient header */}
          <header
            className="sticky top-0 z-40 w-full shrink-0"
            style={{
              background: darkMode
                ? 'linear-gradient(135deg, #1a2e24 0%, #0d1f17 100%)'
                : 'linear-gradient(135deg, rgba(247,249,251,0.95) 0%, rgba(224,240,232,0.92) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,109,67,0.12)',
              boxShadow: '0 2px 16px rgba(0,109,67,0.08)'
            }}
          >
            <div className="flex justify-between items-center px-container-margin py-md">
              <div className="flex items-center gap-sm cursor-pointer" onClick={() => navigateToView('landing')}>
                <img 
                  alt="WorkforcePro Logo" 
                  className="h-12 w-auto object-contain" 
                  src="/logo.png?v=4"
                />
                <div className="border-l border-outline-variant/40 pl-3 py-1 ml-1">
                  <p className="text-[10px] text-on-surface-variant/70 font-bold uppercase tracking-wider">Wayback Bar &amp; Grill</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Dark Mode Toggle */}
                <button
                  id="dark-mode-toggle"
                  onClick={() => setDarkMode(prev => !prev)}
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 hover:bg-primary/10 border border-outline-variant/25"
                >
                  {darkMode
                    ? <Sun size={18} className="text-amber-400" />
                    : <Moon size={18} className="text-secondary" />
                  }
                </button>
                {/* Notification Bell */}
                <button
                  id="header-notifications-btn"
                  onClick={() => {
                    setActiveTab('messages');
                    showToast('Opening Messages & Notifications', 'info');
                  }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 hover:bg-primary/10 border border-outline-variant/25"
                  title="Notifications & Messages"
                >
                  <Bell size={18} className="text-primary" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white leading-none">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>
 
          {/* Main Screen Body portion */}
          <main className="flex-1 max-w-[768px] w-full mx-auto px-container-margin pt-lg">
            {renderView()}
          </main>
 
          {/* Navigation bottom bar panel */}
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            unreadCount={unreadMessagesCount}
          />
        </div>
      )}
 
      {showAuthModal && (
        <AuthView
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            navigateToView('app');
          }}
          onClose={() => setShowAuthModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

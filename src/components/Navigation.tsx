import React from 'react';
import { Home, Calendar, MessageSquare, FileText, User } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
}

export default function Navigation({ activeTab, setActiveTab, unreadCount = 1 }: NavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest dark:bg-inverse-surface shadow-[0px_-4px_12px_rgba(30,41,59,0.05)] shadow-lg rounded-t-xl px-gutter py-xs flex justify-around items-center border-t border-outline-variant/30">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center px-xs py-base transition-all duration-200 active:scale-90 ${
              isActive
                ? 'bg-primary-container dark:bg-primary-fixed-variant text-on-primary-container dark:text-primary-fixed rounded-xl scale-95 font-semibold px-3'
                : 'text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-secondary-fixed-variant'
            }`}
          >
            <div className="relative">
              <IconComponent 
                size={22} 
                className={`transition-transform duration-100 ${isActive ? 'scale-105 stroke-[2.5px]' : 'stroke-[2px]'}`} 
              />
              {tab.badge && tab.badge > 0 && !isActive && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white leading-none animate-pulse">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="font-label-md text-[11px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
export type { NavigationProps };

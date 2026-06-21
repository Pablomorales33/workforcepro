export interface Shift {
  id: string;
  role: string;         // 'Host', 'Server', 'Bartender', 'Kitchen Staff'
  location: string;     // 'Wayback Bar & Grill', 'Main Dining Hall', 'Floor 2', 'Main Entrance'
  date: string;         // e.g., 'May 6', 'May 7', 'May 8', 'May 9', 'May 10', 'Oct 12', 'Oct 13'
  dateLabel: string;    // e.g., 'Monday, May 6', 'Tuesday, May 7'
  timeRange: string;    // e.g., '4:00 PM – 10:00 PM', '11:00 AM – 5:00 PM'
  hours: number;        // e.g., 6, 8, 4
  rate: number;         // e.g., 22, 24
  status: 'Confirmed' | 'Swap Requested' | 'Available' | 'AssignedToMe' | 'Released';
  isMyShift: boolean;   // True if it belongs to the current user (Alex)
  details?: string;     // e.g., 'Team B (6 people)' or 'Multiple positions open'
}

export interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  type: 'cel' | 'check' | 'update' | 'safety';
  icon: string;
  isCompleted?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string; // e.g. '#general', '#kitchen-staff', 'sarah', 'rivers', 'chef'
  name: string;
  avatar?: string;
  isChannel: boolean;
  role?: string; // e.g. 'Manager', 'Bartender', 'Executive Chef'
  unread?: boolean;
  messages: ChatMessage[];
}

export interface SurveyResponse {
  rating: number; // 1-5 (Awful, Bad, Okay, Good, Great)
  challenges: string;
  factors: string[]; // e.g. ['Kitchen Delay', 'Busy Rush']
  submittedAt: string | null;
}

export interface ClockSession {
  isClockedIn: boolean;
  start_time: string | null;
  accumulatedMinutes: number;
}

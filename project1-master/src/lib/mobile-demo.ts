// Static visual fixtures for the new mobile UI. Mirrors the desktop demo
// module but the mobile mockups use a different patient roster (M. Johnson
// 402A, L. Martinez 508B, A. Patel 312C, T. Anderson 210A, J. Williams
// 607B...). Keep the two demo modules in sync only where the mockups
// agree.

export type Severity = "high" | "med" | "low" | "stable" | "info";

// ---------- top bar -----------------------------------------------------

export const M_TOP_BAR = {
  alerts: true,
  initials: "NK",
};

// ---------- Catch Up (image 8) -----------------------------------------

export const M_CATCH_UP = {
  subtitle: "Day Shift  -  Apr 30, 2025  -  7:00 AM – 7:00 PM",
  onShift: true,
  stats: [
    { icon: "chat", label: "Open threads", value: "14", tone: "neutral" as const },
    { icon: "alert", label: "Urgent updates", value: "6", tone: "critical" as const },
    { icon: "clipboard", label: "Unresolved items", value: "9", tone: "neutral" as const },
    { icon: "users", label: "Patients need attention", value: "8", tone: "neutral" as const },
  ],
  needingAttention: [
    { room: "402A", name: "M. Johnson", age: 67, severity: "high" as Severity, status: "BP 182/96 - Hydralazine due", time: "9m ago" },
    { room: "508B", name: "L. Martinez", age: 72, severity: "med" as Severity, status: "Pain 8/10 - PRN given", time: "15m ago" },
    { room: "312C", name: "A. Patel", age: 58, severity: "med" as Severity, status: "K+ 2.9 - Replacement ordered", time: "20m ago" },
    { room: "210A", name: "T. Anderson", age: 81, severity: "low" as Severity, status: "Possible DC today - Await PT", time: "32m ago" },
    { room: "607B", name: "J. Williams", age: 45, severity: "high" as Severity, status: "O2 sat 89% on 4L NC", time: "47m ago" },
  ],
  recentActivity: [
    { time: "9:36 AM", icon: "alert" as const, title: "Lab result critical: K+ 2.9", by: "A. Patel (312C)", tag: "Lab" as const },
    { time: "9:28 AM", icon: "chat" as const, title: "New message in #4E Nurses", by: "S. Nguyen, RN", tag: "Chat" as const },
    { time: "9:22 AM", icon: "clipboard" as const, title: "Discharge plan updated", by: "T. Anderson (210A)", tag: "Care Plan" as const },
    { time: "9:15 AM", icon: "check" as const, title: "Medication given", by: "L. Martinez (508B) - Oxycodone 5mg", tag: "MAR" as const },
    { time: "9:08 AM", icon: "flask" as const, title: "Lab result received: Hgb 8.6", by: "M. Johnson (402A)", tag: "Lab" as const },
  ],
  unresolved: [
    { severity: "high" as Severity, title: "Follow up: K+ 2.9 replacement", who: "A. Patel (312C)", due: "Due 10:00 AM", tone: "high" as const },
    { severity: "med" as Severity, title: "Pain reassessment", who: "L. Martinez (508B)", due: "Due 10:15 AM", tone: "med" as const },
    { severity: "low" as Severity, title: "Discharge meds to bedside", who: "T. Anderson (210A)", due: "Due 11:00 AM", tone: "low" as const },
    { severity: "stable" as Severity, title: "IV due for change", who: "J. Williams (607B)", due: "Due 12:00 PM", tone: "stable" as const },
  ],
};

// ---------- Chats (image 9) --------------------------------------------

export const M_CHATS = {
  filters: { all: true, unread: 8, mentions: 2, alerts: 3 },
  pinned: [
    {
      avatar: "icu" as const,
      label: "ICU Updates",
      preview: "M. Johnson: Heads up—bed 3 is ready.",
      time: "9:28 AM",
      unread: 5,
      presence: "active" as const,
    },
    {
      avatar: "ED",
      avatarBg: "#6b46c1",
      label: "ED Charge Nurse Team",
      preview: "S. Nguyen: Call huddle at 1400.",
      time: "8:50 AM",
      unread: 2,
      presence: "idle" as const,
    },
    {
      avatar: "PH",
      avatarBg: "#0e7c66",
      label: "Pharmacy Updates",
      preview: "A. Patel: Tylenol IV restock complete.",
      time: "8:15 AM",
      presence: "active" as const,
    },
  ],
  active: [
    {
      initials: "SN",
      avatarBg: "#d4a847",
      photo: true,
      name: "S. Nguyen, RN",
      preview: "Thanks! I'll follow up with the family.",
      time: "9:36 AM",
      unread: 1,
      presence: "active" as const,
    },
    {
      initials: "MP",
      avatarBg: "#2563eb",
      name: "M. Patel, MD",
      preview: "Can you send the latest labs?",
      time: "9:22 AM",
      unread: 1,
      presence: "idle" as const,
    },
    {
      initials: "TJ",
      avatarBg: "#92400e",
      name: "T. Johnson, RT",
      preview: "Vent settings look good, thanks.",
      time: "9:08 AM",
      presence: "active" as const,
    },
  ],
  threads: [
    {
      room: "214",
      label: "Room 214 — M. Chen",
      preview: "L. Martinez: Pain reassessment due at 10:15.",
      time: "9:30 AM",
      unread: 2,
      avatarBg: "#6b46c1",
      presence: "active" as const,
    },
    {
      room: "402A",
      label: "Room 402A — M. Johnson",
      preview: "A. Patel: BP 182/96 - Hydralazine given",
      time: "9:10 AM",
      unread: 1,
      avatarBg: "#92400e",
      presence: "active" as const,
    },
    {
      room: "312C",
      label: "Room 312C — A. Patel",
      preview: "S. Nguyen: K+ 2.9 - Replacement ordered",
      time: "8:55 AM",
      avatarBg: "#2563eb",
      presence: "idle" as const,
    },
    {
      room: "508B",
      label: "Room 508B — L. Martinez",
      preview: "J. Williams: Oxycodone 5mg given",
      time: "8:32 AM",
      avatarBg: "#0e7c66",
      presence: "active" as const,
    },
  ],
};

// ---------- Patients (image 11) ----------------------------------------

export const M_PATIENTS = {
  priority: [
    { initials: "MJ", name: "M. Johnson", age: 67, room: "402A", mrn: "MRN 10023456", severity: "high" as Severity, status: "BP 182/96 - Hydralazine due", time: "9m ago", unread: 2 },
    { initials: "JW", name: "J. Williams", age: 45, room: "607B", mrn: "MRN 10067890", severity: "high" as Severity, status: "O2 sat 89% on 4L NC", time: "47m ago", unread: 1 },
    { initials: "LP", name: "L. Martinez", age: 72, room: "508B", mrn: "MRN 10034567", severity: "med" as Severity, status: "Pain 8/10 - PRN given", time: "15m ago", unread: 1 },
  ],
  total: 22,
  all: [
    { initials: "AP", name: "A. Patel", age: 58, room: "312C", severity: "high" as Severity, status: "K+ 2.9 - Replacement ordered", time: "20m ago", unread: 1 },
    { initials: "TA", name: "T. Anderson", age: 81, room: "210A", severity: "low" as Severity, status: "Possible DC today - Await PT", time: "32m ago" },
    { initials: "SN", name: "S. Nguyen", age: 64, room: "412A", severity: "stable" as Severity, status: "Discharge plan updated", time: "1h ago" },
    { initials: "LM", name: "L. Martinez", age: 72, room: "508B", severity: "med" as Severity, status: "Pain reassessment due", time: "15m ago", unread: 1 },
    { initials: "TJ", name: "T. Johnson", age: 60, room: "314B", severity: "low" as Severity, status: "IV due for change", time: "2h ago" },
    { initials: "BC", name: "B. Carter", age: 70, room: "606A", severity: "stable" as Severity, status: "Labs stable", time: "3h ago" },
    { initials: "KM", name: "K. Miller", age: 66, room: "208A", severity: "low" as Severity, status: "Awaiting PT eval", time: "4h ago" },
    { initials: "RW", name: "R. Williams", age: 77, room: "502A", severity: "med" as Severity, status: "Hgb 8.6", time: "5h ago", unread: 1 },
    { initials: "DL", name: "D. Lee", age: 59, room: "310B", severity: "stable" as Severity, status: "Tolerating diet", time: "6h ago" },
    { initials: "MS", name: "M. Smith", age: 73, room: "201A", severity: "low" as Severity, status: "Discharge tomorrow", time: "6h ago" },
    { initials: "JB", name: "J. Brown", age: 68, room: "405C", severity: "stable" as Severity, status: "No new issues", time: "7h ago" },
  ],
};

// ---------- Patient chart - Margaret Chen (image 12) -------------------

export const M_MARGARET = {
  name: "Margaret Chen",
  room: "402A",
  age: 67,
  sex: "Female",
  status: "Stable",
  careTeam: [
    { initials: "SN", name: "S. Nguyen, RN", role: "Primary nurse", photo: true, bg: "#d4a847", presence: "active" as const },
    { initials: "AP", name: "A. Patel, MD", role: "Attending", photo: true, bg: "#2563eb" },
    { initials: "MJ", name: "M. Johnson, RN", role: "Charge nurse", photo: true, bg: "#92400e" },
    { initials: "JD", name: "J. Davis, PT", role: "Physical therapy", bg: "#7c2d12" },
    { initials: "LK", name: "L. Kim, PharmD", role: "Pharmacy", bg: "#0e7c66" },
  ],
  summary: {
    allergies: "Penicillin (rash)",
    mobility: "1 assist w/ walker",
    language: "English",
    codeStatus: "Full code",
    notes: "Lives with spouse. Prefers morning updates.",
  },
  reports: [
    { time: "9:28 AM", icon: "clipboard" as const, title: "Discharge planning updated", by: "T. Anderson, RN", tag: "Care Plan" as const },
    { time: "8:45 AM", icon: "chat" as const, title: "New message in #4E Nurses", by: "S. Nguyen, RN", tag: "Chat" as const },
    { time: "7:10 AM", icon: "flask" as const, title: "Lab result critical: K+ 2.9", by: "A. Patel, MD (Attending)", tag: "Lab" as const },
    { time: "6:32 AM", icon: "check" as const, title: "Medication given: Oxycodone 5mg", by: "L. Martinez, RN (508B)", tag: "MAR" as const },
  ],
  handoff: {
    activePlan: [
      { title: "Pain management", note: "Oxycodone 5mg q6h PRN" },
      { title: "DVT prophylaxis", note: "Enoxaparin 40mg daily" },
      { title: "IV antibiotics", note: "Cefazolin 1g q8h" },
      { title: "Discharge planning", note: "Target: Apr 30" },
    ],
    upcoming: [
      { time: "10:00 AM", title: "Pain reassessment", who: "L. Martinez, RN (508B)" },
      { time: "11:00 AM", title: "Discharge meds to bedside", who: "T. Anderson, RN (210A)" },
      { time: "12:00 PM", title: "IV due for change", who: "J. Williams, RN (607B)" },
    ],
    totalTasks: 5,
  },
  vitals: {
    time: "9:36 AM",
    items: [
      { label: "BP", value: "118/76", unit: "mmHg", tone: "neutral" as const },
      { label: "HR", value: "78", unit: "bpm", tone: "green" as const },
      { label: "Temp", value: "98.6", unit: "F", tone: "yellow" as const },
      { label: "SpO2", value: "96%", unit: "RA", tone: "blue" as const },
      { label: "Resp", value: "18", unit: "rpm", tone: "neutral" as const },
      { label: "Pain", value: "3/10", unit: "Numeric", tone: "purple" as const },
    ],
  },
  labs: {
    time: "9:10 AM",
    items: [
      { name: "WBC", value: "7.4", unit: "K/uL", trend: "flat" as const },
      { name: "Hgb", value: "8.6", unit: "g/dL", trend: "up" as const, tone: "red" as const },
      { name: "Hct", value: "26.1", unit: "%", trend: "down" as const, tone: "red" as const },
      { name: "Na", value: "137", unit: "mmol/L", trend: "flat" as const },
      { name: "K+", value: "2.9", unit: "mmol/L", trend: "down" as const, tone: "red" as const },
      { name: "Cr", value: "0.8", unit: "mg/dL", trend: "flat" as const },
    ],
  },
  medications: {
    nextDueLabel: "Next due",
    name: "Oxycodone 5mg",
    detail: "PRN q6h for pain",
    chip: "PRN",
    availableLabel: "Available",
    nextEligible: "Next eligible 11:30 AM",
  },
  io: {
    intake: "980",
    output: "750",
    net: "+230",
    unit: "mL",
  },
};

// ---------- Chat detail Room 311 (image 10) ----------------------------

export const M_CHAT_311 = {
  header: {
    title: "Room 311 — Robert Johnson",
    subtitle: "Room 311  -  Med Surg  -  Inpatient  -  MRN 854321",
    participants: 6,
  },
  messages: [
    {
      author: "S. Nguyen, RN",
      initials: "SN",
      role: "Nurse",
      roleTone: "purple" as const,
      bg: "#6b46c1",
      time: "9:15 AM",
      body: "Morning team. Robert c/o increased SOB overnight. Currently on 3L NC, SpO2 92%. Lung sounds diminished bilaterally. Will continue to monitor.",
      chips: [
        { label: "SOB - Increased", tone: "red" as const, alert: true },
        { label: "SpO2 92% on 3L NC", tone: "neutral" as const },
      ],
    },
    {
      author: "A. Patel, MD",
      initials: "AP",
      role: "Hospitalist",
      roleTone: "red" as const,
      bg: "#7c2d12",
      time: "9:18 AM",
      body: "Thanks for the update. Let's get a CXR and ABG. I'll round in ~30 mins.",
      attachment: { name: "CXR Order", kind: "PDF" },
    },
    {
      author: "Pharmacy",
      icon: "mortar" as const,
      role: "Pharmacy",
      roleTone: "green" as const,
      bg: "#0e7c66",
      time: "9:24 AM",
      body: "FYI – Vancomycin trough due before 4th dose. Next dose scheduled for 12:00 PM.",
    },
    {
      author: "Lab",
      icon: "flask" as const,
      role: "Lab",
      roleTone: "purple" as const,
      bg: "#6b46c1",
      time: "9:28 AM",
      body: "New result available.",
      labCard: {
        name: "WBC",
        collected: "Collected 9:22 AM",
        value: "14.8 K/uL",
        trend: "up" as const,
      },
    },
    {
      author: "Resp Therapy",
      icon: "lungs" as const,
      role: "Resp Therapy",
      roleTone: "blue" as const,
      bg: "#1e40af",
      time: "9:31 AM",
      body: "Placed on incentive spirometry. Tolerating well. Will recheck in 2 hrs.",
    },
    { kind: "divider" as const, label: "Unread messages" },
    {
      author: "S. Nguyen, RN",
      initials: "SN",
      role: "Nurse",
      roleTone: "purple" as const,
      bg: "#6b46c1",
      time: "9:39 AM",
      body: "ABG resulted. See attached.",
      attachment: { name: "ABG Result", kind: "PDF" },
    },
  ],
  snapshot: {
    allergy: "Penicillin (rash)",
    codeStatus: "Full code",
    isolation: "None",
    careTeam: ["AP", "SN", "JM", "DK"],
    careTeamCount: 6,
    careTeamExtra: 2,
    currentTasks: [
      { tone: "high" as const, name: "CXR", due: "Due 9:45 AM" },
      { tone: "med" as const, name: "ABG", due: "Due 9:50 AM" },
      { tone: "med" as const, name: "Vanco trough", due: "Due 11:30 AM" },
    ],
  },
  alerts: {
    med: { name: "Vancomycin trough due", note: "Before 4th dose" },
    lab: { name: "WBC 14.8 K/uL", note: "Collected 9:22 AM" },
  },
};

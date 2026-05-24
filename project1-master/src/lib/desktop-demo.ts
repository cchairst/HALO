// Static visual fixtures for the new desktop UI. The mockups show data the
// schema doesn't model yet (vitals, labs, I&O, MRN, code status, handoff
// counts, etc.) — until those land, every desktop screen reads from this
// module so the chrome matches the design 1:1.

export type Severity = "high" | "med" | "low" | "critical" | "stable" | "unstable" | "watch";

// ---------- sidebar -----------------------------------------------------

export type SidebarUnread = number | null;

export type SidebarPinned = {
  id: string;
  label: string;
  unread: SidebarUnread;
  time: string;
};

export const SIDEBAR_PINNED: SidebarPinned[] = [
  { id: "ed-handoff", label: "ED Handoff", unread: 12, time: "3m" },
  { id: "icu-updates", label: "ICU Updates", unread: 8, time: "1m" },
  { id: "charge-nurse", label: "Charge Nurse", unread: 2, time: "2m" },
];

export type SidebarChat = {
  id: string;
  name: string;
  presence?: "active" | "idle" | "none";
  preview: string;
  time: string;
  unread?: number;
  highlight?: boolean;
};

export const SIDEBAR_ACTIVE: SidebarChat[] = [
  {
    id: "margaret-chen",
    name: "Margaret Chen",
    presence: "active",
    preview: "You: Labs look good",
    time: "1m",
  },
  {
    id: "room-214",
    name: "Room 214 - M. Chen",
    preview: "Becky: Meds given",
    time: "2m",
    unread: 2,
  },
  {
    id: "icu-team",
    name: "ICU Team",
    preview: "Dawson: Headed in",
    time: "3m",
    unread: 4,
  },
  {
    id: "room-311",
    name: "Room 311 - R. Johnson",
    preview: "Tiffany: PT scheduled",
    time: "5m",
    unread: 3,
    highlight: true,
  },
  {
    id: "care-management",
    name: "Care Management",
    preview: "You: Thanks!",
    time: "7m",
  },
  {
    id: "dr-patel",
    name: "Dr. Patel",
    preview: "You: See you at rounds",
    time: "9m",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    preview: "New: 2 updates",
    time: "12m",
    unread: 2,
  },
];

export const SIDEBAR_RECENT_PATIENT_THREADS: { id: string; label: string; time: string }[] = [
  { id: "room-402", label: "Room 402 - A. Williams", time: "1h" },
  { id: "room-205", label: "Room 205 - L. Garcia", time: "2h" },
  { id: "room-118", label: "Room 118 - J. Smith", time: "3h" },
  { id: "room-507", label: "Room 507 - T. Brown", time: "4h" },
  { id: "room-233", label: "Room 233 - K. Lee", time: "5h" },
];

// Recent patients list — drives the patient-chart sidebar where the second
// column is a patient-centric list rather than chat-centric.
export type SidebarPatient = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  presence?: "active" | "idle" | "none";
  time: string;
  unread?: number;
  highlight?: boolean;
};

export const SIDEBAR_RECENT_PATIENTS: SidebarPatient[] = [
  {
    id: "margaret-chen",
    initials: "MC",
    name: "Margaret Chen",
    detail: "Room 214  -  53F",
    presence: "active",
    time: "Now",
    highlight: true,
  },
  {
    id: "robert-johnson",
    initials: "RJ",
    name: "Robert Johnson",
    detail: "Room 311  -  68M",
    presence: "active",
    time: "1m",
  },
  {
    id: "angela-williams",
    initials: "AW",
    name: "Angela Williams",
    detail: "Room 40F  -  72F",
    presence: "idle",
    time: "2m",
  },
  {
    id: "james-smith",
    initials: "JS",
    name: "James Smith",
    detail: "Room 318  -  61M",
    presence: "active",
    time: "3m",
  },
  {
    id: "luis-garcia",
    initials: "LG",
    name: "Luis Garcia",
    detail: "Room 205  -  49M",
    presence: "active",
    time: "5m",
  },
  {
    id: "tina-brown",
    initials: "TB",
    name: "Tina Brown",
    detail: "Room 40F  -  56F",
    presence: "active",
    time: "7m",
  },
  {
    id: "dr-patel",
    initials: "DP",
    name: "Dr. Patel",
    detail: "You: See you at rounds",
    time: "9m",
  },
  {
    id: "icu-updates",
    initials: "CU",
    name: "ICU Updates",
    detail: "Dawson: Heads up on 205",
    time: "12m",
    unread: 1,
  },
  {
    id: "charge-nurse",
    initials: "CN",
    name: "Charge Nurse",
    detail: "Becky: Need help in 118",
    time: "15m",
  },
  {
    id: "care-management",
    initials: "CM",
    name: "Care Management",
    detail: "Room 402 discharge",
    time: "18m",
  },
  {
    id: "pharmacy",
    initials: "P",
    name: "Pharmacy",
    detail: "New: 2 updates",
    time: "22m",
    unread: 2,
  },
  {
    id: "room-233",
    initials: "",
    name: "Room 233 - K. Lee",
    detail: "",
    time: "45m",
  },
  {
    id: "room-118",
    initials: "",
    name: "Room 118 - J. Smith",
    detail: "",
    time: "1h",
  },
];

// ---------- top bar / alerts --------------------------------------------

export const TOP_BAR = {
  onShift: true,
  time: "7:42 AM",
  alerts: 5,
};

// ---------- Shift Hub (image 7) ----------------------------------------

export const SHIFT_HUB = {
  subtitle: "Friday, May 30  -  Day Shift (7a - 7p)",
  handoff: {
    direction: "Night  ->  Day",
    started: "Started 6:45 AM by Night Charge",
    highlighted: "6 updates",
    patients: "4 critical, 6 watch",
    endsIn: "Ends in 1h 18m",
  },
  stats: [
    { label: "Open chats", value: "18", delta: "6 since yesterday", deltaTone: "up" as const },
    { label: "Urgent updates", value: "7", delta: "2 critical", deltaTone: "critical" as const },
    { label: "Unresolved reports", value: "11", delta: "3 new", deltaTone: "up" as const },
    { label: "Active patients", value: "34", delta: "5 since yesterday", deltaTone: "up" as const },
    { label: "Beds occupied", value: "89%", delta: "161 / 180", deltaTone: "neutral" as const },
    { label: "Follow-ups due", value: "14", delta: "Overdue: 3", deltaTone: "critical" as const },
  ],
  priorityPatients: [
    { name: "Margaret Chen", room: "214", risk: "high", status: "Post-op Day 1", updated: "2m" },
    { name: "Robert Johnson", room: "311", risk: "high", status: "Unstable", updated: "4m" },
    { name: "Angela Williams", room: "40F", risk: "med", status: "Watch", updated: "7m" },
    { name: "James Smith", room: "318", risk: "med", status: "DFU", updated: "9m" },
    { name: "Luis Garcia", room: "205", risk: "med", status: "Pain mgt", updated: "12m" },
    { name: "Tina Brown", room: "44F", risk: "low", status: "Stable", updated: "18m" },
  ],
  liveFeed: [
    { time: "7:40 AM", icon: "chat", title: "meds given to M. Chen (214)", by: "Becky Valentine" },
    { time: "7:38 AM", icon: "alert", title: "New lab result: Troponin", by: "R. Johnson (311)" },
    { time: "7:36 AM", icon: "stethoscope", title: "Pain score 8/10", by: "L. Garcia (205)" },
    { time: "7:32 AM", icon: "calendar", title: "PT scheduled", by: "R. Johnson (311)" },
    { time: "7:31 AM", icon: "syringe", title: "New order placed", by: "A. Williams (402)" },
    { time: "7:30 AM", icon: "clipboard", title: "Discharge plan updated", by: "K. Lee (233)" },
    { time: "7:26 AM", icon: "alert", title: "Vitals out of range", by: "J. Smith (118)", chip: "BP 168/96" },
    { time: "7:24 AM", icon: "users", title: "Family updated at bedside", by: "T. Brown (507)" },
  ],
  handoffNotes: [
    {
      time: "6:45 AM",
      headline: "M. Chen (214) - Post-op day 1. VSS. Pain well controlled.",
      by: "Night Charge",
    },
    {
      time: "6:43 AM",
      headline: "R. Johnson (311) - BP soft overnight, fluids running.",
      by: "Night Charge",
    },
    {
      time: "6:41 AM",
      headline: "4 new admissions from ED. See list.",
      by: "Night Charge",
    },
  ],
  teamCoverage: [
    { role: "Charge Nurse", who: "Becky V.", status: "On unit" as const },
    { role: "Hospitalist", who: "Dr. Patel", status: "On unit" as const },
    { role: "ICU", who: "Dr. Dawson", status: "On unit" as const },
    { role: "Pharmacy", who: "M. Lewis, PharmD", status: "On unit" as const },
    { role: "Respiratory", who: "J. Kim, RRT", status: "On unit" as const },
    { role: "Care Mgmt", who: "S. Miller, RN", status: "Remote" as const },
  ],
  upcomingTasks: {
    tasks: 14,
    meds: 9,
    rounds: 6,
    items: [
      { time: "8:00 AM", title: "Rounds - 2 West", who: "Dr. Patel" },
      { time: "8:15 AM", title: "Med pass - Room 214", who: "Becky V." },
      { time: "9:00 AM", title: "Wound care - Room 118", who: "Tiffany H." },
      { time: "9:30 AM", title: "Family meeting - Room 402", who: "Care Mgmt" },
      { time: "10:00 AM", title: "PT - Room 311", who: "PT Team" },
    ],
  },
  unresolved: [
    { label: "Lab: Troponin - R. Johnson (311)", severity: "high" as Severity, due: "Due 30m", icon: "flask" },
    { label: "Discharge summary - A. Williams (402)", severity: "med" as Severity, due: "Due 2h", icon: "clipboard" },
    { label: "Case mgmt follow-up - L. Garcia (205)", severity: "med" as Severity, due: "Due 3h", icon: "loop" },
    { label: "PT eval - J. Smith (118)", severity: "low" as Severity, due: "Due 5h", icon: "loop" },
    { label: "Dietitian consult - T. Brown (507)", severity: "low" as Severity, due: "Due 6h", icon: "loop" },
  ],
  recentChats: [
    { name: "ICU Updates", preview: "Dawson: Vent change for 208", time: "1m", unread: 3 },
    { name: "Charge Nurse", preview: "Becky: Need help in 311", time: "2m", unread: 2 },
    { name: "Room 214 - M. Chen", preview: "You: Labs look good", time: "3m" },
    { name: "Pharmacy", preview: "Megan: 2 meds out of stock", time: "6m", unread: 1 },
    { name: "Care Management", preview: "Sarah: Dispo update for 402", time: "9m" },
  ],
};

// ---------- Catch Up (image 5) -----------------------------------------

export const CATCH_UP = {
  blurb: "Shift intelligence: everything you need to stay current and act.",
  stats: [
    { label: "Active threads", value: "18", delta: "4 vs yesterday", tone: "up" as const, icon: "chats" },
    { label: "Urgent updates", value: "7", delta: "2 critical", tone: "critical" as const, icon: "spark" },
    { label: "Follow-ups due", value: "14", delta: "6 vs yesterday", tone: "up" as const, icon: "clock" },
    { label: "Unresolved items", value: "11", delta: "3 high - 5 med - 3 low", tone: "neutral" as const, icon: "clipboard" },
    { label: "Needing attention", value: "34", delta: "5 since yesterday", tone: "up" as const, icon: "users" },
  ],
  handoff: { endsIn: "Ends in 1h 18m" },
  recentActivity: [
    { time: "7:40 AM", severity: "high" as Severity, title: "M. Chen (214) - Post-op day 1, VSS. Pain well controlled.", by: "Nigi T - Charge", room: "Room 214" },
    { time: "7:38 AM", severity: "stable" as Severity, title: "New lab result: Troponin", by: "R. Johnson (311)", room: "Room 311" },
    { time: "7:36 AM", severity: "watch" as Severity, title: "Case mgmt follow-up - L. Garcia (205)", by: "T. Brown - Case Mgmt", room: "Room 205" },
    { time: "7:32 AM", severity: "low" as Severity, title: "PT scheduled", by: "R. Johnson (311)", room: "Room 311" },
    { time: "7:31 AM", severity: "stable" as Severity, title: "New order placed: IV fluids (2L)", by: "A. Williams (402)", room: "Room 402" },
    { time: "7:30 AM", severity: "stable" as Severity, title: "Discharge plan updated", by: "L. Lee (233)", room: "Room 233" },
    { time: "7:26 AM", severity: "watch" as Severity, title: "Vitals out of range", by: "J. Smith (118)", room: "Room 118", chip: "BP 168/96" },
    { time: "7:24 AM", severity: "low" as Severity, title: "Family updated at bedside", by: "T. Brown (507)", room: "Room 507" },
    { time: "7:20 AM", severity: "low" as Severity, title: "Dietitian consult", by: "T. Brown (507)", room: "Room 507" },
    { time: "7:18 AM", severity: "high" as Severity, title: "Critical lab: K+ 2.8", by: "A. Williams (402)", room: "Room 402" },
  ],
  unresolved: [
    {
      severity: "high" as Severity,
      title: "Post-op day 1 follow-up",
      patient: "M. Chen (214)",
      due: "Due 30m",
      role: "Higb",
      detail: "Nigi T - Charge",
      action: "Pain reassessment + PT plan",
      room: "Room 214",
    },
    {
      severity: "high" as Severity,
      title: "Unstable vitals",
      patient: "R. Johnson (311)",
      due: "Due 45m",
      role: "Higb",
      detail: "Becky V - RN",
      action: "Trend BP + notify provider",
      room: "Room 311",
    },
    {
      severity: "high" as Severity,
      title: "Critical lab: K+ 2.8",
      patient: "A. Williams (402)",
      due: "Due 1h",
      role: "Higb",
      detail: "Dr. Patel - Hospitalist",
      action: "Order replacement + recheck",
      room: "Room 402",
    },
  ],
  needingAttention: [
    { severity: "high" as Severity, count: 11, label: "R. Johnson (311)", note: "Unstable vitals", room: "Room 311" },
    { severity: "high" as Severity, count: 7, label: "A. Williams (402)", note: "K+ 2.8", room: "Room 402" },
    { severity: "med" as Severity, count: 6, label: "M. Chen (214)", note: "Post-op day 1", room: "Room 214" },
    { severity: "med" as Severity, count: 5, label: "J. Smith (118)", note: "BP 168/96", room: "Room 118" },
    { severity: "low" as Severity, count: 5, label: "L. Garcia (205)", note: "Case mgmt follow-up", room: "Room 205" },
  ],
  followUps: {
    all: 14,
    mine: 8,
    team: 6,
    items: [
      { due: "Due 30m", severity: "high" as Severity, title: "Post-op follow-up", patient: "M. Chen (214)", by: "Nigi T - Charge", room: "Room 214" },
      { due: "Due 45m", severity: "high" as Severity, title: "Trend vitals + notify", patient: "R. Johnson (311)", by: "Becky V - RN", room: "Room 311" },
      { due: "Due 1h", severity: "med" as Severity, title: "Discharge plan review", patient: "L. Lee (233)", by: "J. Kim - Case Mgmt", room: "Room 233" },
    ],
  },
  recentThreads: [
    { name: "ICU Updates", preview: "Dawson: Vent change for 208", time: "2m", unread: 3 },
    { name: "Charge Nurse", preview: "Becky: Need help in 311", time: "2m", unread: 2 },
    { name: "Room 214 - M. Chen", preview: "You: Labs look good", time: "3m", unread: 1 },
    { name: "Pharmacy", preview: "Reyes: 2 meds out of stock", time: "6m", unread: 1 },
    { name: "Case Management", preview: "Sarah: Dispo update for 402", time: "9m" },
  ],
};

// ---------- Care teams (image 4) ---------------------------------------

export const CARE_TEAMS = {
  blurb: "Manage patients and their care teams in one place.",
  patientCount: 12,
  patients: [
    {
      initials: "MC",
      name: "Margaret Chen",
      age: 78,
      sex: "F",
      status: ["High", "Critical"],
      room: "214",
      facility: "4 North",
      team: ["BV", "DP", "ML"],
      teamExtra: 2,
      unreadReports: 2,
      updated: "7m ago",
    },
    {
      initials: "RJ",
      name: "Robert Johnson",
      age: 68,
      sex: "M",
      status: ["High", "Unstable"],
      room: "311",
      facility: "ICU",
      team: ["RJ", "ST"],
      teamExtra: 1,
      unreadReports: 1,
      updated: "18m ago",
    },
    {
      initials: "AW",
      name: "Angela Williams",
      age: 64,
      sex: "F",
      status: ["Med", "Watch"],
      room: "402",
      facility: "4 North",
      team: ["BV", "ML"],
      teamExtra: 2,
      unreadReports: 0,
      updated: "32m ago",
    },
    {
      initials: "JS",
      name: "James Smith",
      age: 51,
      sex: "M",
      status: ["Med", "Stable"],
      room: "318",
      facility: "4 South",
      team: ["DP", "ST"],
      teamExtra: 0,
      unreadReports: 0,
      updated: "1h ago",
    },
    {
      initials: "LG",
      name: "Luis Garcia",
      age: 58,
      sex: "M",
      status: ["Med", "Stable"],
      room: "205",
      facility: "3 West",
      team: ["BV"],
      teamExtra: 1,
      unreadReports: 1,
      updated: "1h ago",
    },
    {
      initials: "TB",
      name: "Tina Brown",
      age: 40,
      sex: "F",
      status: ["Low", "Stable"],
      room: "401",
      facility: "4 North",
      team: ["ML"],
      teamExtra: 0,
      unreadReports: 0,
      updated: "2h ago",
    },
  ],
  commonRoles: [
    { name: "Attending", scope: "Full access" },
    { name: "Charge Nurse", scope: "Care & updates" },
    { name: "Resident", scope: "Care & updates" },
    { name: "Pharmacist", scope: "Meds & notes" },
    { name: "Case Mgmt", scope: "Care & discharge" },
  ],
};

// ---------- Patient chart (image 3) ------------------------------------

export const MARGARET_CHART = {
  name: "Margaret Chen",
  room: "Room 214",
  unit: "Medical",
  bed: "Bed 1",
  demographics: "53F",
  mrn: "MRN 872341",
  admit: "Admit 05/28/25 (6d)",
  attending: "Attending: R. Johnson, MD",
  onUnit: true,
  careTeam: [
    { initials: "RJ", name: "R. Johnson, MD", role: "Attending", dot: "active" as const },
    { initials: "BC", name: "Becky V., RN", role: "Primary RN", dot: "active" as const },
    { initials: "DP", name: "Dr. Patel", role: "Hospitalist", dot: "active" as const },
    { initials: "SM", name: "S. Miller, RN", role: "Charge Nurse", dot: "active" as const },
    { initials: "LM", name: "L. Lewis, PharmD", role: "Pharmacy", dot: "active" as const },
    { initials: "PC", name: "P. Chen, PT", role: "Physical Therapy", dot: "active" as const },
  ],
  summary: {
    allergies: ["Penicillin (rash)", "Shellfish (anaphylaxis)"],
    mobility: "Up with assist x1",
    language: "English",
    diet: "Regular",
    codeStatus: "Full Code",
    isolation: "Contact - MRSA",
    notes: [
      "Lives with spouse. Daughter Sarah is DPOA.",
      "Prefers morning updates.",
      "Hearing aids at bedside.",
    ],
  },
  clinical: {
    primaryDx: "Pneumonia, unspecified",
    admitReason: "SOB, fever, cough",
    comorbidities: "COPD, HTN, Type 2 DM",
    fallRisk: "High",
  },
  recentReports: [
    {
      group: "Today",
      items: [
        { time: "6:45 AM", title: "RN Shift Report", by: "Becky V., RN", tag: "New" as const },
        { time: "1:30 AM", title: "Provider Progress Note", by: "R. Johnson, MD" },
      ],
    },
    {
      group: "Yesterday",
      items: [
        { time: "7:20 PM", title: "RN Shift Report", by: "S. Miller, RN" },
        { time: "2:15 PM", title: "Respiratory Therapy Note", by: "M. Lewis, RRT" },
        { time: "8:05 AM", title: "Physical Therapy Note", by: "P. Chen, PT" },
      ],
    },
    {
      group: "May 28",
      items: [
        { time: "11:10 PM", title: "ED Provider Note", by: "A. Williams, MD" },
        { time: "9:40 PM", title: "ED Triage Note", by: "J. Thompson, RN" },
      ],
    },
  ],
  handoff: {
    updated: "Updated 6:45 AM",
    planOfCare: [
      { title: "IV ceftriaxone q24h (Day 4/7)", note: "Next due: 8:00 AM" },
      { title: "Wean O2 as tolerated", note: "Target SpO2 >= 92%" },
      { title: "Encourage IS & ambulation", note: "Q2h while awake" },
      { title: "Daily labs", note: "CBC, BMP" },
      { title: "Discharge planning", note: "Anticipated 2-3 days" },
    ],
    upcoming: [
      { time: "8:00 AM", title: "Ceftriaxone 2 g IV", tag: "Med" },
      { time: "9:00 AM", title: "Chest X-ray", tag: "Imaging" },
      { time: "10:00 AM", title: "PT - Treatment", tag: "Therapy" },
    ],
    keyPoints: [
      "Watch for worsening O2 needs or fever.",
      "Creatinine trending up - monitor.",
      "Daughter requesting family meeting tomorrow.",
    ],
    editedBy: "Edited 6:45 AM by Becky V., RN",
  },
  vitals: [
    { label: "BP", value: "124/68", unit: "mmHg", time: "6:30 AM", trend: "stable" as const },
    { label: "HR", value: "88", unit: "bpm", time: "6:30 AM", trend: "stable" as const },
    { label: "Temp", value: "99.1", unit: "F", time: "6:15 AM", trend: "watch" as const },
    { label: "SpO2", value: "94%", unit: "2 L NC", time: "6:30 AM", trend: "stable" as const },
    { label: "Resp", value: "18", unit: "rpm", time: "6:30 AM", trend: "stable" as const },
    { label: "Pain", value: "3/10", unit: "", time: "6:30 AM", trend: "stable" as const },
  ],
  labs: [
    { name: "WBC", value: "10.2", unit: "K/µL", time: "May 30 5:10 AM", trend: "down" as const },
    { name: "Hgb", value: "11.2", unit: "g/dL", time: "May 30 5:10 AM", trend: "up" as const },
    { name: "Na", value: "136", unit: "mmol/L", time: "May 30 5:10 AM", trend: "up" as const },
    { name: "K", value: "3.8", unit: "mmol/L", time: "May 30 5:10 AM", trend: "flat" as const },
    { name: "Creat", value: "1.2", unit: "mg/dL", time: "May 30 5:10 AM", trend: "up" as const },
  ],
  medications: [
    { time: "8:00 AM", name: "Ceftriaxone 2 g IV", route: "q24h", tag: "Antibiotic", due: "Due soon" },
    { time: "9:00 AM", name: "Acetaminophen 650 mg PO", route: "q6h PRN", tag: "Pain / Fever", due: "Due soon" },
    { time: "12:00 PM", name: "Enoxaparin 40 mg SC", route: "q24h", tag: "DVT Prophylaxis", due: "In 4h" },
  ],
  io: {
    intake: "1,240",
    intakeUnit: "mL",
    output: "980",
    outputUnit: "mL",
    netValue: "+260",
    netUnit: "mL",
    lastVoid: "6:20 AM",
    bm: "May 29, 8:10 PM",
  },
};

// ---------- Chat detail (image 6, Room 311) ----------------------------

export const CHAT_311 = {
  patient: {
    name: "Robert Johnson",
    mrn: "MRN 23145678",
    age: "67M",
    room: "Room 311 / 1",
    unit: "Med Surg",
    status: "Stable",
    attending: "Dr. Patel",
    codeStatus: "Full Code",
    allergies: "Penicillin (Rash)",
  },
  header: {
    title: "Room 311 - Robert Johnson",
    subtitle: "67M - MRN - 23145678",
    participants: 7,
    location: "Room 311",
    locationDetail: "Med Surg",
  },
  tabs: { messages: true, tasks: 3, files: 2 },
  messages: [
    {
      kind: "system" as const,
      time: "7:28 AM",
      body: "Tiffany Brown, RN  added Becky V.",
    },
    {
      kind: "msg" as const,
      author: "Tiffany Brown, RN",
      role: "Primary RN",
      time: "7:29 AM",
      body: "Good morning team. Mr. Johnson is scheduled for PT at 10:00. Please ensure pain meds are given 30 min prior.",
    },
    {
      kind: "msg" as const,
      author: "Becky Valentine, RN",
      role: "",
      time: "7:30 AM",
      body: "Will do. Last dose of oxycodone given at 7:15 AM.",
    },
    {
      kind: "msg" as const,
      author: "Dr. Lewis, Hospitalist",
      role: "Hospitalist",
      time: "7:31 AM",
      body:
        "Rounded at 7:30 AM. Lungs clear, abd soft. Plan to wean O2 today.\nSee note for full details.",
      attachment: { name: "Progress Note - 5/30", kind: "PDF" },
    },
    {
      kind: "divider" as const,
      time: "7:36 AM",
      label: "Unread messages 3",
    },
    {
      kind: "system" as const,
      time: "7:36 AM",
      icon: "users" as const,
      body: "Pharmacy",
      note: "New med order: Enoxaparin 40 mg SQ daily at 0900.",
    },
    {
      kind: "system" as const,
      time: "7:37 AM",
      icon: "flask" as const,
      body: "Lab Results",
      note: "Hgb 10.2 (low) from 5/30 06:15",
      action: "View results",
    },
    {
      kind: "system" as const,
      time: "7:38 AM",
      icon: "wind" as const,
      body: "Respiratory Therapy",
      note: "Weaned to 1L NC. SpO2 96%. Tolerating well.",
    },
  ],
  rightRail: {
    careTeam: [
      { initials: "TB", name: "Tiffany B.", role: "RN" },
      { initials: "BV", name: "Becky V.", role: "RN" },
      { initials: "DR", name: "Dr. Lewis", role: "Hospitalist" },
      { initials: "DP", name: "Dr. Patel", role: "Attending" },
    ],
    careTeamExtra: 3,
    currentTasks: [
      { title: "Administer Lovenox 40 mg", time: "9:00 AM", due: "Due in 1h 18m" },
      { title: "PT - Mobility session", time: "10:00 AM", due: "Due in 2h 18m" },
      { title: "Daily weight", time: "11:00 AM", due: "Due in 3h 18m" },
    ],
    alerts: [
      { name: "Hgb 10.2 (low)", time: "5/30 06:15", severity: "high" as Severity },
      { name: "K+ 3.2 (low)", time: "5/30 06:15", severity: "high" as Severity },
    ],
  },
};

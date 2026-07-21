import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  MessageSquare,
  CalendarDays,
  FileText,
  ChartLine,
  Settings,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  ChevronsUpDown,
  ChevronLeft,
  X,
  ExternalLink,
  Phone,
  PhoneCall,
  Mail,
  Thermometer,
  HeartPulse,
  Droplets,
  Weight,
  Ruler,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { initialsOf } from "../lib/format.js";

/*
  Hospital staff view: patient list + patient chart side panel.
  The backend does not yet expose hospital-side endpoints ("list my hospital's
  patients", "patient chart") — Backend/src/routes only covers auth and a
  patient's OWN profile/dashboard, and no Hospital<->Patient relationship
  model exists yet. Until that lands, this screen renders local mock data.
  Nothing here should be mistaken for live data.
*/

const TABS = [
  { key: "all", label: "All Patients", count: 120 },
  { key: "current", label: "Current Patients", count: 80 },
  { key: "new", label: "New Patients", count: 20 },
  { key: "discharged", label: "Discharged Patients", count: 40 },
  { key: "priority", label: "High Priority", count: 10 },
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];

const PATIENTS = [
  {
    id: "ralph-edwards",
    name: "Ralph Edwards",
    age: 35,
    gender: "Male",
    genderShort: "M",
    reason: "Wrist Fracture Surgery",
    tag: "Surgery Required",
    scheduleDate: "Tue, 19 Mar 2024",
    scheduleTime: "3:00 PM",
    phone: "+1 212 456 7890",
    email: "ralphed@gmail.com",
    physician: "Dr. Daniel McAdams",
    emergencyContact: { name: "Gia Edwards", relation: "Spouse", phone: "+1 212 456 2345" },
    vitals: {
      bloodPressure: "132/87 mm Hg",
      weight: "74 Kg",
      temperature: "100.4 °F",
      heartRate: "82.79 bpm",
      oxygenSaturation: "96%",
      height: "5.10 inch",
    },
  },
  {
    id: "john-smith",
    name: "John Smith",
    age: 37,
    gender: "Male",
    genderShort: "M",
    reason: "Hypertension and Asthma",
    tag: "Follow-up",
    scheduleDate: "Mon, 18 Mar 2024",
    scheduleTime: "2:00 PM",
    phone: "+1 212 555 0148",
    email: "john.smith@gmail.com",
    physician: "Dr. Daniel McAdams",
    emergencyContact: { name: "Alice Smith", relation: "Spouse", phone: "+1 212 555 0192" },
    vitals: {
      bloodPressure: "138/90 mm Hg",
      weight: "82 Kg",
      temperature: "98.6 °F",
      heartRate: "76 bpm",
      oxygenSaturation: "97%",
      height: "5.9 inch",
    },
  },
  {
    id: "robert-brown",
    name: "Robert Brown",
    age: 87,
    gender: "Male",
    genderShort: "M",
    reason: "Diagnosis Test for Diabetes Type 2",
    tag: "Routine",
    scheduleDate: "Sat, 16 Mar 2024",
    scheduleTime: "11:00 AM",
    phone: "+1 212 555 0173",
    email: "robert.brown@gmail.com",
    physician: "Dr. Elena Ruiz",
    emergencyContact: { name: "Susan Brown", relation: "Daughter", phone: "+1 212 555 0164" },
    vitals: {
      bloodPressure: "145/92 mm Hg",
      weight: "68 Kg",
      temperature: "98.2 °F",
      heartRate: "88 bpm",
      oxygenSaturation: "95%",
      height: "5.7 inch",
    },
  },
  {
    id: "mary-jones",
    name: "Mary Jones",
    age: 40,
    gender: "Female",
    genderShort: "F",
    reason: "Kidney Stone",
    tag: "Pain Management",
    scheduleDate: "Fri, 15 Mar 2024",
    scheduleTime: "7:00 PM",
    phone: "+1 212 555 0110",
    email: "mary.jones@gmail.com",
    physician: "Dr. Elena Ruiz",
    emergencyContact: { name: "Tom Jones", relation: "Spouse", phone: "+1 212 555 0121" },
    vitals: {
      bloodPressure: "128/84 mm Hg",
      weight: "63 Kg",
      temperature: "99.1 °F",
      heartRate: "90 bpm",
      oxygenSaturation: "98%",
      height: "5.4 inch",
    },
  },
  {
    id: "william-taylor",
    name: "William Taylor",
    age: 28,
    gender: "Male",
    genderShort: "M",
    reason: "Hand Fracture",
    tag: "Surgery Required",
    scheduleDate: "Mon, 11 Mar 2024",
    scheduleTime: "8:00 PM",
    phone: "+1 212 555 0135",
    email: "william.taylor@gmail.com",
    physician: "Dr. Daniel McAdams",
    emergencyContact: { name: "Nora Taylor", relation: "Sister", phone: "+1 212 555 0146" },
    vitals: {
      bloodPressure: "121/79 mm Hg",
      weight: "79 Kg",
      temperature: "98.4 °F",
      heartRate: "72 bpm",
      oxygenSaturation: "99%",
      height: "5.11 inch",
    },
  },
  {
    id: "charles-brown",
    name: "Charles Brown",
    age: 32,
    gender: "Male",
    genderShort: "M",
    reason: "Hypertension and Asthma",
    tag: "Follow-up",
    scheduleDate: "Fri, 8 Mar 2024",
    scheduleTime: "2:00 PM",
    phone: "+1 212 555 0157",
    email: "charles.brown@gmail.com",
    physician: "Dr. Elena Ruiz",
    emergencyContact: { name: "Diane Brown", relation: "Spouse", phone: "+1 212 555 0168" },
    vitals: {
      bloodPressure: "134/88 mm Hg",
      weight: "88 Kg",
      temperature: "98.7 °F",
      heartRate: "80 bpm",
      oxygenSaturation: "96%",
      height: "5.10 inch",
    },
  },
  {
    id: "kim-dowry",
    name: "Kim Dowry",
    age: 48,
    gender: "Female",
    genderShort: "F",
    reason: "Diagnosis Test for Diabetes Type 1",
    tag: "Routine",
    scheduleDate: "Wed, 6 Mar 2024",
    scheduleTime: "3:00 PM",
    phone: "+1 212 555 0179",
    email: "kim.dowry@gmail.com",
    physician: "Dr. Daniel McAdams",
    emergencyContact: { name: "Leo Dowry", relation: "Spouse", phone: "+1 212 555 0180" },
    vitals: {
      bloodPressure: "126/81 mm Hg",
      weight: "71 Kg",
      temperature: "98.3 °F",
      heartRate: "78 bpm",
      oxygenSaturation: "97%",
      height: "5.5 inch",
    },
  },
];

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "patients", label: "Patients", icon: Users },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "records", label: "Records", icon: FileText },
  { key: "analytics", label: "Analytics", icon: ChartLine },
];

const DETAIL_TABS = ["Vitals", "Medical Records", "Medications", "Lab Test Results", "Appointment History"];

const PAGE_NUMBERS = [1, 2, 3, 4, 5];

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeSidebarItem, setActiveSidebarItem] = useState("patients");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(PATIENTS[0].id);
  const [activeDetailTab, setActiveDetailTab] = useState("Vitals");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Hospital accounts carry a `name` field (Backend/src/models/Hospital.js).
  const displayName = user?.name || "Hospital Admin";

  const filteredPatients = useMemo(() => {
    let list = PATIENTS;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.reason.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "name" ? a.name : `${a.scheduleDate} ${a.scheduleTime}`;
        const bv = sortKey === "name" ? b.name : `${b.scheduleDate} ${b.scheduleTime}`;
        const cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [search, sortKey, sortDir]);

  const selectedPatient = PATIENTS.find((p) => p.id === selectedId) || null;

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleChecked = (id) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allChecked = checkedIds.length > 0 && checkedIds.length === filteredPatients.length;
  const toggleCheckAll = () => {
    setCheckedIds(allChecked ? [] : filteredPatients.map((p) => p.id));
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-800 bg-brand-900 px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <HeartPulse size={18} />
          </span>
          <span className="font-display text-lg font-bold text-white">HealthSync</span>
        </div>

        <div className="mx-4 flex flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/60 max-w-xl">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Patient, Tag, Appointment"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-4 text-white/80">
          <button type="button" className="relative rounded-full p-1.5 hover:bg-white/10" aria-label="Notifications">
            <Bell size={19} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="Help">
            <HelpCircle size={19} />
          </button>
          <button type="button" className="relative rounded-full p-1.5 hover:bg-white/10" aria-label="Calendar">
            <CalendarDays size={19} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <div className="mx-1 h-6 w-px bg-white/15" />
          <button type="button" className="flex items-center gap-2" onClick={handleLogout} title="Log out">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-900">
              {initialsOf(displayName)}
            </span>
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <LogOut size={15} className="text-white/60" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <nav className="flex w-[76px] shrink-0 flex-col items-center gap-2 border-r border-slate-100 bg-white py-5">
          {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSidebarItem(key)}
              title={label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                activeSidebarItem === key
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Icon size={20} />
            </button>
          ))}
          <div className="mt-auto flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSidebarItem("settings")}
              title="Settings"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                activeSidebarItem === "settings"
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Settings size={20} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-rose-600"
            >
              <LogOut size={20} />
            </button>
          </div>
        </nav>

        {/* Patient list */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-6 py-6">
          <h1 className="font-display text-2xl font-bold text-brand-900">Patient List</h1>

          <div className="mt-4 flex items-center gap-2 border-b border-slate-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab.key ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="w-10 py-3 pl-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleCheckAll}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                    />
                  </th>
                  <th className="py-3 pr-4 font-semibold">
                    <button type="button" onClick={() => toggleSort("name")} className="flex items-center gap-1.5">
                      Patient Name <ChevronsUpDown size={14} className="text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 pr-4 font-semibold">
                    <span className="flex items-center gap-1.5">
                      Reason <ChevronsUpDown size={14} className="text-slate-400" />
                    </span>
                  </th>
                  <th className="py-3 pr-4 font-semibold">
                    <button type="button" onClick={() => toggleSort("schedule")} className="flex items-center gap-1.5">
                      Schedule Time &amp; Date <ChevronsUpDown size={14} className="text-slate-400" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, idx) => {
                  const isSelected = patient.id === selectedId;
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedId(patient.id)}
                      className={`cursor-pointer border-b border-slate-50 transition ${
                        isSelected ? "bg-brand-50/60" : "hover:bg-slate-50"
                      }`}
                      style={isSelected ? { boxShadow: "inset 3px 0 0 var(--color-brand-600)" } : undefined}
                    >
                      <td className="py-3 pl-2">
                        <input
                          type="checkbox"
                          checked={checkedIds.includes(patient.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleChecked(patient.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              AVATAR_COLORS[idx % AVATAR_COLORS.length]
                            }`}
                          >
                            {initialsOf(patient.name)}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-800">{patient.name}</div>
                            <div className="text-xs text-slate-400">
                              {patient.age} Y, {patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{patient.reason}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        <div>{patient.scheduleDate}</div>
                        <div className="text-xs text-slate-400">{patient.scheduleTime}</div>
                      </td>
                    </tr>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      No patients match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              {PAGE_NUMBERS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`h-8 w-8 rounded-lg font-semibold ${
                    n === 1
                      ? "border border-brand-600 text-brand-600"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-slate-400">…</span>
              <button type="button" className="h-8 w-8 rounded-lg font-semibold text-slate-500 hover:bg-slate-50">
                9
              </button>
            </div>
          </div>
        </main>

        {/* Patient details */}
        {selectedPatient && (
          <aside className="flex w-[420px] shrink-0 flex-col overflow-y-auto border-l border-slate-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-brand-900">Patient Details</h2>
              <div className="flex items-center gap-1 text-slate-400">
                <button type="button" className="rounded-lg p-1.5 hover:bg-slate-50" title="Open full profile">
                  <ExternalLink size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1.5 hover:bg-slate-50"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-900">
                  {initialsOf(selectedPatient.name)}
                </span>
                <div>
                  <div className="font-display font-bold text-slate-800">{selectedPatient.name}</div>
                  <div className="text-sm text-slate-400">
                    {selectedPatient.age} Y, {selectedPatient.genderShort}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-white hover:bg-brand-700"
                title={`Call ${selectedPatient.name}`}
              >
                <Phone size={16} />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Phone size={14} /> {selectedPatient.phone}
              </span>
              <span className="flex items-center gap-2">
                <Mail size={14} /> {selectedPatient.email}
              </span>
            </div>

            <h3 className="mt-6 text-sm font-bold text-slate-800">Visit Info</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays size={13} /> Scheduled Time &amp; Date
                </div>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {selectedPatient.scheduleDate}, {selectedPatient.scheduleTime}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <UserPlus size={13} /> Assigned Physician
                </div>
                <div className="mt-1 text-sm font-medium text-slate-700">{selectedPatient.physician}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-400">Reason</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{selectedPatient.reason}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {selectedPatient.tag}
                </span>
              </div>
            </div>

            <h3 className="mt-6 text-sm font-bold text-slate-800">Emergency Contact</h3>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600">
                <PhoneCall size={16} />
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedPatient.emergencyContact.name}{" "}
                  <span className="font-normal text-slate-400">
                    ({selectedPatient.emergencyContact.relation})
                  </span>
                </div>
                <div className="text-sm text-slate-500">{selectedPatient.emergencyContact.phone}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-5 overflow-x-auto border-b border-slate-100 text-sm">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={`shrink-0 whitespace-nowrap border-b-2 pb-2.5 font-semibold transition ${
                    activeDetailTab === tab
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeDetailTab === "Vitals" ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <VitalCard icon={Droplets} label="Blood Pressure" value={selectedPatient.vitals.bloodPressure} />
                <VitalCard icon={Weight} label="Weight" value={selectedPatient.vitals.weight} />
                <VitalCard icon={Thermometer} label="Temperature" value={selectedPatient.vitals.temperature} />
                <VitalCard icon={HeartPulse} label="Heart Rate" value={selectedPatient.vitals.heartRate} />
                <VitalCard icon={Droplets} label="Oxygen Saturation" value={selectedPatient.vitals.oxygenSaturation} />
                <VitalCard icon={Ruler} label="Height" value={selectedPatient.vitals.height} iconClassName="rotate-90" />
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                <FileText size={22} />
                {activeDetailTab} isn&apos;t wired up to the backend yet — coming soon.
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function VitalCard({ icon: Icon, label, value, iconClassName = "" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={17} className={iconClassName} />
      </span>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

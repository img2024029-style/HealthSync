import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Droplets,
  PhoneCall,
  Pencil,
  Camera,
  Pill,
  ClipboardList,
  Loader2,
  CircleAlert,
  BadgeCheck,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { patientApi, API_ORIGIN } from "../lib/api.js";
import { initialsOf, formatDate, titleCase } from "../lib/format.js";

/*
  Patient-facing dashboard, wired to the real backend:
    GET   /api/patients/dashboard        -> { user, dashboard } (profile + counts)
    PATCH /api/patients/profile          -> update editable profile fields
    POST  /api/patients/profile/picture  -> upload profile photo (multipart)

  Deliberately shares the Hospital dashboard's design language (dark brand-900
  top bar, 76px icon rail, brand-50 icon chips, Sora display headings) so the
  two products feel like one system — but the content is personal: the
  patient's own profile, completeness, and care summary.
*/

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "records", label: "Records", icon: FileText },
  { key: "messages", label: "Messages", icon: MessageSquare },
];

const GENDERS = ["male", "female", "other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  mobileNumber: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  ecName: "",
  ecRelation: "",
  ecPhone: "",
};

function formFromUser(user) {
  return {
    firstName: user?.fullName?.firstName || "",
    lastName: user?.fullName?.lastName || "",
    mobileNumber: user?.mobileNumber || "",
    dob: user?.dob ? user.dob.slice(0, 10) : "",
    gender: user?.gender || "",
    bloodGroup: user?.bloodGroup || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    country: user?.address?.country || "",
    ecName: user?.emergencyContact?.name || "",
    ecRelation: user?.emergencyContact?.relation || "",
    ecPhone: user?.emergencyContact?.phone || "",
  };
}

/** Build a PATCH payload containing only filled-in fields. */
function payloadFromForm(form) {
  const put = (obj, key, value) => {
    const v = value.trim();
    if (v) obj[key] = v;
  };

  const payload = {};
  put(payload, "firstName", form.firstName);
  put(payload, "lastName", form.lastName);
  put(payload, "mobileNumber", form.mobileNumber);
  put(payload, "dob", form.dob);
  put(payload, "gender", form.gender);
  put(payload, "bloodGroup", form.bloodGroup);

  const address = {};
  put(address, "street", form.street);
  put(address, "city", form.city);
  put(address, "state", form.state);
  put(address, "pincode", form.pincode);
  put(address, "country", form.country);
  if (Object.keys(address).length) payload.address = address;

  const emergencyContact = {};
  put(emergencyContact, "name", form.ecName);
  put(emergencyContact, "relation", form.ecRelation);
  put(emergencyContact, "phone", form.ecPhone);
  if (Object.keys(emergencyContact).length) payload.emergencyContact = emergencyContact;

  return payload;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { accessToken, user: authUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");
  const [profile, setProfile] = useState(authUser || null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await patientApi.getDashboard(accessToken);
        if (cancelled) return;
        setProfile(res.data.user);
        setSummary(res.data.dashboard);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (accessToken) load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const displayName = profile?.fullName?.firstName
    ? `${profile.fullName.firstName} ${profile.fullName.lastName || ""}`.trim()
    : "Patient";

  const photoUrl = profile?.profilePicture
    ? `${API_ORIGIN}/${profile.profilePicture.replace(/^\/+/, "")}`
    : null;

  const startEditing = () => {
    setForm(formFromUser(profile));
    setSaveError("");
    setSaveSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError("");
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await patientApi.updateProfile(payloadFromForm(form), accessToken);
      setProfile(res.data);
      setEditing(false);
      setSaveSuccess(res.message || "Profile updated.");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    setSaveError("");
    try {
      const res = await patientApi.uploadProfilePicture(file, accessToken);
      setProfile(res.data);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar — mirrors HospitalDashboard */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-800 bg-brand-900 px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <HeartPulse size={18} />
          </span>
          <span className="font-display text-lg font-bold text-white">HealthSync</span>
        </div>

        <div className="ml-auto flex items-center gap-4 text-white/80">
          <button type="button" className="relative rounded-full p-1.5 hover:bg-white/10" aria-label="Notifications">
            <Bell size={19} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="Help">
            <HelpCircle size={19} />
          </button>
          <div className="mx-1 h-6 w-px bg-white/15" />
          <button type="button" className="flex items-center gap-2" onClick={handleLogout} title="Log out">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-900">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initialsOf(displayName)
              )}
            </span>
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <LogOut size={15} className="text-white/60" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Icon rail — mirrors HospitalDashboard */}
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

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50/60">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin" /> Loading your dashboard…
            </div>
          ) : loadError ? (
            <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-6 text-center">
              <CircleAlert size={22} className="text-rose-500" />
              <p className="text-sm text-rose-700">{loadError}</p>
              <button
                type="button"
                onClick={() => navigate(0)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl px-6 py-8">
              {/* Heading */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-brand-900">
                    Welcome back, {profile?.fullName?.firstName || "there"}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    Patient ID
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600">
                      {profile?.patientId || "—"}
                    </span>
                    {profile?.isVerified && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <BadgeCheck size={14} /> Verified
                      </span>
                    )}
                  </p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    <Pencil size={15} /> Edit Profile
                  </button>
                )}
              </div>

              {saveSuccess && !editing && (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <span className="flex items-center gap-2">
                    <BadgeCheck size={16} /> {saveSuccess}
                  </span>
                  <button type="button" onClick={() => setSaveSuccess("")} aria-label="Dismiss">
                    <X size={15} />
                  </button>
                </div>
              )}
              {saveError && !editing && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <CircleAlert size={16} /> {saveError}
                </div>
              )}

              {/* Stat cards */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={ClipboardList}
                  label="Profile Completeness"
                  value={`${summary?.profileCompleteness ?? 0}%`}
                  footer={
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{ width: `${summary?.profileCompleteness ?? 0}%` }}
                      />
                    </div>
                  }
                />
                <StatCard
                  icon={CalendarDays}
                  label="Upcoming Appointments"
                  value={summary?.upcomingAppointments ?? 0}
                  footer={<p className="mt-2 text-xs text-slate-400">Booking opens soon</p>}
                />
                <StatCard
                  icon={FileText}
                  label="Medical Records"
                  value={summary?.totalRecords ?? 0}
                  footer={<p className="mt-2 text-xs text-slate-400">Synced from your visits</p>}
                />
                <StatCard
                  icon={Pill}
                  label="Active Prescriptions"
                  value={summary?.activePrescriptions ?? 0}
                  footer={<p className="mt-2 text-xs text-slate-400">Issued by your physicians</p>}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                {/* Personal information / edit form */}
                <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-brand-900">
                      Personal Information
                    </h2>
                    {editing && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Editing
                      </span>
                    )}
                  </div>

                  {!editing ? (
                    <>
                      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InfoRow label="Full Name" value={displayName} />
                        <InfoRow label="Date of Birth" value={formatDate(profile?.dob)} />
                        <InfoRow
                          label="Age"
                          value={profile?.age != null ? `${profile.age} years` : "—"}
                        />
                        <InfoRow label="Gender" value={titleCase(profile?.gender)} />
                        <InfoRow
                          label="Blood Group"
                          value={profile?.bloodGroup || "—"}
                          icon={Droplets}
                        />
                        <InfoRow label="Mobile" value={profile?.mobileNumber || "—"} icon={Phone} />
                        <InfoRow label="Email" value={profile?.email || "—"} icon={Mail} />
                        <InfoRow
                          label="Address"
                          icon={MapPin}
                          value={
                            [
                              profile?.address?.street,
                              profile?.address?.city,
                              profile?.address?.state,
                              profile?.address?.pincode,
                              profile?.address?.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"
                          }
                        />
                      </dl>
                      {(summary?.profileCompleteness ?? 100) < 100 && (
                        <p className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
                          Your profile is {summary?.profileCompleteness}% complete. A complete
                          profile helps hospitals treat you faster.
                        </p>
                      )}
                    </>
                  ) : (
                    <form onSubmit={handleSave} className="mt-5">
                      {saveError && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                          <CircleAlert size={15} /> {saveError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="First Name">
                          <input className={inputCls} value={form.firstName} onChange={setField("firstName")} placeholder="First name" />
                        </Field>
                        <Field label="Last Name">
                          <input className={inputCls} value={form.lastName} onChange={setField("lastName")} placeholder="Last name" />
                        </Field>
                        <Field label="Mobile Number">
                          <input className={inputCls} value={form.mobileNumber} onChange={setField("mobileNumber")} placeholder="10-digit mobile number" inputMode="numeric" />
                        </Field>
                        <Field label="Date of Birth">
                          <input type="date" className={inputCls} value={form.dob} onChange={setField("dob")} max={new Date().toISOString().slice(0, 10)} />
                        </Field>
                        <Field label="Gender">
                          <select className={inputCls} value={form.gender} onChange={setField("gender")}>
                            <option value="">Select gender</option>
                            {GENDERS.map((g) => (
                              <option key={g} value={g}>{titleCase(g)}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Blood Group">
                          <select className={inputCls} value={form.bloodGroup} onChange={setField("bloodGroup")}>
                            <option value="">Select blood group</option>
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <h3 className="mt-6 text-sm font-bold text-slate-800">Address</h3>
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Street" className="sm:col-span-2">
                          <input className={inputCls} value={form.street} onChange={setField("street")} placeholder="Street address" />
                        </Field>
                        <Field label="City">
                          <input className={inputCls} value={form.city} onChange={setField("city")} placeholder="City" />
                        </Field>
                        <Field label="State">
                          <input className={inputCls} value={form.state} onChange={setField("state")} placeholder="State" />
                        </Field>
                        <Field label="Pincode">
                          <input className={inputCls} value={form.pincode} onChange={setField("pincode")} placeholder="6-digit pincode" inputMode="numeric" />
                        </Field>
                        <Field label="Country">
                          <input className={inputCls} value={form.country} onChange={setField("country")} placeholder="Country" />
                        </Field>
                      </div>

                      <h3 className="mt-6 text-sm font-bold text-slate-800">Emergency Contact</h3>
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Name">
                          <input className={inputCls} value={form.ecName} onChange={setField("ecName")} placeholder="Contact name" />
                        </Field>
                        <Field label="Relation">
                          <input className={inputCls} value={form.ecRelation} onChange={setField("ecRelation")} placeholder="e.g. Spouse" />
                        </Field>
                        <Field label="Phone">
                          <input className={inputCls} value={form.ecPhone} onChange={setField("ecPhone")} placeholder="10-digit mobile number" inputMode="numeric" />
                        </Field>
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                        >
                          {saving && <Loader2 size={15} className="animate-spin" />}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                {/* Right column */}
                <aside className="flex flex-col gap-6">
                  {/* Profile card */}
                  <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-bold text-brand-900">
                          {photoUrl ? (
                            <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                          ) : (
                            initialsOf(displayName)
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          title="Change photo"
                          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-white transition hover:bg-brand-700 disabled:opacity-60"
                        >
                          {uploadingPhoto ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Camera size={13} />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-display font-bold text-slate-800">{displayName}</div>
                        <div className="text-sm text-slate-400">
                          {profile?.age != null ? `${profile.age} Y` : "Age —"}
                          {profile?.gender ? `, ${titleCase(profile.gender)}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <Phone size={14} /> {profile?.mobileNumber || "—"}
                      </span>
                      <span className="flex items-center gap-2 break-all">
                        <Mail size={14} /> {profile?.email || "—"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                      <div>
                        <div className="text-xs text-slate-400">Blood Group</div>
                        <div className="mt-0.5 font-semibold text-slate-800">
                          {profile?.bloodGroup || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Member Since</div>
                        <div className="mt-0.5 font-semibold text-slate-800">
                          {formatDate(profile?.createdAt)}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Emergency contact — mirrors HospitalDashboard card */}
                  <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800">Emergency Contact</h3>
                    {profile?.emergencyContact?.name ? (
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600">
                          <PhoneCall size={16} />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {profile.emergencyContact.name}{" "}
                            {profile.emergencyContact.relation && (
                              <span className="font-normal text-slate-400">
                                ({profile.emergencyContact.relation})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            {profile.emergencyContact.phone || "No phone on file"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                        No emergency contact yet.{" "}
                        <button
                          type="button"
                          onClick={startEditing}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          Add one
                        </button>
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        {Icon && <Icon size={13} />} {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, footer }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs text-slate-400">{label}</div>
          <div className="font-display text-xl font-bold text-slate-800">{value}</div>
        </div>
      </div>
      {footer}
    </div>
  );
}

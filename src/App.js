import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const MEMBERS = ["Farida", "Meghavi", "Prakruti", "Pulak", "Swetha"];

const INVITE_CODE = process.env.REACT_APP_INVITE_CODE;

const getLastWednesday = () => {
  const now = new Date();
  const day = now.getDay();
  const daysBack = day >= 3 ? day - 3 : day + 4;
  const lastWed = new Date(now);
  lastWed.setDate(now.getDate() - daysBack);
  lastWed.setHours(0, 0, 0, 0);
  return lastWed;
};

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const expiresIn = (ts) => {
  const expiry = new Date(ts).getTime() + 7 * 24 * 60 * 60 * 1000;
  const diff = expiry - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
};

const AVATAR_EMOJIS = ["🌸", "🌺", "🦋", "🌙", "⭐", "🌈", "🍓", "🌻", "🦄", "💫", "🌷", "🍒"];

const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #faf7f2; --warm-white: #fff9f4; --blush: #f0d5c8;
    --rose: #c97b6e; --rose-dark: #a45a4d; --taupe: #9e8c7e;
    --brown: #5c4a3e; --text: #2e1e17; --card: #fffaf6;
    --border: #e8d9cc; --gold: #c9a96e;
    --shadow: 0 2px 20px rgba(90,50,30,0.08);
    --shadow-lg: 0 8px 40px rgba(90,50,30,0.14);
  }
  body { background: var(--cream); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }
  body::before { content: ''; position: fixed; inset: 0; background-image: radial-gradient(circle, #c97b6e18 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; z-index: 0; }
  .app-root { position: relative; z-index: 1; }

  /* Auth */
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .auth-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 3rem 2.5rem; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); text-align: center; }
  .auth-icon { font-size: 3rem; margin-bottom: 1rem; }
  .auth-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--brown); margin-bottom: 0.4rem; }
  .auth-sub { color: var(--taupe); font-size: 0.92rem; margin-bottom: 2rem; line-height: 1.5; }
  .auth-switch { margin-top: 1.2rem; font-size: 0.88rem; color: var(--taupe); }
  .auth-switch button { background: none; border: none; color: var(--rose); cursor: pointer; font-size: 0.88rem; text-decoration: underline; font-family: 'DM Sans', sans-serif; }
  .input-field { width: 100%; padding: 0.85rem 1.1rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 1rem; background: var(--warm-white); color: var(--text); outline: none; transition: border-color 0.2s; margin-bottom: 0.85rem; }
  .input-field:focus { border-color: var(--rose); }
  .btn-primary { width: 100%; padding: 0.9rem; background: var(--rose); color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s; margin-top: 0.3rem; }
  .btn-primary:hover { background: var(--rose-dark); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .error-msg { color: var(--rose); font-size: 0.88rem; margin-top: 0.3rem; margin-bottom: 0.5rem; }
  .form-label-left { font-size: 0.8rem; font-weight: 500; color: var(--taupe); margin-bottom: 0.35rem; display: block; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }

  /* Profile setup */
  .profile-setup-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .profile-setup-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 3rem 2.5rem; width: 100%; max-width: 460px; box-shadow: var(--shadow-lg); text-align: center; }
  .profile-setup-title { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: var(--brown); margin-bottom: 0.5rem; }
  .profile-setup-sub { color: var(--taupe); font-size: 0.92rem; margin-bottom: 2rem; line-height: 1.5; }
  .avatar-big { width: 80px; height: 80px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 0.75rem; border: 3px solid var(--border); transition: border-color 0.2s; }
  .avatar-big.selected { border-color: var(--rose); }
  .avatar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; margin-bottom: 1.5rem; }
  .avatar-option { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--border); background: var(--warm-white); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin: 0 auto; }
  .avatar-option:hover { border-color: var(--rose); transform: scale(1.1); }
  .avatar-option.active { border-color: var(--rose); background: #fdf0ec; transform: scale(1.1); }
  .name-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; margin-bottom: 1.5rem; }
  .name-option { padding: 0.75rem; border-radius: 12px; border: 1.5px solid var(--border); background: var(--warm-white); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; color: var(--brown); cursor: pointer; transition: all 0.15s; text-align: center; }
  .name-option:hover { border-color: var(--rose); background: #fdf0ec; }
  .name-option.active { border-color: var(--rose); background: #fdf0ec; color: var(--rose-dark); }
  .setup-section-label { font-size: 0.82rem; font-weight: 500; color: var(--taupe); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; text-align: left; }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 2rem; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 12px rgba(90,50,30,0.06); }
  .header-logo { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.4rem; color: var(--brown); }
  .header-logo span { color: var(--rose); }
  .header-right { display: flex; align-items: center; gap: 0.75rem; }
  .header-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 1rem; }
  .header-user { font-size: 0.85rem; color: var(--taupe); font-weight: 500; }
  .logout-btn { background: none; border: 1.5px solid var(--border); color: var(--taupe); cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.9rem; border-radius: 999px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .logout-btn:hover { border-color: var(--rose); color: var(--rose); }

  /* Main */
  .main { max-width: 620px; margin: 0 auto; padding: 2rem 1.5rem 8rem; }
  .create-bar { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; box-shadow: var(--shadow); display: flex; align-items: center; gap: 0.9rem; cursor: pointer; transition: box-shadow 0.2s; flex-wrap: wrap; }
  .create-bar:hover { box-shadow: var(--shadow-lg); }
  .create-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
  .create-placeholder { flex: 1; padding: 0.6rem 1rem; border-radius: 999px; background: var(--cream); border: 1.5px solid var(--border); color: var(--taupe); font-size: 0.93rem; font-family: 'DM Sans', sans-serif; text-align: left; min-width: 120px; }
  .create-actions { display: flex; gap: 0.5rem; }
  .create-pill { padding: 0.45rem 0.9rem; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: var(--taupe); cursor: pointer; transition: all 0.15s; white-space: nowrap; font-weight: 500; }
  .create-pill:hover { border-color: var(--rose); color: var(--rose); background: #fdf0ec; }

  /* Feed */
  .feed { display: flex; flex-direction: column; gap: 1.1rem; }
  .feed-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); animation: cardIn 0.35s ease; transition: transform 0.15s; }
  .feed-card:hover { transform: translateY(-2px); }
  @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.3rem 0.6rem; }
  .card-author { display: flex; align-items: center; gap: 0.65rem; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
  .author-name { font-weight: 500; font-size: 0.95rem; color: var(--brown); }
  .post-time { font-size: 0.76rem; color: var(--taupe); margin-top: 1px; }
  .card-right { display: flex; align-items: center; gap: 0.5rem; }
  .card-badge { font-size: 0.7rem; font-weight: 500; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; }
  .badge-win { background: #fef3d7; color: #a07520; }
  .badge-thought { background: #ede9e5; color: var(--taupe); }
  .badge-video { background: #fce8e5; color: var(--rose-dark); }
  .delete-btn { background: none; border: none; cursor: pointer; color: var(--taupe); font-size: 0.9rem; padding: 0.25rem 0.4rem; border-radius: 8px; transition: all 0.15s; line-height: 1; }
  .delete-btn:hover { color: #e53e3e; background: #fff0f0; }
  .card-content { padding: 0.5rem 1.3rem 1.1rem; font-size: 0.97rem; line-height: 1.65; color: var(--text); }
  .card-video { width: 100%; display: block; max-height: 400px; object-fit: cover; background: #1a0f0a; }
  .card-video-footer { padding: 0.6rem 1.3rem 1rem; display: flex; justify-content: space-between; align-items: center; }
  .video-expiry-tag { font-size: 0.76rem; color: var(--taupe); }

  /* Upload progress */
  .upload-progress { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1rem 1.2rem; margin-bottom: 1.1rem; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow); }
  .progress-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
  .progress-bar { height: 100%; background: var(--rose); border-radius: 999px; transition: width 0.2s; }
  .progress-text { font-size: 0.82rem; color: var(--taupe); white-space: nowrap; }

  /* Modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(46,30,23,0.45); backdrop-filter: blur(5px); z-index: 300; display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn 0.2s ease; }
  @media (min-width: 540px) { .modal-backdrop { align-items: center; padding: 1.5rem; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .sheet { background: var(--card); border-radius: 24px 24px 0 0; padding: 1.5rem 1.5rem 2.5rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); animation: slideUp 0.28s ease; max-height: 92vh; overflow-y: auto; }
  @media (min-width: 540px) { .sheet { border-radius: 24px; padding: 2rem; } }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .sheet-handle { width: 40px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto 1.2rem; }
  .sheet-title { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: var(--brown); margin-bottom: 1.3rem; display: flex; justify-content: space-between; align-items: center; }
  .sheet-close { background: none; border: none; font-size: 1.2rem; color: var(--taupe); cursor: pointer; }
  .confirm-dialog { text-align: center; padding: 0.5rem 0; }
  .confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .confirm-msg { font-size: 1rem; color: var(--brown); line-height: 1.5; margin-bottom: 0.4rem; }
  .confirm-sub { font-size: 0.85rem; color: var(--taupe); margin-bottom: 1.5rem; }
  .confirm-actions { display: flex; gap: 0.75rem; }
  .btn-danger { flex: 2; padding: 0.85rem; background: #e53e3e; color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; }
  .btn-danger:hover { background: #c53030; }
  .mode-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.5rem; }
  .mode-btn { padding: 1.3rem 0.5rem; border-radius: 16px; border: 1.5px solid var(--border); background: var(--warm-white); cursor: pointer; text-align: center; transition: all 0.18s; }
  .mode-btn:hover { border-color: var(--rose); background: #fdf0ec; }
  .mode-btn .mode-icon { font-size: 1.8rem; margin-bottom: 0.4rem; }
  .mode-btn .mode-label { font-size: 0.85rem; font-weight: 500; color: var(--brown); }
  .mode-btn .mode-sub { font-size: 0.75rem; color: var(--taupe); margin-top: 0.2rem; }
  .form-label { font-size: 0.8rem; font-weight: 500; color: var(--taupe); margin-bottom: 0.35rem; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-group { margin-bottom: 1rem; }
  .textarea-field { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; background: var(--warm-white); color: var(--text); outline: none; resize: none; transition: border-color 0.2s; min-height: 90px; }
  .textarea-field:focus { border-color: var(--rose); }
  .type-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .pill { padding: 0.4rem 0.9rem; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; color: var(--taupe); transition: all 0.15s; font-weight: 500; }
  .pill.win.active { background: var(--gold); border-color: var(--gold); color: white; }
  .pill.thought.active { background: var(--taupe); border-color: var(--taupe); color: white; }
  .sheet-actions { display: flex; gap: 0.75rem; margin-top: 1.1rem; }
  .btn-cancel { flex: 1; padding: 0.85rem; border: 1.5px solid var(--border); background: transparent; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: var(--taupe); cursor: pointer; }
  .btn-submit { flex: 2; padding: 0.85rem; background: var(--rose); color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-submit:hover { background: var(--rose-dark); }
  .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 2.5rem 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--warm-white); margin-bottom: 0.5rem; }
  .upload-zone:hover, .upload-zone.dragging { border-color: var(--rose); background: #fdf0ec; }
  .upload-zone-icon { font-size: 2.2rem; margin-bottom: 0.6rem; }
  .upload-zone-text { color: var(--taupe); font-size: 0.9rem; }
  .upload-zone-text strong { color: var(--rose); }
  .hidden-input { display: none; }
  .empty-state { text-align: center; padding: 4rem 1rem; color: var(--taupe); }
  .empty-icon { font-size: 2.8rem; margin-bottom: 0.75rem; }
  .empty-text { font-size: 0.95rem; line-height: 1.6; }
  .fab { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--rose); color: white; border: none; border-radius: 999px; padding: 0.9rem 2rem; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; box-shadow: 0 4px 24px rgba(201,123,110,0.5); display: flex; align-items: center; gap: 0.5rem; z-index: 200; transition: background 0.2s; white-space: nowrap; }
  .fab:hover { background: var(--rose-dark); }
  @media (max-width: 540px) {
    .header { padding: 1rem 1.1rem; }
    .header-logo { font-size: 1.15rem; }
    .main { padding: 1.2rem 0.9rem 8rem; }
    .auth-card, .profile-setup-card { padding: 2rem 1.5rem; }
    .avatar-grid { grid-template-columns: repeat(4, 1fr); }
  }
`;
document.head.appendChild(styleTag);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const [setupName, setSetupName] = useState("");
  const [setupAvatar, setSetupAvatar] = useState("🌸");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [videoCaption, setVideoCaption] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ content: "", type: "win" });
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) { loadProfile(); loadFeed(); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(err =>
        console.log("Service worker registration failed", err)
      );
    }
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!data) { setNeedsProfileSetup(true); }
    else { setProfile(data); setNeedsProfileSetup(false); }
  };

  const handleSignup = async () => {
    if (!email || !password) { setAuthError("Please fill in all fields!"); return; }
    if (inviteCode !== INVITE_CODE) { setAuthError("Invalid invite code 💔"); return; }
    if (password.length < 6) { setAuthError("Password must be at least 6 characters!"); return; }
    setAuthSubmitting(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setAuthError(error.message); setAuthSubmitting(false); return; }
    setAuthSubmitting(false);
  };

  const handleLogin = async () => {
    if (!email || !password) { setAuthError("Please enter your email and password!"); return; }
    setAuthSubmitting(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError("Wrong email or password — try again! 💔"); }
    setAuthSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null); setFeed([]); setNeedsProfileSetup(false);
  };

  const handleProfileSetup = async () => {
    if (!setupName) { setSetupError("Please pick your name!"); return; }
    setSetupSubmitting(true);
    const { error } = await supabase.from("profiles").insert([{
      id: user.id, name: setupName, email: user.email, avatar: setupAvatar,
    }]);
    if (error) { setSetupError("Something went wrong, try again!"); setSetupSubmitting(false); return; }
    setNeedsProfileSetup(false);
    loadProfile();
    loadFeed();
    setSetupSubmitting(false);
  };

  const enablePushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY),
      });

      // Save subscription to Supabase
      await supabase.from("push_subscriptions").insert([{
        user_id: user.id,
        subscription: subscription.toJSON(),
      }]);

      alert("Notifications enabled! 🌸");
    } catch (err) {
      console.error("Push subscription failed", err);
      alert("Couldn't enable notifications. Make sure you've allowed them in your browser settings!");
    }
  };

  // ── Load feed with avatars from profiles ──────────────────────────────────
  const loadFeed = async () => {
    setLoadingFeed(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts } = await supabase
      .from("posts").select("*").gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false });

    // fetch all profiles to build avatar lookup map
    const { data: allProfiles } = await supabase.from("profiles").select("name, avatar");
    const avatarMap = {};
    (allProfiles || []).forEach(p => { avatarMap[p.name] = p.avatar || "🌸"; });

    // fetch videos
    const { data: files } = await supabase.storage.from("videos").list("", {
      limit: 100, sortBy: { column: "created_at", order: "desc" }
    });

    const { data: allCaptions } = await supabase.from("video_captions").select("file_name, caption");
    const captionMap = {};
    (allCaptions || []).forEach(c => { captionMap[c.file_name] = c.caption; });

    const freshVideos = (files || [])
      .filter(f => f.name !== ".emptyFolderPlaceholder" && new Date(f.created_at) >= new Date(sevenDaysAgo))
      .map(f => {
        const uploaderName = f.name.split("_")[0];
        return {
          id: f.id,
          itemType: "video",
          name: uploaderName,
          avatar: avatarMap[uploaderName] || "🌸", // ← avatar from profiles
          created_at: f.created_at,
          url: supabase.storage.from("videos").getPublicUrl(f.name).data.publicUrl,
          fileName: f.name,
          caption: captionMap[f.name] || "",
        };
      });

    const postItems = (posts || []).map(p => ({
      ...p,
      itemType: "post",
      avatar: avatarMap[p.name] || "🌸", // ← avatar from profiles
    }));

    // merge and sort newest first
    console.log("posts dates:", postItems.map(p => p.created_at));
    console.log("video dates:", freshVideos.map(v => v.created_at));
    const merged = [...postItems, ...freshVideos].sort((a, b) => {
      const dateA = Date.parse(a.created_at);
      const dateB = Date.parse(b.created_at);
      return dateB - dateA;
    });
    console.log("merged feed order:", merged.map(i => ({ type: i.itemType, date: i.created_at })));

    setFeed(merged);
    setLoadingFeed(false);
  };

  const openSheet = (mode = null) => { setSheetMode(mode); setShowSheet(true); };
  const closeSheet = () => {
    setShowSheet(false);
    setTimeout(() => { setSheetMode(null); setForm({ content: "", type: "win" }); }, 300);
  };

  const sendNotification = async (posterName, type, content) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterName, type, content, posterEmail: user.email }),
      });
    } catch (e) { console.log("Notification failed silently", e); }
  };

  const handlePostSubmit = async () => {
    if (!form.content.trim()) return;
    setSubmitting(true);
    const name = profile?.name || "Someone";
    await supabase.from("posts").insert([{ name, content: form.content.trim(), type: form.type }]);
    await sendNotification(name, form.type, form.content.trim());
    setSubmitting(false); closeSheet(); loadFeed();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.itemType === "post") {
      await supabase.from("posts").delete().eq("id", deleteTarget.id);
    } else {
      await supabase.storage.from("videos").remove([deleteTarget.fileName]);
    }
    setDeleting(false); setDeleteTarget(null); loadFeed();
  };

  const handleFileInput = f => { if (f && f.type.startsWith("video/")) uploadVideo(f); };
  const handleDrop = e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("video/")) uploadVideo(f); };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  };

  const uploadVideo = async (file) => {
    const name = profile?.name || "Someone";
    const ext = file.name.split(".").pop();
    const fileName = `${name}_${Date.now()}.${ext}`;
    const captionToSave = videoCaption.trim();
    closeSheet();
    setUploadProgress(0);
    setVideoCaption("");
    const interval = setInterval(() => setUploadProgress(p => p < 85 ? p + Math.random() * 12 : p), 300);
    await supabase.storage.from("videos").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (captionToSave) {
      await supabase.from("video_captions").insert([{ file_name: fileName, caption: captionToSave }]);
    }
    clearInterval(interval);
    setUploadProgress(100);
    await sendNotification(name, "video", captionToSave || "shared a video 🎥");
    setTimeout(() => { setUploadProgress(null); loadFeed(); }, 900);
  };

  if (authLoading) return (
    <div className="app-root">
      <div className="auth-wrap"><div className="empty-state"><div className="empty-icon">🌸</div><p>Loading…</p></div></div>
    </div>
  );

  if (!user && authMode === "signup") return (
    <div className="app-root">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-icon">🌸</div>
          <h1 className="auth-title">Join the Corner</h1>
          <p className="auth-sub">Create your account to join 2 States' Corner ✨</p>
          <label className="form-label-left">Invite code</label>
          <input className="input-field" type="text" placeholder="Got the secret code?" value={inviteCode}
            onChange={e => { setInviteCode(e.target.value); setAuthError(""); }} />
          <label className="form-label-left">Email</label>
          <input className="input-field" type="email" placeholder="your@email.com" value={email}
            onChange={e => { setEmail(e.target.value); setAuthError(""); }} />
          <label className="form-label-left">Password</label>
          <input className="input-field" type="password" placeholder="At least 6 characters" value={password}
            onChange={e => { setPassword(e.target.value); setAuthError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSignup()} />
          {authError && <p className="error-msg">{authError}</p>}
          <button className="btn-primary" onClick={handleSignup} disabled={authSubmitting}>
            {authSubmitting ? "Creating account…" : "Create account 🌸"}
          </button>
          <p className="auth-switch">Already have an account? <button onClick={() => { setAuthMode("login"); setAuthError(""); }}>Log in</button></p>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="app-root">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-icon">🌸</div>
          <h1 className="auth-title">2 States' Corner</h1>
          <p className="auth-sub">Our private little world ✨</p>
          <label className="form-label-left">Email</label>
          <input className="input-field" type="email" placeholder="your@email.com" value={email}
            onChange={e => { setEmail(e.target.value); setAuthError(""); }} />
          <label className="form-label-left">Password</label>
          <input className="input-field" type="password" placeholder="Your password" value={password}
            onChange={e => { setPassword(e.target.value); setAuthError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {authError && <p className="error-msg">{authError}</p>}
          <button className="btn-primary" onClick={handleLogin} disabled={authSubmitting}>
            {authSubmitting ? "Logging in…" : "Come in 🚪"}
          </button>
          <p className="auth-switch">New here? <button onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Create an account</button></p>
        </div>
      </div>
    </div>
  );

  if (needsProfileSetup) return (
    <div className="app-root">
      <div className="profile-setup-wrap">
        <div className="profile-setup-card">
          <div className="avatar-big selected">{setupAvatar}</div>
          <h1 className="profile-setup-title">Set up your profile</h1>
          <p className="profile-setup-sub">Choose your name and a fun avatar so the girls know it's you! 🌸</p>
          <p className="setup-section-label">Pick your avatar</p>
          <div className="avatar-grid">
            {AVATAR_EMOJIS.map(emoji => (
              <button key={emoji} className={`avatar-option ${setupAvatar === emoji ? "active" : ""}`}
                onClick={() => setSetupAvatar(emoji)}>{emoji}</button>
            ))}
          </div>
          <p className="setup-section-label">What's your name?</p>
          <div className="name-grid">
            {MEMBERS.map(name => (
              <button key={name} className={`name-option ${setupName === name ? "active" : ""}`}
                onClick={() => setSetupName(name)}>{name}</button>
            ))}
          </div>
          {setupError && <p className="error-msg">{setupError}</p>}
          <button className="btn-primary" onClick={handleProfileSetup} disabled={!setupName || setupSubmitting}>
            {setupSubmitting ? "Saving…" : "Let's go! 🎉"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-root">
      <header className="header">
        <div className="header-logo">2 States<span>'</span> Corner</div>
        <div className="header-right">
          {profile && (
            <>
              <div className="header-avatar">{profile.avatar || "🌸"}</div>
              <span className="header-user">{profile.name}</span>
            </>
          )}
          {pushPermission !== "granted" && (
            <button
              className="logout-btn"
              onClick={enablePushNotifications}
              title="Enable push notifications"
              style={{ borderColor: "#c97b6e", color: "#c97b6e" }}
            >
              🔔 Enable
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>Leave</button>
        </div>
      </header>

      <main className="main">
        <div className="create-bar" onClick={() => openSheet()}>
          <div className="create-avatar">{profile?.avatar || "🌸"}</div>
          <div className="create-placeholder">Share something, {profile?.name?.split(" ")[0] || "girl"}...</div>
          <div className="create-actions">
            <button className="create-pill" onClick={e => { e.stopPropagation(); openSheet("upload"); }}>🎥 Upload video</button>
          </div>
        </div>

        {uploadProgress !== null && (
          <div className="upload-progress">
            <span style={{ fontSize: "1.1rem" }}>⬆️</span>
            <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${uploadProgress}%` }} /></div>
            <span className="progress-text">{uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : "Posted! 🎉"}</span>
          </div>
        )}

        {loadingFeed ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><p className="empty-text">Loading…</p></div>
        ) : feed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌷</div>
            <p className="empty-text">Nothing yet this week! Be the first to post something ✨</p>
          </div>
        ) : (
          <div className="feed">
            {feed.map(item => (
              <div className="feed-card" key={`${item.itemType}-${item.id}`}>
                <div className="card-header">
                  <div className="card-author">
                    {/* ── Avatar: always uses emoji from profiles ── */}
                    <div className="avatar">{item.avatar || "🌸"}</div>
                    <div>
                      <div className="author-name">{item.name}</div>
                      <div className="post-time">{timeAgo(item.created_at)}</div>
                    </div>
                  </div>
                  <div className="card-right">
                    {item.itemType === "post" ? (
                      <span className={`card-badge ${item.type === "win" ? "badge-win" : "badge-thought"}`}>
                        {item.type === "win" ? "🏆 win" : "💭 thought"}
                      </span>
                    ) : (
                      <span className="card-badge badge-video">🎥 video</span>
                    )}
                    <button className="delete-btn" onClick={() => setDeleteTarget(item)}>🗑️</button>
                  </div>
                </div>
                {item.itemType === "post" ? (
                  <div className="card-content">{item.content}</div>
                ) : (
                  <>
                    {item.caption && <div className="card-content" style={{ paddingBottom: "0.6rem" }}>{item.caption}</div>}
                    <video className="card-video" src={item.url} controls preload="metadata" playsInline />
                    <div className="card-video-footer">
                      <span className="video-expiry-tag">⏳ {expiresIn(item.created_at)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <button className="fab" onClick={() => openSheet()}>+ Create post</button>

      {deleteTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="sheet" style={{ maxWidth: "380px" }}>
            <div className="confirm-dialog">
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-msg">Delete this {deleteTarget.itemType}?</p>
              <p className="confirm-sub">This can't be undone — it'll be gone for everyone!</p>
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Keep it</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSheet && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeSheet()}>
          <div className="sheet">
            <div className="sheet-handle" />
            {!sheetMode && (
              <>
                <div className="sheet-title">
                  What do you want to share? 🌸
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="mode-options">
                  <button className="mode-btn" onClick={() => setSheetMode("post")}>
                    <div className="mode-icon">✍️</div>
                    <div className="mode-label">Write a post</div>
                    <div className="mode-sub">Win or thought</div>
                  </button>
                  <button className="mode-btn" onClick={() => setSheetMode("upload")}>
                    <div className="mode-icon">🎥</div>
                    <div className="mode-label">Upload a video</div>
                    <div className="mode-sub">From your phone</div>
                  </button>
                </div>
              </>
            )}
            {sheetMode === "post" && (
              <>
                <div className="sheet-title">
                  Share with the girls 💌
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="form-group">
                  <label className="form-label">What is this?</label>
                  <div className="type-pills">
                    <button className={`pill win ${form.type === "win" ? "active" : ""}`} onClick={() => setForm({ ...form, type: "win" })}>🏆 Win of the day</button>
                    <button className={`pill thought ${form.type === "thought" ? "active" : ""}`} onClick={() => setForm({ ...form, type: "thought" })}>💭 Random thought</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{form.type === "win" ? "What did you win at?" : "What's on your mind?"}</label>
                  <textarea className="textarea-field"
                    placeholder={form.type === "win" ? "I finally finished that thing I've been putting off..." : "Does anyone else think about..."}
                    value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="sheet-actions">
                  <button className="btn-cancel" onClick={closeSheet}>Cancel</button>
                  <button className="btn-submit" onClick={handlePostSubmit} disabled={!form.content.trim() || submitting}>
                    {submitting ? "Posting…" : "Post it ✨"}
                  </button>
                </div>
              </>
            )}
            {sheetMode === "upload" && (
              <>
                <div className="sheet-title">
                  Upload a video 🎥
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Caption (optional)</label>
                  <textarea className="textarea-field" style={{ minHeight: "70px" }}
                    placeholder="Add a caption to your video..."
                    value={videoCaption} onChange={e => setVideoCaption(e.target.value)} />
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden-input" onChange={e => handleFileInput(e.target.files[0])} />
                <div className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}>
                  <div className="upload-zone-icon">🎬</div>
                  <p className="upload-zone-text"><strong>Click to choose a video</strong> or drag & drop</p>
                  <p className="upload-zone-text" style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}>MP4, MOV, AVI</p>
                </div>
                <button className="btn-cancel" style={{ width: "100%", marginTop: "0.5rem" }} onClick={closeSheet}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
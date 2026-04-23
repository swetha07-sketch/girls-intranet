import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const SHARED_PASSWORD = process.env.REACT_APP_PASSWORD || "girlsclub2024";
const MEMBERS = ["Farida", "Meghavi", "Prakruti", "Pulak", "Swetha"];
// ↑ Replace these with your actual friend group names!

// ── Get the most recent Wednesday at midnight ──────────────────────────────
const getLastWednesday = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const daysBack = day >= 3 ? day - 3 : day + 4; // days since last Wednesday
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
  // expires next Wednesday
  const posted = new Date(ts);
  const nextWed = new Date(posted);
  const day = posted.getDay();
  const daysUntil = day <= 3 ? 3 - day : 10 - day;
  nextWed.setDate(posted.getDate() + daysUntil);
  nextWed.setHours(0, 0, 0, 0);
  const diff = nextWed.getTime() - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
};

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

  /* Login */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .login-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 3rem 2.5rem; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); text-align: center; }
  .login-icon { font-size: 3rem; margin-bottom: 1rem; }
  .login-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--brown); margin-bottom: 0.4rem; }
  .login-sub { color: var(--taupe); font-size: 0.95rem; margin-bottom: 2rem; }
  .input-field { width: 100%; padding: 0.85rem 1.1rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 1rem; background: var(--warm-white); color: var(--text); outline: none; transition: border-color 0.2s; margin-bottom: 1rem; }
  .input-field:focus { border-color: var(--rose); }
  .btn-primary { width: 100%; padding: 0.9rem; background: var(--rose); color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
  .btn-primary:hover { background: var(--rose-dark); }
  .error-msg { color: var(--rose); font-size: 0.88rem; margin-top: 0.5rem; }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 2rem; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 12px rgba(90,50,30,0.06); }
  .header-logo { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.4rem; color: var(--brown); }
  .header-logo span { color: var(--rose); }
  .logout-btn { background: none; border: 1.5px solid var(--border); color: var(--taupe); cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.9rem; border-radius: 999px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .logout-btn:hover { border-color: var(--rose); color: var(--rose); }

  /* Main */
  .main { max-width: 620px; margin: 0 auto; padding: 2rem 1.5rem 8rem; }

  /* Create bar */
  .create-bar { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; box-shadow: var(--shadow); display: flex; align-items: center; gap: 0.9rem; cursor: pointer; transition: box-shadow 0.2s; flex-wrap: wrap; }
  .create-bar:hover { box-shadow: var(--shadow-lg); }
  .create-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
  .create-placeholder { flex: 1; padding: 0.6rem 1rem; border-radius: 999px; background: var(--cream); border: 1.5px solid var(--border); color: var(--taupe); font-size: 0.93rem; font-family: 'DM Sans', sans-serif; text-align: left; min-width: 120px; }
  .create-actions { display: flex; gap: 0.5rem; }
  .create-pill { padding: 0.45rem 0.9rem; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: var(--taupe); cursor: pointer; transition: all 0.15s; white-space: nowrap; font-weight: 500; }
  .create-pill:hover { border-color: var(--rose); color: var(--rose); background: #fdf0ec; }

  /* Feed */
  .feed { display: flex; flex-direction: column; gap: 1.1rem; }

  /* Feed card */
  .feed-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); animation: cardIn 0.35s ease; transition: transform 0.15s; }
  .feed-card:hover { transform: translateY(-2px); }
  @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.3rem 0.6rem; }
  .card-author { display: flex; align-items: center; gap: 0.65rem; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--blush); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: var(--rose-dark); flex-shrink: 0; }
  .author-name { font-weight: 500; font-size: 0.95rem; color: var(--brown); }
  .post-time { font-size: 0.76rem; color: var(--taupe); margin-top: 1px; }
  .card-right { display: flex; align-items: center; gap: 0.5rem; }
  .card-badge { font-size: 0.7rem; font-weight: 500; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; }
  .badge-win { background: #fef3d7; color: #a07520; }
  .badge-thought { background: #ede9e5; color: var(--taupe); }
  .badge-video { background: #fce8e5; color: var(--rose-dark); }

  /* Delete button */
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

  /* Modal backdrop */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(46,30,23,0.45); backdrop-filter: blur(5px); z-index: 300; display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn 0.2s ease; }
  @media (min-width: 540px) { .modal-backdrop { align-items: center; padding: 1.5rem; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Sheet */
  .sheet { background: var(--card); border-radius: 24px 24px 0 0; padding: 1.5rem 1.5rem 2.5rem; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); animation: slideUp 0.28s ease; max-height: 92vh; overflow-y: auto; }
  @media (min-width: 540px) { .sheet { border-radius: 24px; padding: 2rem; } }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .sheet-handle { width: 40px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto 1.2rem; }
  .sheet-title { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: var(--brown); margin-bottom: 1.3rem; display: flex; justify-content: space-between; align-items: center; }
  .sheet-close { background: none; border: none; font-size: 1.2rem; color: var(--taupe); cursor: pointer; }

  /* Confirm dialog (inside modal) */
  .confirm-dialog { text-align: center; padding: 0.5rem 0; }
  .confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .confirm-msg { font-size: 1rem; color: var(--brown); line-height: 1.5; margin-bottom: 0.4rem; }
  .confirm-sub { font-size: 0.85rem; color: var(--taupe); margin-bottom: 1.5rem; }
  .confirm-actions { display: flex; gap: 0.75rem; }
  .btn-danger { flex: 2; padding: 0.85rem; background: #e53e3e; color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-danger:hover { background: #c53030; }

  /* Mode options */
  .mode-options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.5rem; }
  .mode-btn { padding: 1.1rem 0.5rem; border-radius: 16px; border: 1.5px solid var(--border); background: var(--warm-white); cursor: pointer; text-align: center; transition: all 0.18s; }
  .mode-btn:hover { border-color: var(--rose); background: #fdf0ec; }
  .mode-btn .mode-icon { font-size: 1.6rem; margin-bottom: 0.3rem; }
  .mode-btn .mode-label { font-size: 0.8rem; font-weight: 500; color: var(--brown); }

  /* Form elements */
  .form-label { font-size: 0.8rem; font-weight: 500; color: var(--taupe); margin-bottom: 0.35rem; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-group { margin-bottom: 1rem; }
  .select-field { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; background: var(--warm-white); color: var(--text); outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239e8c7e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; }
  .textarea-field { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; background: var(--warm-white); color: var(--text); outline: none; resize: none; transition: border-color 0.2s; min-height: 90px; }
  .textarea-field:focus, .select-field:focus { border-color: var(--rose); }
  .type-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .pill { padding: 0.4rem 0.9rem; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; color: var(--taupe); transition: all 0.15s; font-weight: 500; }
  .pill.win.active { background: var(--gold); border-color: var(--gold); color: white; }
  .pill.thought.active { background: var(--taupe); border-color: var(--taupe); color: white; }
  .sheet-actions { display: flex; gap: 0.75rem; margin-top: 1.1rem; }
  .btn-cancel { flex: 1; padding: 0.85rem; border: 1.5px solid var(--border); background: transparent; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: var(--taupe); cursor: pointer; }
  .btn-submit { flex: 2; padding: 0.85rem; background: var(--rose); color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-submit:hover { background: var(--rose-dark); }
  .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Upload zone */
  .upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--warm-white); margin-bottom: 0.5rem; }
  .upload-zone:hover, .upload-zone.dragging { border-color: var(--rose); background: #fdf0ec; }
  .upload-zone-icon { font-size: 2rem; margin-bottom: 0.5rem; }
  .upload-zone-text { color: var(--taupe); font-size: 0.88rem; }
  .upload-zone-text strong { color: var(--rose); }
  .hidden-input { display: none; }

  /* Camera */
  .camera-wrap { border-radius: 16px; overflow: hidden; background: #1a0f0a; margin-bottom: 0.75rem; }
  .camera-preview { width: 100%; max-height: 300px; object-fit: cover; display: block; }
  .camera-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; background: rgba(26,15,10,0.85); }
  .rec-btn { width: 58px; height: 58px; border-radius: 50%; border: 3px solid white; background: var(--rose); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; transition: all 0.2s; }
  .rec-btn.recording { background: #e53e3e; animation: pulse 1.2s infinite; }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.5); } 50% { box-shadow: 0 0 0 10px rgba(229,62,62,0); } }
  .flip-btn { background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
  .rec-timer { color: white; font-size: 0.85rem; font-weight: 500; min-width: 40px; text-align: center; }
  .rec-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #e53e3e; margin-right: 4px; animation: pulse 1s infinite; }
  .camera-hint { color: rgba(255,255,255,0.55); font-size: 0.76rem; text-align: center; padding: 0.4rem 1rem 0.75rem; }
  .camera-error { padding: 2rem; text-align: center; color: rgba(255,255,255,0.75); font-size: 0.88rem; line-height: 1.6; }

  /* Recorded preview */
  .recorded-preview { border-radius: 14px; overflow: hidden; margin-bottom: 0.75rem; }
  .recorded-preview video { width: 100%; display: block; max-height: 240px; object-fit: cover; }

  /* Empty state */
  .empty-state { text-align: center; padding: 4rem 1rem; color: var(--taupe); }
  .empty-icon { font-size: 2.8rem; margin-bottom: 0.75rem; }
  .empty-text { font-size: 0.95rem; line-height: 1.6; }

  /* FAB */
  .fab { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--rose); color: white; border: none; border-radius: 999px; padding: 0.9rem 2rem; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; box-shadow: 0 4px 24px rgba(201,123,110,0.5); display: flex; align-items: center; gap: 0.5rem; z-index: 200; transition: background 0.2s; white-space: nowrap; }
  .fab:hover { background: var(--rose-dark); }

  @media (max-width: 540px) {
    .header { padding: 1rem 1.1rem; }
    .header-logo { font-size: 1.15rem; }
    .main { padding: 1.2rem 0.9rem 8rem; }
  }
`;
document.head.appendChild(styleTag);

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("girls_auth") === "yes");
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);

  // sheet
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState(null);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, itemType, fileName? }
  const [deleting, setDeleting] = useState(false);

  // post form
  const [form, setForm] = useState({ name: "", content: "", type: "win" });
  const [submitting, setSubmitting] = useState(false);

  // video
  const [uploaderName, setUploaderName] = useState("");
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState("user");
  const [cameraError, setCameraError] = useState("");
  const [dragging, setDragging] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef();

  // login
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  const handleLogin = () => {
    if (pwInput === SHARED_PASSWORD) { sessionStorage.setItem("girls_auth", "yes"); setAuthed(true); }
    else setPwError("Wrong password, babe 💔 Try again!");
  };

  useEffect(() => { if (authed) loadFeed(); }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load feed — only show items posted since last Wednesday ───────────────
  const loadFeed = async () => {
    setLoadingFeed(true);
    const lastWednesday = getLastWednesday().toISOString();

    const { data: posts } = await supabase
      .from("posts").select("*").gte("created_at", lastWednesday).order("created_at", { ascending: false });

    const { data: files } = await supabase.storage.from("videos").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    const freshVideos = (files || [])
      .filter(f => f.name !== ".emptyFolderPlaceholder" && new Date(f.created_at) >= new Date(lastWednesday))
      .map(f => ({
        id: f.id, itemType: "video",
        name: f.name.split("_")[0],
        created_at: f.created_at,
        url: supabase.storage.from("videos").getPublicUrl(f.name).data.publicUrl,
        fileName: f.name,
      }));

    const postItems = (posts || []).map(p => ({ ...p, itemType: "post" }));
    const merged = [...postItems, ...freshVideos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFeed(merged);
    setLoadingFeed(false);
  };

  // ── Sheet ─────────────────────────────────────────────────────────────────
  const openSheet = (mode = null) => { setSheetMode(mode); setShowSheet(true); };
  const closeSheet = () => {
    setShowSheet(false);
    setTimeout(() => {
      setSheetMode(null);
      setForm({ name: "", content: "", type: "win" });
      setRecordedBlob(null); setRecordedUrl(null);
      setUploaderName(""); setCameraError("");
      stopStream(); setIsRecording(false);
      clearInterval(timerRef.current); setRecSeconds(0);
    }, 300);
  };

  // ── Post submit ───────────────────────────────────────────────────────────
  const handlePostSubmit = async () => {
    if (!form.name || !form.content.trim()) return;
    setSubmitting(true);
    await supabase.from("posts").insert([{ name: form.name, content: form.content.trim(), type: form.type }]);
    setSubmitting(false);
    closeSheet();
    loadFeed();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = (item) => setDeleteTarget(item);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.itemType === "post") {
      await supabase.from("posts").delete().eq("id", deleteTarget.id);
    } else {
      await supabase.storage.from("videos").remove([deleteTarget.fileName]);
    }
    setDeleting(false);
    setDeleteTarget(null);
    loadFeed();
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async (facing = facingMode) => {
    setCameraError("");
    try {
      if (streamRef.current) stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      setCameraError("Couldn't access camera 📷 Please allow camera & microphone permissions in your browser settings.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  useEffect(() => {
    if (showSheet && sheetMode === "camera") setTimeout(() => startCamera(), 300);
    if (!showSheet) stopStream();
  }, [showSheet, sheetMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next); startCamera(next);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" });
      setRecordedBlob(blob); setRecordedUrl(URL.createObjectURL(blob));
      stopStream(); setSheetMode("camera-preview");
    };
    mr.start(); mediaRecorderRef.current = mr;
    setIsRecording(true); setRecSeconds(0);
    timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false); clearInterval(timerRef.current);
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Upload video ──────────────────────────────────────────────────────────
  const uploadVideo = async (fileOrBlob, name) => {
    if (!name) return;
    const ext = fileOrBlob instanceof File ? fileOrBlob.name.split(".").pop() : "mp4";
    const fileName = `${name}_${Date.now()}.${ext}`;
    closeSheet();
    setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress(p => p < 85 ? p + Math.random() * 12 : p), 300);
    await supabase.storage.from("videos").upload(fileName, fileOrBlob, { cacheControl: "3600", upsert: false });
    clearInterval(interval);
    setUploadProgress(100);
    setTimeout(() => { setUploadProgress(null); loadFeed(); }, 900);
  };

  const handleFileInput = f => { if (f && f.type.startsWith("video/")) uploadVideo(f, uploaderName); };
  const handleDrop = e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("video/")) uploadVideo(f, uploaderName); };

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="app-root">
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-icon">🌸</div>
          <h1 className="login-title">2 States' Corner</h1>
          <p className="login-sub">Our private little world. Password please ✨</p>
          <input className="input-field" type="password" placeholder="Enter password..." value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
          {pwError && <p className="error-msg">{pwError}</p>}
          <button className="btn-primary" onClick={handleLogin} style={{ marginTop: "0.5rem" }}>Come in 🚪</button>
        </div>
      </div>
    </div>
  );

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <header className="header">
        <div className="header-logo">2 States<span>'</span> Corner</div>
        <button className="logout-btn" onClick={() => { sessionStorage.removeItem("girls_auth"); setAuthed(false); }}>Leave</button>
      </header>

      <main className="main">
        {/* Create bar */}
        <div className="create-bar" onClick={() => openSheet()}>
          <div className="create-avatar">🌸</div>
          <div className="create-placeholder">Share something with the girls...</div>
          <div className="create-actions">
            <button className="create-pill" onClick={e => { e.stopPropagation(); openSheet("camera"); }}>🎥 Record</button>
            <button className="create-pill" onClick={e => { e.stopPropagation(); openSheet("upload"); }}>📁 Upload</button>
          </div>
        </div>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="upload-progress">
            <span style={{ fontSize: "1.1rem" }}>⬆️</span>
            <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${uploadProgress}%` }} /></div>
            <span className="progress-text">{uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : "Posted! 🎉"}</span>
          </div>
        )}

        {/* Feed */}
        {loadingFeed ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><p className="empty-text">Loading…</p></div>
        ) : feed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌷</div>
            <p className="empty-text">Nothing yet this week! Be the first to post something ✨</p>
          </div>
        ) : (
          <div className="feed">
            {feed.map(item => item.itemType === "post" ? (
              <div className="feed-card" key={`post-${item.id}`}>
                <div className="card-header">
                  <div className="card-author">
                    <div className="avatar">{item.name[0]}</div>
                    <div>
                      <div className="author-name">{item.name}</div>
                      <div className="post-time">{timeAgo(item.created_at)}</div>
                    </div>
                  </div>
                  <div className="card-right">
                    <span className={`card-badge ${item.type === "win" ? "badge-win" : "badge-thought"}`}>
                      {item.type === "win" ? "🏆 win" : "💭 thought"}
                    </span>
                    <button className="delete-btn" onClick={() => confirmDelete(item)} title="Delete post">🗑️</button>
                  </div>
                </div>
                <div className="card-content">{item.content}</div>
              </div>
            ) : (
              <div className="feed-card" key={`video-${item.id}`}>
                <div className="card-header">
                  <div className="card-author">
                    <div className="avatar">{item.name[0]}</div>
                    <div>
                      <div className="author-name">{item.name}</div>
                      <div className="post-time">{timeAgo(item.created_at)}</div>
                    </div>
                  </div>
                  <div className="card-right">
                    <span className="card-badge badge-video">🎥 video</span>
                    <button className="delete-btn" onClick={() => confirmDelete(item)} title="Delete video">🗑️</button>
                  </div>
                </div>
                <video className="card-video" src={item.url} controls preload="metadata" playsInline />
                <div className="card-video-footer">
                  <span className="video-expiry-tag">⏳ {expiresIn(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => openSheet()}>+ Create post</button>

      {/* ── Delete confirmation modal ── */}
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

      {/* ── Create sheet ── */}
      {showSheet && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeSheet()}>
          <div className="sheet">
            <div className="sheet-handle" />

            {/* Choose mode */}
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
                  </button>
                  <button className="mode-btn" onClick={() => setSheetMode("camera")}>
                    <div className="mode-icon">📸</div>
                    <div className="mode-label">Record video</div>
                  </button>
                  <button className="mode-btn" onClick={() => setSheetMode("upload")}>
                    <div className="mode-icon">📁</div>
                    <div className="mode-label">Upload video</div>
                  </button>
                </div>
              </>
            )}

            {/* Write a post */}
            {sheetMode === "post" && (
              <>
                <div className="sheet-title">
                  Share with the girls 💌
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Who are you?</label>
                  <select className="select-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}>
                    <option value="">Select your name...</option>
                    {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
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
                  <button className="btn-submit" onClick={handlePostSubmit} disabled={!form.name || !form.content.trim() || submitting}>
                    {submitting ? "Posting…" : "Post it ✨"}
                  </button>
                </div>
              </>
            )}

            {/* Camera */}
            {sheetMode === "camera" && (
              <>
                <div className="sheet-title">
                  Record a video 🎥
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="camera-wrap">
                  {cameraError
                    ? <div className="camera-error">{cameraError}</div>
                    : <>
                        <video ref={videoRef} className="camera-preview" muted playsInline autoPlay />
                        <div className="camera-controls">
                          <button className="flip-btn" onClick={flipCamera}>🔄</button>
                          <button className={`rec-btn ${isRecording ? "recording" : ""}`} onClick={isRecording ? stopRecording : startRecording}>
                            {isRecording ? "⏹" : "⏺"}
                          </button>
                          <div className="rec-timer">{isRecording && <span className="rec-dot" />}{formatTime(recSeconds)}</div>
                        </div>
                        <p className="camera-hint">{isRecording ? "Tap ⏹ to stop recording" : "Tap ⏺ to start • 🔄 to flip camera"}</p>
                      </>
                  }
                </div>
                <button className="btn-cancel" style={{ width: "100%" }} onClick={closeSheet}>Cancel</button>
              </>
            )}

            {/* Camera preview */}
            {sheetMode === "camera-preview" && recordedUrl && (
              <>
                <div className="sheet-title">
                  Looking good? 👀
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="recorded-preview">
                  <video src={recordedUrl} controls />
                </div>
                <div className="form-group">
                  <label className="form-label">Who are you?</label>
                  <select className="select-field" value={uploaderName} onChange={e => setUploaderName(e.target.value)}>
                    <option value="">Select your name...</option>
                    {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="sheet-actions">
                  <button className="btn-cancel" onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setSheetMode("camera"); setTimeout(() => startCamera(), 200); }}>Re-record</button>
                  <button className="btn-submit" disabled={!uploaderName} onClick={() => uploadVideo(recordedBlob, uploaderName)}>Post it ✨</button>
                </div>
              </>
            )}

            {/* Upload file */}
            {sheetMode === "upload" && (
              <>
                <div className="sheet-title">
                  Upload a video 📁
                  <button className="sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Who are you?</label>
                  <select className="select-field" value={uploaderName} onChange={e => setUploaderName(e.target.value)}>
                    <option value="">Select your name...</option>
                    {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden-input" onChange={e => handleFileInput(e.target.files[0])} />
                <div className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => uploaderName && fileInputRef.current.click()}>
                  <div className="upload-zone-icon">🎬</div>
                  <p className="upload-zone-text">
                    {uploaderName ? <><strong>Click to choose a video</strong> or drag & drop</> : "👆 Select your name above first!"}
                  </p>
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

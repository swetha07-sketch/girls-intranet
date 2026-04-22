import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ───────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const SHARED_PASSWORD = process.env.REACT_APP_PASSWORD || "girlsclub2024";
const MEMBERS = ["Aaliyah", "Brianna", "Destiny", "Faith", "Grace", "Hailey", "Isabella", "Jasmine"];
// ↑ Replace these names with your actual friend group names!

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Fonts & global styles injected into <head> ───────────────────────────────
const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #faf7f2;
    --warm-white: #fff9f4;
    --blush: #f0d5c8;
    --rose: #c97b6e;
    --rose-dark: #a45a4d;
    --taupe: #9e8c7e;
    --brown: #5c4a3e;
    --text: #2e1e17;
    --card: #fffaf6;
    --border: #e8d9cc;
    --gold: #c9a96e;
    --green: #7aad8c;
    --shadow: 0 2px 20px rgba(90,50,30,0.08);
    --shadow-lg: 0 8px 40px rgba(90,50,30,0.14);
  }

  body {
    background: var(--cream);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* subtle dot grid background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, #c97b6e18 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  .app-root { position: relative; z-index: 1; }

  /* ── Login ── */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .login-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-lg);
    text-align: center;
  }
  .login-icon { font-size: 3rem; margin-bottom: 1rem; }
  .login-title {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    color: var(--brown);
    margin-bottom: 0.4rem;
  }
  .login-sub { color: var(--taupe); font-size: 0.95rem; margin-bottom: 2rem; }
  .input-field {
    width: 100%;
    padding: 0.85rem 1.1rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    background: var(--warm-white);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 1rem;
  }
  .input-field:focus { border-color: var(--rose); }
  .btn-primary {
    width: 100%;
    padding: 0.9rem;
    background: var(--rose);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }
  .btn-primary:hover { background: var(--rose-dark); }
  .btn-primary:active { transform: scale(0.98); }
  .error-msg { color: var(--rose); font-size: 0.88rem; margin-top: 0.5rem; }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 2rem;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 12px rgba(90,50,30,0.06);
  }
  .header-logo {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 1.55rem;
    color: var(--brown);
  }
  .header-logo span { color: var(--rose); }
  .header-right { display: flex; gap: 0.75rem; align-items: center; }
  .tab-btn {
    padding: 0.45rem 1rem;
    border-radius: 999px;
    border: 1.5px solid var(--border);
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: var(--taupe);
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }
  .tab-btn.active, .tab-btn:hover {
    background: var(--rose);
    border-color: var(--rose);
    color: white;
  }
  .logout-btn {
    background: none;
    border: none;
    color: var(--taupe);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    transition: color 0.2s;
  }
  .logout-btn:hover { color: var(--rose); }

  /* ── Main layout ── */
  .main { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem 6rem; }

  /* ── Section header ── */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1.5rem;
  }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    color: var(--brown);
  }
  .section-hint { color: var(--taupe); font-size: 0.85rem; }

  /* ── Create Button (FAB) ── */
  .fab {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: var(--rose);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 0.85rem 1.6rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 24px rgba(201,123,110,0.45);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 200;
    transition: transform 0.2s, background 0.2s;
  }
  .fab:hover { background: var(--rose-dark); transform: translateY(-2px); }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(46, 30, 23, 0.4);
    backdrop-filter: blur(4px);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--card);
    border-radius: 24px;
    padding: 2rem;
    width: 100%;
    max-width: 480px;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    color: var(--brown);
    margin-bottom: 1.4rem;
  }
  .modal-close {
    float: right;
    background: none;
    border: none;
    font-size: 1.3rem;
    color: var(--taupe);
    cursor: pointer;
    margin-top: -4px;
  }
  .form-label { font-size: 0.82rem; font-weight: 500; color: var(--taupe); margin-bottom: 0.35rem; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-group { margin-bottom: 1.1rem; }
  .textarea-field {
    width: 100%;
    padding: 0.85rem 1.1rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    background: var(--warm-white);
    color: var(--text);
    outline: none;
    resize: none;
    transition: border-color 0.2s;
    min-height: 100px;
  }
  .textarea-field:focus { border-color: var(--rose); }
  .select-field {
    width: 100%;
    padding: 0.85rem 1.1rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    background: var(--warm-white);
    color: var(--text);
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239e8c7e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
  }
  .type-pills { display: flex; gap: 0.5rem; margin-bottom: 1.1rem; }
  .pill {
    padding: 0.45rem 1rem;
    border-radius: 999px;
    border: 1.5px solid var(--border);
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    cursor: pointer;
    color: var(--taupe);
    transition: all 0.15s;
    font-weight: 500;
  }
  .pill.win.active { background: var(--gold); border-color: var(--gold); color: white; }
  .pill.thought.active { background: var(--taupe); border-color: var(--taupe); color: white; }
  .pill:hover { border-color: var(--rose); color: var(--rose); }
  .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.2rem; }
  .btn-secondary {
    flex: 1;
    padding: 0.85rem;
    border: 1.5px solid var(--border);
    background: transparent;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    color: var(--taupe);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-secondary:hover { border-color: var(--rose); color: var(--rose); }
  .btn-submit {
    flex: 2;
    padding: 0.85rem;
    background: var(--rose);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-submit:hover { background: var(--rose-dark); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Post Cards ── */
  .posts-feed { display: flex; flex-direction: column; gap: 1rem; }
  .post-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.4rem 1.6rem;
    box-shadow: var(--shadow);
    transition: transform 0.15s;
    animation: cardIn 0.3s ease;
  }
  @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .post-card:hover { transform: translateY(-2px); }
  .post-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .post-author { display: flex; align-items: center; gap: 0.6rem; }
  .avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: var(--blush);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--rose-dark);
    flex-shrink: 0;
  }
  .author-name { font-weight: 500; font-size: 0.95rem; color: var(--brown); }
  .post-time { font-size: 0.78rem; color: var(--taupe); margin-top: 1px; }
  .post-badge {
    font-size: 0.72rem;
    font-weight: 500;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .badge-win { background: #fef3d7; color: #a07520; }
  .badge-thought { background: #ede9e5; color: var(--taupe); }
  .post-content { font-size: 0.97rem; line-height: 1.65; color: var(--text); }

  /* ── Video section ── */
  .video-upload-zone {
    border: 2px dashed var(--border);
    border-radius: 20px;
    padding: 2.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 2rem;
    background: var(--warm-white);
  }
  .video-upload-zone:hover, .video-upload-zone.dragging {
    border-color: var(--rose);
    background: #fdf0ec;
  }
  .upload-icon { font-size: 2.2rem; margin-bottom: 0.6rem; }
  .upload-text { color: var(--taupe); font-size: 0.92rem; }
  .upload-text strong { color: var(--rose); cursor: pointer; }
  .hidden-input { display: none; }

  .videos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.1rem; }
  .video-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: cardIn 0.3s ease;
  }
  .video-thumb { position: relative; }
  .video-thumb video { width: 100%; display: block; max-height: 180px; object-fit: cover; }
  .video-expiry {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(46,30,23,0.72);
    color: white;
    font-size: 0.72rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }
  .video-info { padding: 0.9rem 1rem; }
  .video-uploader { font-size: 0.85rem; font-weight: 500; color: var(--brown); }
  .video-date { font-size: 0.78rem; color: var(--taupe); margin-top: 0.15rem; }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--taupe);
    font-size: 0.95rem;
  }
  .empty-state .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

  /* upload progress */
  .upload-progress {
    background: var(--warm-white);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.2rem;
    margin-bottom: 1.2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .progress-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
  .progress-bar { height: 100%; background: var(--rose); border-radius: 999px; transition: width 0.2s; }
  .progress-text { font-size: 0.82rem; color: var(--taupe); white-space: nowrap; }

  /* who is uploading modal */
  .uploader-select-wrap { margin-bottom: 1.1rem; }

  @media (max-width: 540px) {
    .header { padding: 1rem; }
    .header-logo { font-size: 1.3rem; }
    .main { padding: 1.2rem 1rem 6rem; }
    .videos-grid { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(styleTag);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("gils_auth") === "yes");
  const [tab, setTab] = useState("board");
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  // form state
  const [form, setForm] = useState({ name: "", content: "", type: "win" });
  const [uploaderName, setUploaderName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  const handleLogin = () => {
    if (pwInput === SHARED_PASSWORD) {
      sessionStorage.setItem("gils_auth", "yes");
      setAuthed(true);
    } else {
      setPwError("Wrong password, babe 💔 Try again!");
    }
  };

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    fetchPosts();
    fetchVideos();
  }, [authed]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const fetchVideos = async () => {
    const { data } = await supabase.storage.from("videos").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (!data) return;
    // filter out files older than 7 days
    const week = 7 * 24 * 60 * 60 * 1000;
    const fresh = data.filter((f) => f.name !== ".emptyFolderPlaceholder" && Date.now() - new Date(f.created_at).getTime() < week);
    setVideos(fresh);
  };

  // ── Post submit ─────────────────────────────────────────────────────────────
  const handlePostSubmit = async () => {
    if (!form.name || !form.content.trim()) return;
    setSubmitting(true);
    await supabase.from("posts").insert([{ name: form.name, content: form.content.trim(), type: form.type }]);
    setForm({ name: "", content: "", type: "win" });
    setShowModal(false);
    setSubmitting(false);
    fetchPosts();
  };

  // ── Video upload ─────────────────────────────────────────────────────────────
  const handleVideoFile = async (file) => {
    if (!file || !uploaderName) return;
    const ext = file.name.split(".").pop();
    const fileName = `${uploaderName}_${Date.now()}.${ext}`;
    setUploadProgress(0);
    setShowVideoUpload(false);

    // Supabase JS v2 doesn't expose progress natively, so we simulate it
    const interval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + Math.random() * 12 : p));
    }, 300);

    const { error } = await supabase.storage.from("videos").upload(fileName, file, { cacheControl: "3600", upsert: false, metadata: { uploader: uploaderName } });
    clearInterval(interval);
    setUploadProgress(100);
    setTimeout(() => {
      setUploadProgress(null);
      setUploaderName("");
      if (!error) fetchVideos();
    }, 800);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) handleVideoFile(file);
  };

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="app-root">
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-icon">🌸</div>
            <h1 className="login-title">the girls' corner</h1>
            <p className="login-sub">Our private little world. Password please ✨</p>
            <input
              className="input-field"
              type="password"
              placeholder="Enter password..."
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            {pwError && <p className="error-msg">{pwError}</p>}
            <button className="btn-primary" onClick={handleLogin} style={{ marginTop: "0.5rem" }}>Come in 🚪</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* Header */}
      <header className="header">
        <div className="header-logo">the girls<span>'</span> corner</div>
        <div className="header-right">
          <button className={`tab-btn ${tab === "board" ? "active" : ""}`} onClick={() => setTab("board")}>✍️ Board</button>
          <button className={`tab-btn ${tab === "videos" ? "active" : ""}`} onClick={() => setTab("videos")}>🎥 Videos</button>
          <button className="logout-btn" onClick={() => { sessionStorage.removeItem("gils_auth"); setAuthed(false); }}>Leave</button>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* ── Board tab ── */}
        {tab === "board" && (
          <>
            <div className="section-header">
              <h2 className="section-title">Today's vibes ✨</h2>
              <span className="section-hint">{posts.length} posts</span>
            </div>

            {loading ? (
              <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading…</p></div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌷</div>
                <p>Nothing here yet! Hit the button below to share your first win.</p>
              </div>
            ) : (
              <div className="posts-feed">
                {posts.map((p) => (
                  <div className="post-card" key={p.id}>
                    <div className="post-top">
                      <div className="post-author">
                        <div className="avatar">{p.name[0]}</div>
                        <div>
                          <div className="author-name">{p.name}</div>
                          <div className="post-time">{timeAgo(p.created_at)}</div>
                        </div>
                      </div>
                      <span className={`post-badge ${p.type === "win" ? "badge-win" : "badge-thought"}`}>
                        {p.type === "win" ? "🏆 win" : "💭 thought"}
                      </span>
                    </div>
                    <p className="post-content">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Videos tab ── */}
        {tab === "videos" && (
          <>
            <div className="section-header">
              <h2 className="section-title">Videos 🎥</h2>
              <span className="section-hint">auto-delete after 7 days</span>
            </div>

            {/* upload progress */}
            {uploadProgress !== null && (
              <div className="upload-progress">
                <span style={{ fontSize: "1.2rem" }}>⬆️</span>
                <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${uploadProgress}%` }} /></div>
                <span className="progress-text">{uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : "Done! 🎉"}</span>
              </div>
            )}

            {/* drop zone */}
            <div
              className={`video-upload-zone ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => setShowVideoUpload(true)}
            >
              <div className="upload-icon">🎬</div>
              <p className="upload-text"><strong>Click to upload</strong> or drag & drop a video</p>
              <p className="upload-text" style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}>MP4, MOV, AVI — max 50MB</p>
            </div>

            {videos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📹</div>
                <p>No videos yet. Upload one above!</p>
              </div>
            ) : (
              <div className="videos-grid">
                {videos.map((v) => {
                  const url = supabase.storage.from("videos").getPublicUrl(v.name).data.publicUrl;
                  const uploader = v.name.split("_")[0];
                  return (
                    <div className="video-card" key={v.id}>
                      <div className="video-thumb">
                        <video src={url} controls preload="metadata" />
                        <span className="video-expiry">{expiresIn(v.created_at)}</span>
                      </div>
                      <div className="video-info">
                        <div className="video-uploader">👤 {uploader}</div>
                        <div className="video-date">{timeAgo(v.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      {tab === "board" && (
        <button className="fab" onClick={() => setShowModal(true)}>
          <span>+</span> Share something
        </button>
      )}

      {/* ── Post modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">
              Share with the girls 💌
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Who are you?</label>
              <select className="select-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
                <option value="">Select your name...</option>
                {MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
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
              <label className="form-label">{form.type === "win" ? "What did you win at today?" : "What's on your mind?"}</label>
              <textarea
                className="textarea-field"
                placeholder={form.type === "win" ? "I finally finished that project I've been putting off..." : "Does anyone else think about..."}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handlePostSubmit} disabled={!form.name || !form.content.trim() || submitting}>
                {submitting ? "Posting…" : "Post it ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video uploader name modal ── */}
      {showVideoUpload && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowVideoUpload(false)}>
          <div className="modal">
            <div className="modal-title">
              Upload a video 🎥
              <button className="modal-close" onClick={() => setShowVideoUpload(false)}>✕</button>
            </div>

            <div className="form-group uploader-select-wrap">
              <label className="form-label">Who is uploading?</label>
              <select className="select-field" value={uploaderName} onChange={(e) => setUploaderName(e.target.value)}>
                <option value="">Select your name...</option>
                {MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden-input"
              onChange={(e) => handleVideoFile(e.target.files[0])}
            />

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowVideoUpload(false)}>Cancel</button>
              <button
                className="btn-submit"
                disabled={!uploaderName}
                onClick={() => fileInputRef.current.click()}
              >
                Choose video 📁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

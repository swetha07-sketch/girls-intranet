import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:2statescorner@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { posterName, type, content } = req.body;
  console.log("Notify called!", { posterName, type, posterEmail: req.body.posterEmail });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  const typeLabel = type === "win" ? "🏆 shared a win"
    : type === "thought" ? "💭 shared a thought"
    : type === "video" ? "🎥 uploaded a video"
    : type === "photo" ? "📷 uploaded a photo"
    : type === "comment" ? "💬 left a comment"
    : "shared something";

  const emailBody = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 2rem; background: #faf7f2; border-radius: 16px;">
      <h2 style="color: #5c4a3e; font-size: 1.4rem; margin-bottom: 0.5rem;">2 States' Corner 🌸</h2>
      <p style="color: #9e8c7e; font-size: 0.9rem; margin-bottom: 1.5rem;">Something new was just posted!</p>
      <div style="background: white; border-radius: 12px; padding: 1.2rem; border: 1px solid #e8d9cc;">
        <p style="color: #5c4a3e; font-size: 1rem; margin: 0;"><strong>${posterName}</strong> ${typeLabel}</p>
        ${type !== "video" ? `<p style="color: #2e1e17; margin-top: 0.75rem; line-height: 1.6;">${content}</p>` : ""}
      </div>
      <a href="${process.env.REACT_APP_SITE_URL || "https://2-states-corner.vercel.app"}" 
         style="display: inline-block; margin-top: 1.2rem; background: #c97b6e; color: white; padding: 0.75rem 1.5rem; border-radius: 999px; text-decoration: none; font-size: 0.9rem;">
        View it now →
      </a>
      <p style="color: #9e8c7e; font-size: 0.78rem; margin-top: 1.5rem;">You're getting this because you're part of 2 States' Corner 🌸</p>
    </div>
  `;

  // Email
  let emailResult = null;
  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "2 States' Corner <onboarding@resend.dev>",
        to: "2statescorner@gmail.com",
        subject: `${posterName} just posted on 2 States' Corner! 🌸`,
        html: emailBody,
      }),
    });
    emailResult = await resendRes.json();
  } catch (e) {
    emailResult = { error: e.message };
  }

  // Push notifications
  let pushResult = { sent: 0, failed: 0 };
  try {
    // Find the poster's user_id so we can exclude their devices
let posterUserId = null;
if (posterEmail) {
  const profilesRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(posterEmail)}&select=id`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const profilesData = await profilesRes.json();
  if (profilesData && profilesData[0]) posterUserId = profilesData[0].id;
}

// Get all subscriptions EXCEPT the poster's
const subsUrl = posterUserId 
  ? `${supabaseUrl}/rest/v1/push_subscriptions?select=id,subscription&user_id=neq.${posterUserId}`
  : `${supabaseUrl}/rest/v1/push_subscriptions?select=id,subscription`;
const subsRes = await fetch(subsUrl, {
  headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
});
const subs = await subsRes.json();

    const pushPayload = JSON.stringify({
      title: `${posterName} ${typeLabel} 🌸`,
      body: type === "video" ? "Tap to watch" : (content?.slice(0, 100) || ""),
      url: process.env.REACT_APP_SITE_URL || "https://2-states-corner.vercel.app",
    });

    for (const s of subs || []) {
      try {
        await webpush.sendNotification(s.subscription, pushPayload);
        pushResult.sent++;
      } catch (err) {
        pushResult.failed++;
        // Auto-clean expired subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${s.id}`, {
            method: "DELETE",
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          });
        }
      }
    }
  } catch (e) {
    pushResult.error = e.message;
  }

  return res.status(200).json({ ok: true, email: emailResult, push: pushResult });
}
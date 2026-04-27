export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { posterName, type, content } = req.body;

  const typeLabel = type === "win" ? "🏆 shared a win" : type === "thought" ? "💭 shared a thought" : "🎥 uploaded a video";

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

  // Send ONE email to the shared inbox
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

  const result = await resendRes.json();
  return res.status(200).json({ ok: true, result });
}
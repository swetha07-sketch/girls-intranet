export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.body;
  const realCode = process.env.INVITE_CODE;

  if (!realCode) {
    return res.status(500).json({ error: "Invite code not configured on server" });
  }

  if (code === realCode) {
    return res.status(200).json({ valid: true });
  }

  return res.status(200).json({ valid: false });
}
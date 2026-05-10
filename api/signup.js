export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, code } = req.body;

  if (!email || !password || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const realCode = process.env.INVITE_CODE;
  if (!realCode) {
    return res.status(500).json({ error: "Server not configured" });
  }

  if (code !== realCode) {
    return res.status(403).json({ error: "Invalid invite code" });
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return res.status(500).json({ error: "Service role key missing" });
  }

  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  const createUserData = await createUserRes.json();

  if (!createUserRes.ok) {
    return res.status(400).json({ 
      error: createUserData.msg || createUserData.error_description || "Could not create account" 
    });
  }

  return res.status(200).json({ ok: true });
}
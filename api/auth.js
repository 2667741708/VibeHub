export default async function handler(req, res) {
  // CORS configuration to allow requests from GitHub Pages
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'GitHub authorization code is required' });
    }
    
    console.log("Exchanging code for token...");
    
    // Hardcode Client ID, getting secret from Vercel Environment Variables
    const client_id = "Ov23lifd2X85p0C5nIXT";
    const client_secret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!client_secret) {
        console.error("Missing GITHUB_CLIENT_SECRET env var");
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Exchange code for access token via GitHub API
    const authResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code
      })
    });
    
    const tokenData = await authResponse.json();
    
    if (tokenData.error) {
        console.error("GitHub Auth Error:", tokenData);
        return res.status(400).json(tokenData);
    }
    
    // Successfully got the token! Return it to the frontend.
    res.status(200).json({ 
        access_token: tokenData.access_token 
    });
    
  } catch (error) {
    console.error("Token exchange failed:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

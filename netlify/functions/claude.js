exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body);
    const { action } = body;

    // Exchange auth code for tokens
    if (action === 'exchange_code') {
      const { code } = body;
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.APP_URL + '/auth/callback',
          grant_type: 'authorization_code',
        }),
      });
      const data = await resp.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // Refresh access token
    if (action === 'refresh_token') {
      const { refresh_token } = body;
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      });
      const data = await resp.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // Read Gmail messages
    if (action === 'read_gmail') {
      const { access_token } = body;

      // Get list of recent messages
      const listResp = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const listData = await listResp.json();

      if (!listData.messages) return { statusCode: 200, headers, body: JSON.stringify({ emails: [] }) };

      // Fetch each message
      const emails = [];
      for (const msg of listData.messages.slice(0, 30)) {
        const msgResp = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        const msgData = await msgResp.json();

        const headers2 = msgData.payload?.headers || [];
        const subject = headers2.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from = headers2.find(h => h.name === 'From')?.value || '';
        const date = headers2.find(h => h.name === 'Date')?.value || '';

        // Extract body text
        let bodyText = '';
        const extractText = (part) => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8') + '\n';
          }
          if (part.parts) part.parts.forEach(extractText);
        };
        if (msgData.payload) extractText(msgData.payload);

        emails.push({ subject, from, date, body: bodyText.slice(0, 1000) });
      }

      return { statusCode: 200, headers, body: JSON.stringify({ emails }) };
    }

    // Call Claude API
    if (action === 'claude') {
      const { messages, system, max_tokens = 1500 } = body;
      const payload = { model: 'claude-haiku-4-5-20251001', max_tokens, messages };
      if (system) payload.system = system;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      return { statusCode: resp.status, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

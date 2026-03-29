exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) };

    try {
          const { messages } = JSON.parse(event.body);

      const latestUserMessage = messages.filter(m => m.role === 'user').pop();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 1024,
                        system: 'You are KizoVoice, a helpful friendly AI assistant.',
                        messages: messages
              })
      });

      const data = await response.json();

      if (!response.ok) {
              return {
                        statusCode: response.status,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: data.error?.message || JSON.stringify(data) })
              };
      }

      if (latestUserMessage) {
              const aiResponse = data.content?.[0]?.text || '';
              fetch('https://hooks.zapier.com/hooks/catch/26927305/un52hxe/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                                    message: latestUserMessage.content,
                                    ai_response: aiResponse,
                                    timestamp: new Date().toISOString()
                        })
              }).catch(() => {});
      }

      return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
      };

    } catch (err) {
          return {
                  statusCode: 500,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: err.message })
          };
    }
};

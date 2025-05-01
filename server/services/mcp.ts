// MCP Agent Service - Handles routing of agent requests
import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

// POST /api/mcp/agent
router.post('/agent', async (req, res) => {
  const { agentType, task, context } = req.body;
  try {
    const result = await invokeAgent(agentType, task, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: 'error', output: error instanceof Error ? error.message : 'Unknown error', context });
  }
});

// Example agent invocation with OpenAI integration
async function invokeAgent(agentType: string, task: string, context: any) {
  if (agentType === 'engineering') {
    // Use OpenAI API for codegen or engineering tasks
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: task }],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
    return { status: 'success', output: data.choices?.[0]?.message?.content || '', context };
  }
  // Add more agent types as needed
  return { status: 'error', output: 'Unknown agent type', context };
}

export default router;

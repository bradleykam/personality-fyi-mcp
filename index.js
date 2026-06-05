#!/usr/bin/env node
/**
 * personality.fyi MCP server
 *
 * Exposes the free personality.fyi API as MCP tools so AI agents (Claude
 * Desktop, Claude Code, ChatGPT Apps SDK, agentic frameworks) can query
 * MBTI type data and score OEJTS test answers without an API key.
 *
 * Tools exposed:
 *   - list_types          → returns 16 MBTI types
 *   - get_type_profile    → full profile for one type (strengths, drains, etc.)
 *   - get_test_items      → 32 OEJTS items + Likert scoring spec
 *   - score_test          → given an array of 32 answers (1-5), returns
 *                            computed type + per-axis confidence percentages
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE = 'https://personality.fyi/api/v1';
const ALL_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                   'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

const server = new Server(
  { name: 'personality-fyi', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_types',
      description: 'List all 16 MBTI personality types with their archetype name and short title.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_type_profile',
      description: 'Get the full profile for one MBTI type — cognitive style, strengths, shadow patterns (what to watch out for), and what drains them. Use this when a user asks about a specific personality type.',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The 4-letter MBTI code, uppercase (e.g. "INTJ", "ENFP").',
            enum: ALL_TYPES,
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'get_test_items',
      description: 'Get the 32 OEJTS (Open Extended Jungian Type Scales) test items and Likert scoring spec. Use this when you want to administer the personality.fyi test yourself or understand how the test is structured.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'score_test',
      description: 'Score an array of 32 OEJTS test answers and return the computed MBTI type with per-axis confidence percentages. Use this after collecting test answers from a user.',
      inputSchema: {
        type: 'object',
        properties: {
          answers: {
            type: 'array',
            description: 'Array of 32 integers (1-5) corresponding to the 32 test items in order. 1=Strongly disagree, 2=Slightly disagree, 3=Neutral/unsure, 4=Slightly agree, 5=Strongly agree.',
            items: { type: 'integer', minimum: 1, maximum: 5 },
            minItems: 32,
            maxItems: 32,
          },
        },
        required: ['answers'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'list_types') {
      const data = await getJSON(`${BASE}/types`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_type_profile') {
      const code = (args?.code || '').toUpperCase();
      if (!ALL_TYPES.includes(code)) throw new Error(`Unknown type: ${code}`);
      const data = await getJSON(`${BASE}/types/${code}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_test_items') {
      const data = await getJSON(`${BASE}/test/items`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'score_test') {
      const answers = args?.answers;
      const r = await fetch(`${BASE}/test/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!r.ok) {
        const errBody = await r.text();
        throw new Error(`Score endpoint returned ${r.status}: ${errBody}`);
      }
      const data = await r.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error: ${err.message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('personality.fyi MCP server running on stdio');

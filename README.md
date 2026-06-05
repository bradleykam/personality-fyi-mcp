# personality-fyi-mcp

[![MCP](https://img.shields.io/badge/MCP-server-blue)](https://modelcontextprotocol.io)
[![npm version](https://img.shields.io/npm/v/@bradleykam/personality-fyi-mcp)](https://www.npmjs.com/package/@bradleykam/personality-fyi-mcp)

An [MCP](https://modelcontextprotocol.io) server that exposes the [personality.fyi](https://personality.fyi) API as tools for AI agents.

Lets Claude Desktop, Claude Code, ChatGPT (via the Apps SDK), and other MCP-compatible agents:
- Look up any of the 16 MBTI personality types
- Administer and score the public-domain OEJTS personality test
- Access compatibility scores between any two types

All data is pulled live from `https://personality.fyi/api/v1`. No API key, no auth, no rate limits.

## Tools exposed

| Tool | Description |
|---|---|
| `list_types` | List all 16 MBTI types |
| `get_type_profile` | Full profile for one type (strengths, shadow patterns, what drains them) |
| `get_test_items` | 32 OEJTS items + Likert scoring spec |
| `score_test` | Score 32 answers, return type + confidence |

## Install

```bash
npm install -g @bradleykam/personality-fyi-mcp
```

## Use with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "personality-fyi": {
      "command": "npx",
      "args": ["-y", "@bradleykam/personality-fyi-mcp"]
    }
  }
}
```

Then ask Claude things like *"What's the MBTI compatibility between INTJ and ENFP?"* or *"Give me the personality.fyi test and let's go through it."*

## Use with Claude Code

```bash
claude mcp add personality-fyi npx @bradleykam/personality-fyi-mcp
```

## How it works

This server is a thin proxy over the free [personality.fyi API](https://personality.fyi/api). All data is static MBTI type information and OEJTS test items — no LLM calls, no user data, no tracking. The underlying OEJTS item bank is in the public domain.

## License

MIT

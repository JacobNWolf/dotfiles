import { Plugin } from "@opencode/plugin"

// Model families already covered by subscriptions (OpenAI, Claude Agent, Cursor).
// OpenRouter IDs are vendor-prefixed; Zen IDs are bare.
const METERED: Record<string, RegExp> = {
  openrouter: /^~?(openai|anthropic|x-ai)\//,
  opencode: /^(gpt|claude|grok|o\d)/,
}

export default Plugin.define({
  id: "hide-metered-duplicates",
  async setup(ctx) {
    await ctx.model.transform((editor) => {
      for (const [providerID, pattern] of Object.entries(METERED)) {
        for (const model of editor.list(providerID)) {
          if (pattern.test(model.id)) editor.remove(providerID, model.id)
        }
      }
    })
  },
})

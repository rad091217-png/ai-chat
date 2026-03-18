import { Mastra } from '@mastra/core';
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const mastra = new Mastra({});

export const claudeModel = anthropic('claude-sonnet-4-6');

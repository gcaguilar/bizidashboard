'use client';

import { useEffect } from 'react';
import { WEB_MCP_TOOLS, resolveToolNavigationTarget } from '@/lib/agent-tools';

type ExecuteResult = {
  content: Array<{ type: 'text'; text: string }>;
};

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<ExecuteResult>;
};

type ModelContextLike = {
  provideContext?: (context: { tools: WebMcpTool[]; signal?: AbortSignal }) => unknown;
  registerTool?: (tool: WebMcpTool) => { unregister?: () => void } | void;
};

declare global {
  interface Navigator {
    modelContext?: ModelContextLike;
  }
}

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = navigator.modelContext;
    if (!modelContext) {
      return;
    }

    const abortController = new AbortController();
    const registrations: Array<{ unregister?: () => void } | void> = [];
    const tools: WebMcpTool[] = WEB_MCP_TOOLS.map((tool) => ({
      ...tool,
      execute: async (input) => {
        const target = resolveToolNavigationTarget(tool.name, input);
        if (!target) {
          return {
            content: [{ type: 'text', text: `Unable to resolve a target for ${tool.name}.` }],
          };
        }

        window.location.assign(target);
        return {
          content: [{ type: 'text', text: `Opened ${target}` }],
        };
      },
    }));

    if (typeof modelContext.provideContext === 'function') {
      modelContext.provideContext({
        tools,
        signal: abortController.signal,
      });
    } else if (typeof modelContext.registerTool === 'function') {
      for (const tool of tools) {
        registrations.push(modelContext.registerTool(tool));
      }
    }

    return () => {
      abortController.abort();
      for (const registration of registrations) {
        registration?.unregister?.();
      }
    };
  }, []);

  return null;
}

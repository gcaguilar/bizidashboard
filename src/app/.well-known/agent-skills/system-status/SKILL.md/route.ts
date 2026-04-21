import { LOCAL_AGENT_SKILLS } from '@/lib/agent-skills';
import {
  buildAgentSkillsHeadResponse,
  buildAgentSkillsMarkdownResponse,
} from '@/lib/agent-skills-response';

export const dynamic = 'force-static';

export function GET(): Response {
  const content = LOCAL_AGENT_SKILLS.find((skill) => skill.name === 'system-status')?.content ?? '';
  return buildAgentSkillsMarkdownResponse(content);
}

export function HEAD(): Response {
  return buildAgentSkillsHeadResponse('text/markdown; charset=utf-8');
}

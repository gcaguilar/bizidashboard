import { getAgentSkillIndex } from '@/lib/agent-skills';
import {
  buildAgentSkillsHeadResponse,
  buildAgentSkillsJsonResponse,
} from '@/lib/agent-skills-response';

export const dynamic = 'force-static';

export function GET(): Response {
  return buildAgentSkillsJsonResponse(getAgentSkillIndex());
}

export function HEAD(): Response {
  return buildAgentSkillsHeadResponse('application/json; charset=utf-8');
}

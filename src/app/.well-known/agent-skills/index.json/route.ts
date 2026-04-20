import { NextResponse } from 'next/server';
import { getAgentSkillIndex } from '@/lib/agent-skills';

export const dynamic = 'force-static';

export function GET(): Response {
  return NextResponse.json(getAgentSkillIndex(), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

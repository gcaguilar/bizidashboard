import { LOCAL_AGENT_SKILLS } from '@/lib/agent-skills';

export const dynamic = 'force-static';

export function GET(): Response {
  const content = LOCAL_AGENT_SKILLS.find((skill) => skill.name === 'station-pages')?.content ?? '';
  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

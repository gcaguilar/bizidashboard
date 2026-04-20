import { createHash } from 'node:crypto';
import { getSiteUrl } from '@/lib/site';

type LocalSkill = {
  name: string;
  description: string;
  path: string;
  content: string;
};

function digestContent(content: string): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

export const LOCAL_AGENT_SKILLS: LocalSkill[] = [
  {
    name: 'developer-api',
    description:
      'How to use the public API, OpenAPI schema, CSV exports, and authentication surface.',
    path: '/.well-known/agent-skills/developer-api/SKILL.md',
    content: `# Developer API\n\nUse the public API via \`/api/openapi.json\` and the developers hub at \`/developers\`.\n\n## Notes\n\n- Prefer canonical public routes from \`/sitemap.xml\`.\n- Elevated public endpoints can use \`X-Public-Api-Key\` or OAuth bearer tokens with \`public_api.read\`.\n- Use \`/llms.txt\` and \`/llms-full.txt\` for discovery.\n`,
  },
  {
    name: 'system-status',
    description:
      'How to read the public system status and interpret freshness, coverage, and health.',
    path: '/.well-known/agent-skills/system-status/SKILL.md',
    content: `# System Status\n\nUse \`/estado\` for a human-readable status page and \`/api/status\` for the machine-readable payload.\n\n## Notes\n\n- The status page summarizes freshness, coverage, incidents, and versions.\n- The API response is the source for automation or monitoring.\n`,
  },
  {
    name: 'reports-archive',
    description:
      'How to navigate the monthly reports archive and canonical month pages.',
    path: '/.well-known/agent-skills/reports-archive/SKILL.md',
    content: `# Reports Archive\n\nUse \`/informes\` as the archive root and \`/informes/YYYY-MM\` for canonical monthly reports.\n\n## Notes\n\n- Sitemap entries are generated from published months only.\n- The archive is the stable place to discover report URLs.\n`,
  },
  {
    name: 'station-pages',
    description:
      'How to navigate canonical station detail pages and the public station dataset.',
    path: '/.well-known/agent-skills/station-pages/SKILL.md',
    content: `# Station Pages\n\nUse \`/estaciones/:stationId\` for canonical station pages and \`/api/stations\` for the latest system snapshot.\n\n## Notes\n\n- Prefer canonical station URLs over dashboard detail routes.\n- The station API is the fastest way to resolve current availability.\n`,
  },
];

export function getAgentSkillIndex() {
  const siteUrl = getSiteUrl();

  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: LOCAL_AGENT_SKILLS.map((skill) => ({
      name: skill.name,
      type: 'skill-md',
      description: skill.description,
      url: `${siteUrl}${skill.path}`,
      digest: digestContent(skill.content),
    })),
  };
}

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

function buildSkillContent(name: string, description: string, body: string): string {
  return `---
name: ${name}
description: ${description}
---

${body}`;
}

export const LOCAL_AGENT_SKILLS: LocalSkill[] = [
  {
    name: 'developer-api',
    description:
      'How to use the public API, OpenAPI schema, CSV exports, and authentication surface.',
    path: '/.well-known/agent-skills/developer-api/SKILL.md',
    content: buildSkillContent(
      'developer-api',
      'How to use the public API, OpenAPI schema, CSV exports, and authentication surface.',
      `# Developer API

Use the public API via \`/api/openapi.json\` and the developers hub at \`/developers\`.

## Notes

- Prefer canonical public routes from \`/sitemap.xml\`.
- Elevated public endpoints can use \`X-Public-Api-Key\` or OAuth bearer tokens with \`public_api.read\`.
- Use \`/llms.txt\` and \`/llms-full.txt\` for discovery.
`
    ),
  },
  {
    name: 'system-status',
    description:
      'How to read the public system status and interpret freshness, coverage, and health.',
    path: '/.well-known/agent-skills/system-status/SKILL.md',
    content: buildSkillContent(
      'system-status',
      'How to read the public system status and interpret freshness, coverage, and health.',
      `# System Status

Use \`/estado\` for a human-readable status page and \`/api/status\` for the machine-readable payload.

## Notes

- The status page summarizes freshness, coverage, incidents, and versions.
- The API response is the source for automation or monitoring.
`
    ),
  },
  {
    name: 'reports-archive',
    description:
      'How to navigate the monthly reports archive and canonical month pages.',
    path: '/.well-known/agent-skills/reports-archive/SKILL.md',
    content: buildSkillContent(
      'reports-archive',
      'How to navigate the monthly reports archive and canonical month pages.',
      `# Reports Archive

Use \`/informes\` as the archive root and \`/informes/YYYY-MM\` for canonical monthly reports.

## Notes

- Sitemap entries are generated from published months only.
- The archive is the stable place to discover report URLs.
`
    ),
  },
  {
    name: 'station-pages',
    description:
      'How to navigate canonical station detail pages and the public station dataset.',
    path: '/.well-known/agent-skills/station-pages/SKILL.md',
    content: buildSkillContent(
      'station-pages',
      'How to navigate canonical station detail pages and the public station dataset.',
      `# Station Pages

Use \`/estaciones/:stationId\` for canonical station pages and \`/api/stations\` for the latest system snapshot.

## Notes

- Prefer canonical station URLs over dashboard detail routes.
- The station API is the fastest way to resolve current availability.
`
    ),
  },
];

export function getAgentSkillIndex() {
  const siteUrl = getSiteUrl();

  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: LOCAL_AGENT_SKILLS.map((skill) => {
      const digest = digestContent(skill.content);

      return {
        name: skill.name,
        type: 'skill-md',
        description: skill.description,
        url: `${siteUrl}${skill.path}`,
        digest,
        sha256: digest,
      };
    }),
  };
}

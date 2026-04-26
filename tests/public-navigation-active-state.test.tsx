import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/explorar',
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

type RenderedLink = {
  label: string;
  isCurrent: boolean;
};

function extractLinks(fragment: string): RenderedLink[] {
  return [...fragment.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)].map(([, attributes, label]) => ({
    label,
    isCurrent: /aria-current="page"/.test(attributes),
  }));
}

function renderSectionNav(activeItemId: React.ComponentProps<typeof PublicSectionNav>['activeItemId']) {
  const html = renderToStaticMarkup(<PublicSectionNav activeItemId={activeItemId} />);
  const groupMatches = [
    ...html.matchAll(/<div class="flex flex-wrap items-center gap-2">([\s\S]*?)<\/div>/g),
  ];
  const mobileMatch = html.match(
    /<div class="flex flex-wrap items-center gap-2 md:hidden">([\s\S]*?)<\/div><\/nav>/
  );

  if (groupMatches.length < 2 || !mobileMatch) {
    throw new Error('Unable to parse PublicSectionNav markup');
  }

  const [mobileVisibleMarkup, mobileDetailsMarkup = ''] = mobileMatch[1].split('<details', 2);
  const overflowMatch = mobileDetailsMarkup.match(/<div class="flex flex-col gap-2">([\s\S]*?)<\/div>/);

  return {
    desktopPrimaryLinks: extractLinks(groupMatches[0][1]),
    desktopUtilityLinks: extractLinks(groupMatches[1][1]),
    mobileVisibleLinks: extractLinks(mobileVisibleMarkup),
    mobileOverflowLinks: extractLinks(overflowMatch?.[1] ?? ''),
  };
}

function getCurrentLinkLabels(links: RenderedLink[]) {
  return links.filter((link) => link.isCurrent).map((link) => link.label);
}

describe('PublicSectionNav active state', () => {
  it('marks the active primary item in the desktop primary group', () => {
    const { desktopPrimaryLinks, desktopUtilityLinks } = renderSectionNav('dashboard');

    expect(desktopPrimaryLinks.map((link) => link.label)).toEqual([
      'Inicio',
      'Explorar',
      'Informes',
      'Dashboard',
    ]);
    expect(getCurrentLinkLabels(desktopPrimaryLinks)).toEqual(['Dashboard']);
    expect(getCurrentLinkLabels(desktopUtilityLinks)).toEqual([]);
  });

  it('marks the active utility item in the desktop utility group', () => {
    const { desktopPrimaryLinks, desktopUtilityLinks } = renderSectionNav('help');

    expect(desktopUtilityLinks.map((link) => link.label)).toEqual(['Estado', 'API', 'Metodologia']);
    expect(getCurrentLinkLabels(desktopUtilityLinks)).toEqual(['Metodologia']);
    expect(getCurrentLinkLabels(desktopPrimaryLinks)).toEqual([]);
  });

  it('keeps home active in the visible mobile chips and not in overflow', () => {
    const { mobileVisibleLinks, mobileOverflowLinks } = renderSectionNav('home');

    expect(mobileVisibleLinks.map((link) => link.label)).toEqual(['Inicio', 'Explorar', 'Informes']);
    expect(getCurrentLinkLabels(mobileVisibleLinks)).toEqual(['Inicio']);
    expect(mobileOverflowLinks.map((link) => link.label)).toEqual(['Dashboard', 'Estado', 'API', 'Metodologia']);
    expect(getCurrentLinkLabels(mobileOverflowLinks)).toEqual([]);
  });

  it('keeps a utility active item visible in mobile compact navigation', () => {
    const { mobileVisibleLinks, mobileOverflowLinks } = renderSectionNav('api');

    expect(mobileVisibleLinks.map((link) => link.label)).toEqual(['Explorar', 'Informes', 'API']);
    expect(getCurrentLinkLabels(mobileVisibleLinks)).toEqual(['API']);
    expect(mobileOverflowLinks.map((link) => link.label)).toEqual(['Inicio', 'Dashboard', 'Estado', 'Metodologia']);
    expect(getCurrentLinkLabels(mobileOverflowLinks)).toEqual([]);
  });
});

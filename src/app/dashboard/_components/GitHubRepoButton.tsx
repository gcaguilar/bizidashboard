const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

type GitHubRepoButtonProps = {
  compactLabel?: string;
};

export function GitHubRepoButton({ compactLabel = 'Repo' }: GitHubRepoButtonProps) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      className="ui-icon-button gap-2"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.51v-1.78c-2.93.64-3.55-1.24-3.55-1.24-.48-1.2-1.16-1.52-1.16-1.52-.95-.64.07-.63.07-.63 1.05.08 1.6 1.08 1.6 1.08.93 1.6 2.44 1.14 3.03.87.09-.68.36-1.14.66-1.41-2.34-.27-4.79-1.17-4.79-5.21 0-1.15.41-2.08 1.08-2.81-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.89 1.07a10.05 10.05 0 0 1 5.26 0c2.01-1.35 2.88-1.07 2.88-1.07.58 1.47.22 2.56.11 2.83.67.73 1.08 1.66 1.08 2.81 0 4.05-2.46 4.93-4.81 5.2.37.33.7.97.7 1.96v2.9c0 .29.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z" />
      </svg>
      <span>{compactLabel === 'Repo' ? 'GitHub' : compactLabel}</span>
    </a>
  );
}

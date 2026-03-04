export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { initJobs } = await import('./lib/jobs');
  initJobs();
}

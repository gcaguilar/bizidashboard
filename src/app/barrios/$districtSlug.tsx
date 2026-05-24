import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/barrios/$districtSlug')({
  loader: ({ params }) => { throw redirect({ href: appRoutes.districtDetail(params.districtSlug), replace: true }); },
});

import { permanentRedirect } from 'next/navigation';
import { appRoutes } from '@/lib/routes';

export default function DashboardStatusRedirectPage() {
  permanentRedirect(appRoutes.status());
}


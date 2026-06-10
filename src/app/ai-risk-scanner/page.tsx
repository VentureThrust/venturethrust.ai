// AI Risk Scanner is removed while AI due diligence is pre-launch.
// Any direct hit to this URL is sent back to the landing page.
import { redirect } from 'next/navigation';

export default function AiRiskScannerRemoved() {
  redirect('/');
}

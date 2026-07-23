/** Twitter/X card image: same card as the Open Graph image. */
import OpengraphImage from './opengraph-image';

export const runtime = 'edge';
export const alt = 'VentureThrust: secure data rooms and Deal Watch for investors';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return OpengraphImage();
}

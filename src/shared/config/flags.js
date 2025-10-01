/** 
 * Feature gates for v1 website (all OFF by default)
 * @example
 * import { FEATURE_FLAGS } from '@shared/config/flags';
 * if (FEATURE_FLAGS.CAMERAS) {
 *   // cameras feature enabled
 * }
 */
export const FEATURE_FLAGS = {
  CAMERAS: false,
  SMARTPHONES: false,
  GADGETS: false
};
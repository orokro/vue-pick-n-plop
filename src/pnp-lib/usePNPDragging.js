import { inject } from 'vue';
import { manager as defaultManager } from './PNPDragManager';

/**
 * Returns the active PNPDragManager instance.
 *
 * When the PNP plugin is installed via `app.use(PNP)`, the plugin provides the
 * manager under the key `'pnp-manager'` and this composable returns that injected
 * instance. Fallback to the module-level singleton covers edge-cases where the
 * composable is called outside a component tree (e.g. unit tests).
 *
 * Must be called inside a component `setup()` context for inject to resolve.
 *
 * @returns {import('./PNPDragManager').PNPDragManager}
 */
export function usePNPDragging() {
	return inject('pnp-manager', defaultManager);
}

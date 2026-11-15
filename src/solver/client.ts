import * as Comlink from 'comlink';
import { Project, Slot } from '../types';
import { SolverConfig, SolverProgress, SolverResult } from './types';
import { SolverEngine } from './engine';

export class SolverClient {
  private worker: Worker | null = null;
  private remoteEngine: any = null;
  private localFallbackEngine: SolverEngine | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
          type: 'module',
        });
        this.remoteEngine = Comlink.wrap(this.worker);
      } catch (err) {
        console.warn('Worker initialization fallback to local thread:', err);
        this.localFallbackEngine = new SolverEngine();
      }
    } else {
      this.localFallbackEngine = new SolverEngine();
    }
  }

  public async solve(
    project: Project,
    config: SolverConfig,
    lockedSlots: Slot[] = [],
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult> {
    if (this.remoteEngine) {
      const progressProxy = onProgress ? Comlink.proxy(onProgress) : undefined;
      return await this.remoteEngine.solve(project, config, lockedSlots, progressProxy);
    } else if (this.localFallbackEngine) {
      return await this.localFallbackEngine.solve(project, config, lockedSlots, onProgress);
    } else {
      throw new Error('No solver engine available.');
    }
  }

  public abort(): void {
    if (this.remoteEngine) {
      this.remoteEngine.abort();
    }
    if (this.localFallbackEngine) {
      this.localFallbackEngine.abort();
    }
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.remoteEngine = null;
    }
  }
}

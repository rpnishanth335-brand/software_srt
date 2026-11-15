import * as Comlink from 'comlink';
import { SolverEngine } from './engine';

const engine = new SolverEngine();

export interface WorkerAPI {
  solve: typeof engine.solve;
  abort: typeof engine.abort;
}

Comlink.expose(engine);

import { postgresContainer } from './test-container';

// Runs once in the main process before Jest spawns workers, so parallel workers
// never race to create the reusable container on a cold start.
export default async function globalSetup() {
  await postgresContainer().start();
}

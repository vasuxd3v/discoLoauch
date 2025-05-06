/**
 * Shared map of active Auto DM Reply processes
 * This is a singleton that will be shared across all API routes that import it
 * In a production application, this would be replaced by a database or Redis store
 */
export const activeProcesses = new Map();

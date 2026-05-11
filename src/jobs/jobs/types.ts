/**
 * Shared types for job scheduling
 */

/**
 * Options for node-cron job scheduling
 * Type augmentation for node-cron 4.x options
 */
export interface CronOptions {
  scheduled?: boolean;
  timezone?: string;
  runOnInit?: boolean;
  name?: string;
  recoverMissedExecutions?: boolean;
}

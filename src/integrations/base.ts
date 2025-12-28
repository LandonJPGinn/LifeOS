/**
 * LifeOS Base Integration Interface
 *
 * Defines the common interface for all integration plugins.
 */

export interface BaseIntegration {
  /**
   * Unique identifier for this integration (e.g., 'asana', 'google-calendar').
   */
  readonly id: string;

  /**
   * Human-readable name of the integration (e.g., 'Asana', 'Google Calendar').
   */
  readonly name: string;

  /**
   * Indicates whether the integration is successfully connected and authenticated.
   */
  isConnected(): boolean;

  /**
   * Connect to the external service. This might involve authentication.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the external service.
   */
  disconnect(): Promise<void>;
}

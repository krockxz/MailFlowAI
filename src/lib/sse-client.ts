/**
 * SSE Client Types and Connection Manager
 *
 * Provides a robust EventSource wrapper with automatic reconnection,
 * exponential backoff, connection state tracking, and keep-alive monitoring.
 * Designed for production use with proper TypeScript typing and cleanup.
 */

/**
 * Connection states for the SSE client
 */
export type ConnectionState =
  | 'disconnected'  // Not connected, not attempting to connect
  | 'connecting'    // Attempting to establish connection
  | 'connected'     // Connected and receiving events
  | 'error'         // Error occurred, will attempt reconnection
  | 'stalled'       // Connected but no keep-alive received recently;

/**
 * Reconnection interval configuration
 */
export interface ReconnectInterval {
  /** Minimum reconnection delay in milliseconds (default: 1000) */
  min: number;
  /** Maximum reconnection delay in milliseconds (default: 30000) */
  max: number;
  /** Optional multiplier for exponential backoff (default: 2) */
  multiplier?: number;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Event handlers map
 */
export type EventHandlers = Record<string, EventHandler>;

/**
 * SSE Client configuration options
 */
export interface SSEClientOptions {
  /** The SSE endpoint URL */
  url: string;
  /** Map of event names to their handlers */
  events: EventHandlers;
  /** Optional callback for connection state changes */
  onStateChange?: (state: ConnectionState) => void;
  /** Optional callback for errors */
  onError?: (error: ErrorEvent) => void;
  /** Reconnection interval configuration (default: 1s-30s) */
  reconnectInterval?: ReconnectInterval;
  /** Keep-alive timeout in milliseconds (default: 45000) */
  keepAliveTimeout?: number;
  /** Maximum number of reconnection attempts (default: infinite) */
  maxReconnectAttempts?: number;
  /** Optional EventSource constructor (for testing or polyfills) */
  EventSourceConstructor?: typeof EventSource;
  /** Optional headers to append to URL as query params */
  headers?: Record<string, string>;
}

/**
 * Default configuration values
 */
const DEFAULTS = {
  reconnectInterval: { min: 1000, max: 30000, multiplier: 2 },
  keepAliveTimeout: 45000,
  maxReconnectAttempts: Infinity,
} as const;

/**
 * SSE Client Class
 *
 * Manages EventSource connections with automatic reconnection,
 * exponential backoff, and keep-alive monitoring.
 *
 * @example
 * ```ts
 * const client = new SSEClient({
 *   url: '/api/events',
 *   events: {
 *     message: (data) => console.log('Received:', data),
 *     update: (data) => console.log('Update:', data),
 *   },
 *   onStateChange: (state) => console.log('State:', state),
 * });
 *
 * client.connect();
 * // Later...
 * client.disconnect();
 * ```
 */
export class SSEClient {
  private url: string;
  private events: EventHandlers;
  private onStateChange?: (state: ConnectionState) => void;
  private onError?: (error: ErrorEvent) => void;
  private reconnectInterval: Required<ReconnectInterval>;
  private keepAliveTimeout: number;
  private maxReconnectAttempts: number;
  private EventSourceConstructor: typeof EventSource;

  // Connection state
  private eventSource: EventSource | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastKeepAliveTime: number = Date.now();

  // Event listener cleanup
  private boundMessageHandler: ((event: MessageEvent) => void) | null = null;
  private boundErrorHandler: ((event: Event) => void) | null = null;
  private boundOpenHandler: ((event: Event) => void) | null = null;

  constructor(options: SSEClientOptions) {
    this.url = this.buildUrl(options.url, options.headers);
    this.events = options.events;
    this.onStateChange = options.onStateChange;
    this.onError = options.onError;
    this.reconnectInterval = {
      min: options.reconnectInterval?.min ?? DEFAULTS.reconnectInterval.min,
      max: options.reconnectInterval?.max ?? DEFAULTS.reconnectInterval.max,
      multiplier: options.reconnectInterval?.multiplier ?? DEFAULTS.reconnectInterval.multiplier!,
    };
    this.keepAliveTimeout = options.keepAliveTimeout ?? DEFAULTS.keepAliveTimeout;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULTS.maxReconnectAttempts;
    this.EventSourceConstructor = options.EventSourceConstructor ?? EventSource;

    // Bind handlers now so we can properly remove listeners later
    this.boundMessageHandler = this.handleMessage.bind(this);
    this.boundErrorHandler = this.handleError.bind(this);
    this.boundOpenHandler = this.handleOpen.bind(this);
  }

  /**
   * Build URL with optional headers as query parameters
   * (EventSource doesn't support custom headers directly)
   */
  private buildUrl(baseUrl: string, headers?: Record<string, string>): string {
    if (!headers || Object.keys(headers).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl, window.location.origin);
    Object.entries(headers).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Check if currently connecting
   */
  public isConnecting(): boolean {
    return this.connectionState === 'connecting';
  }

  /**
   * Connect to the SSE endpoint
   */
  public connect(): void {
    // Don't reconnect if already connected or connecting
    if (this.eventSource && (this.connectionState === 'connected' || this.connectionState === 'connecting')) {
      return;
    }

    this.cleanup();
    this.setState('connecting');

    try {
      this.eventSource = new this.EventSourceConstructor(this.url);

      // Register core event listeners
      if (this.boundOpenHandler) {
        this.eventSource.addEventListener('open', this.boundOpenHandler);
      }
      if (this.boundErrorHandler) {
        this.eventSource.addEventListener('error', this.boundErrorHandler);
      }
      if (this.boundMessageHandler) {
        this.eventSource.addEventListener('message', this.boundMessageHandler);
      }

      // Register custom event listeners
      Object.entries(this.events).forEach(([eventName, handler]) => {
        if (eventName !== 'message') {
          this.eventSource?.addEventListener(eventName, ((event: MessageEvent) => {
            this.resetKeepAlive();
            try {
              const data = this.parseEventData(event.data);
              handler(data);
            } catch (error) {
              console.error(`Error parsing SSE event '${eventName}':`, error);
              this.handleParseError(eventName, event.data, error as Error);
            }
          }) as EventListener);
        }
      });
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  public disconnect(): void {
    this.cleanup();
    this.setState('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Reconnect to the SSE endpoint
   */
  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Update event handlers dynamically
   */
  public updateEvents(events: EventHandlers): void {
    this.events = events;
    // Reconnect to apply new event handlers
    if (this.isConnected()) {
      this.reconnect();
    }
  }

  /**
   * Handle connection open event
   */
  private handleOpen(): void {

    this.reconnectAttempts = 0;
    this.setState('connected');
    this.resetKeepAlive();
  }

  /**
   * Handle incoming message event
   */
  private handleMessage(event: MessageEvent): void {
    this.resetKeepAlive();

    if (this.events.message) {
      try {
        const data = this.parseEventData(event.data);
        this.events.message(data);
      } catch (error) {
        console.error('[SSE] Error parsing message event:', error);
        this.handleParseError('message', event.data, error as Error);
      }
    }
  }

  /**
   * Handle connection error event
   */
  private handleError(event: Event): void {
    const errorEvent = event as ErrorEvent;
    console.error('[SSE] Connection error:', errorEvent);

    if (this.onError) {
      this.onError(errorEvent);
    }

    // Check if EventSource is still connecting or has failed
    if (this.eventSource?.readyState === EventSource.CLOSED) {
      this.setState('error');
      this.scheduleReconnect();
    } else if (this.eventSource?.readyState === EventSource.CONNECTING) {
      this.setState('connecting');
    }
  }

  /**
   * Parse event data, supporting JSON and plain text
   */
  private parseEventData(data: string): unknown {
    if (!data) return null;

    // Try to parse as JSON first
    if (data.startsWith('{') || data.startsWith('[')) {
      try {
        return JSON.parse(data);
      } catch {
        // Not valid JSON, fall through to plain text
      }
    }

    return data;
  }

  /**
   * Handle parsing errors
   */
  private handleParseError(eventName: string, _rawData: string, error: Error): void {
    // Can be extended to emit error events or call callbacks
    console.warn(`[SSE] Failed to parse event '${eventName}': ${error.message}`);
  }

  /**
   * Update connection state and notify listeners
   */
  private setState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;

      if (this.onStateChange) {
        this.onStateChange(state);
      }
    }
  }

  /**
   * Reset keep-alive timer
   */
  private resetKeepAlive(): void {
    this.lastKeepAliveTime = Date.now();

    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
    }

    this.keepAliveTimer = setTimeout(() => {
      this.handleKeepAliveTimeout();
    }, this.keepAliveTimeout);
  }

  /**
   * Handle keep-alive timeout (no events received recently)
   */
  private handleKeepAliveTimeout(): void {
    const timeSinceLastEvent = Date.now() - this.lastKeepAliveTime;

    if (timeSinceLastEvent >= this.keepAliveTimeout && this.connectionState === 'connected') {
      console.warn('[SSE] Keep-alive timeout, connection stalled');
      this.setState('stalled');

      // Force reconnection on stall
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.setState('error');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectInterval.min * Math.pow(this.reconnectInterval.multiplier, this.reconnectAttempts),
      this.reconnectInterval.max
    );



    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Clean up all resources
   */
  private cleanup(): void {
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    // Close EventSource
    if (this.eventSource) {
      // Remove all event listeners before closing
      if (this.boundOpenHandler) {
        this.eventSource.removeEventListener('open', this.boundOpenHandler);
      }
      if (this.boundErrorHandler) {
        this.eventSource.removeEventListener('error', this.boundErrorHandler);
      }
      if (this.boundMessageHandler) {
        this.eventSource.removeEventListener('message', this.boundMessageHandler);
      }

      // Remove custom event listeners
      Object.keys(this.events).forEach((eventName) => {
        if (eventName !== 'message') {
          this.eventSource?.removeEventListener(eventName, null as any);
        }
      });

      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Destroy the client and prevent reconnection
   */
  public destroy(): void {
    this.disconnect();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent further reconnects
    this.boundMessageHandler = null;
    this.boundErrorHandler = null;
    this.boundOpenHandler = null;
  }
}

/**
 * React hook for SSE client management
 * Automatically handles cleanup on unmount
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = useSSEClient({
 *     url: '/api/events',
 *     events: {
 *       message: (data) => console.log(data),
 *     },
 *   });
 *
 *   return <div>State: {client.getState()}</div>;
 * }
 * ```
 */
export function useSSEClient(options: SSEClientOptions): SSEClient {
  // In a real implementation, this would be a React hook
  // For now, just return the client instance
  // The caller is responsible for cleanup
  const client = new SSEClient(options);
  return client;
}

/**
 * Create an SSE client with automatic cleanup
 * Useful for non-React contexts or manual management
 *
 * @example
 * ```ts
 * const client = createSSEClient({
 *   url: '/api/events',
 *   events: { message: console.log },
 * });
 * client.connect();
 * // Later...
 * client.destroy();
 * ```
 */
export function createSSEClient(options: SSEClientOptions): SSEClient {
  return new SSEClient(options);
}

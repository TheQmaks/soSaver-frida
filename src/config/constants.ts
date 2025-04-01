/**
 * Configuration constants for the SO Saver Frida script.
 */
export const Constants = {
  /**
   * Size of memory chunks to read and send (in bytes).
   */
  CHUNK_SIZE: 65536, // 64KB chunks for reading memory/file

  /**
   * Interval for periodic memory scans (in milliseconds).
   */
  SCAN_INTERVAL_MS: 10000, // 10 seconds by default

  /**
   * Delay after dlopen returns before finding the module (in milliseconds).
   */
  LOADER_HOOK_DELAY_MS: 250,
};

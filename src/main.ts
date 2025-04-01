import { Constants } from './config/constants.js';
import { MemoryScanner } from './core/memoryScanner.js';
import { ModuleDumper } from './core/moduleDumper.js';
import { LibraryLoaderHook } from './hooks/libraryLoaderHook.js';
import { Logger } from './utils/logger.js';
import { MessageSender } from './utils/messageSender.js';

/**
 * Main application class that orchestrates all components.
 */
class SoSaverApp {
  private readonly logger: Logger;
  private readonly messageSender: MessageSender;
  private readonly moduleDumper: ModuleDumper;
  private readonly memoryScanner: MemoryScanner;
  private readonly libraryLoaderHook: LibraryLoaderHook;

  /**
   * Creates a new SoSaverApp instance.
   */
  constructor() {
    this.logger = new Logger('[Frida]');
    this.messageSender = new MessageSender();
    this.moduleDumper = new ModuleDumper(this.logger, this.messageSender);
    this.memoryScanner = new MemoryScanner(this.logger, this.messageSender, this.moduleDumper);
    this.libraryLoaderHook = new LibraryLoaderHook(this.logger, this.moduleDumper);

    this.logger.log('SoSaver app initialized.');
  }

  /**
   * Performs initial dump of all currently loaded modules.
   */
  private performInitialModuleDump(): void {
    try {
      this.logger.log('Performing initial module enumeration...');
      Process.enumerateModules().forEach((module) => {
        // Dump all loaded .so modules at script start
        if (module.name.includes('.so')) {
          this.moduleDumper.dumpModule(module);
        }
      });
      this.logger.log('Initial module enumeration complete.');
    } catch (error) {
      this.logger.error(
        'Error during initial module enumeration',
        error instanceof Error ? error : new Error(String(error)),
      );
      this.messageSender.sendError(
        `Initial enumeration failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Sets up hooks on library loading functions.
   */
  private setupLibraryHooks(): void {
    this.logger.log('Setting up library load hooks...');

    // Hook common library loading functions
    this.libraryLoaderHook.hookLibraryLoader('dlopen');
    this.libraryLoaderHook.hookLibraryLoader('android_dlopen_ext'); // Android specific
    // Add other loaders here if needed (e.g., custom app loaders)

    this.logger.log('Library load hooks setup complete.');
  }

  /**
   * Starts periodic scanning for new modules and ELF headers.
   */
  private startPeriodicScanning(): void {
    this.logger.log(`Starting periodic scan every ${Constants.SCAN_INTERVAL_MS}ms...`);

    setInterval(() => {
      try {
        // Check for new modules via Process API
        this.memoryScanner.scanForNewModules();

        // Also scan memory for potential hidden/manual ELF mappings
        this.memoryScanner.scanMemoryForELF();
      } catch (error) {
        this.logger.error(
          'Error during periodic scan',
          error instanceof Error ? error : new Error(String(error)),
        );
        this.messageSender.sendError(
          `Periodic scan failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, Constants.SCAN_INTERVAL_MS);
  }

  /**
   * Starts the SoSaver application by initializing all components and scanning for modules.
   */
  public start(): void {
    this.logger.log('Starting SoSaver...');

    // 1. Initial scan for already loaded modules
    this.performInitialModuleDump();

    // 2. Hook library loading functions
    this.setupLibraryHooks();

    // 3. Start periodic scanning
    this.startPeriodicScanning();

    this.logger.log('SoSaver initialization complete. Waiting for events...');
  }
}

// Create and start the application when the script loads
try {
  const app = new SoSaverApp();
  app.start();
} catch (error) {
  console.error(
    `[Frida] Fatal error during SoSaver initialization: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

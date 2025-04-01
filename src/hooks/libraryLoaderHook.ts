import { Constants } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { ModuleDumper } from '../core/moduleDumper.js';
import { readCString } from '../utils/memoryUtils.js';

/**
 * Interface for the Interceptor context data.
 */
interface InterceptorContext {
  libpath: string | null;
}

/**
 * Class responsible for hooking library loading functions.
 */
export class LibraryLoaderHook {
  private readonly logger: Logger;
  private readonly moduleDumper: ModuleDumper;
  private readonly hookedFunctions: Set<string>;

  /**
   * Creates a new LibraryLoaderHook instance.
   *
   * @param {Logger} logger - Logger instance for output.
   * @param {ModuleDumper} moduleDumper - ModuleDumper for dumping loaded modules.
   */
  constructor(logger: Logger, moduleDumper: ModuleDumper) {
    this.logger = logger;
    this.moduleDumper = moduleDumper;
    this.hookedFunctions = new Set<string>();
  }

  /**
   * Gets all hooked function names.
   * Note: Primarily intended for diagnostic and debugging purposes.
   * This method allows inspecting which functions have been intercepted during runtime.
   *
   * @returns {Set<string>} Set of hooked function names.
   */
  public getHookedFunctions(): Set<string> {
    return new Set(this.hookedFunctions);
  }

  /**
   * Sets up an Interceptor hook on a library loading function.
   *
   * @param {string} functionName - The name of the function to hook (e.g., "dlopen").
   * @returns {boolean} True if hook was successfully placed, false otherwise.
   */
  public hookLibraryLoader(functionName: string): boolean {
    // Check if already hooked
    if (this.hookedFunctions.has(functionName)) {
      this.logger.log(`${functionName} already hooked, skipping.`);
      return true;
    }

    // Find the function's address
    const exportPtr = Module.findExportByName(null, functionName); // Search all modules
    if (exportPtr) {
      this.logger.log(`Found ${functionName} at ${exportPtr}. Attaching interceptor...`);
      try {
        // Attach the interceptor
        Interceptor.attach(exportPtr, {
          // Before the function executes
          onEnter: (args): void => {
            const thisContext = this as unknown as InterceptorContext;
            thisContext.libpath = null; // Store path in 'this' context for onLeave
            try {
              // Read library path from first argument if valid
              if (args[0] && !args[0].isNull()) {
                thisContext.libpath = readCString(args[0]);
              }
            } catch (error) {
              // Error reading args[0], logger will handle via readCString
              this.logger.warn(
                `Failed to read library path in ${functionName}.onEnter handler: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }
          },
          // After the function executes
          onLeave: (retval): void => {
            const thisContext = this as unknown as InterceptorContext;
            // retval is the handle/address returned by the loader, or null on failure
            const path = thisContext.libpath; // Get path saved from onEnter

            // Check if path looks like a library and load likely succeeded
            if (path && path.includes('.so') && retval && !retval.isNull()) {
              // Use setTimeout to delay finding the module slightly
              setTimeout(() => {
                try {
                  // Find the module by name or address
                  const module =
                    Process.findModuleByName(path) || Process.findModuleByAddress(retval);
                  if (module) {
                    this.moduleDumper.dumpModule(module); // Dump if found
                  } else {
                    // Module not found immediately, might be loaded differently or unloaded quickly
                    this.logger.warn(
                      `${functionName} finished for ${path}, but couldn't find module info immediately (handle: ${retval}). Periodic scan may find it.`,
                    );
                  }
                } catch (error) {
                  this.logger.error(
                    `Error in ${functionName}.onLeave callback for ${path}`,
                    error instanceof Error ? error : new Error(String(error)),
                  );
                }
              }, Constants.LOADER_HOOK_DELAY_MS); // Wait the configured delay
            }
          },
        }); // End Interceptor.attach

        this.hookedFunctions.add(functionName); // Mark as hooked
        this.logger.log(`Hooked ${functionName} successfully.`);
        return true;
      } catch (error) {
        // Handle error attaching the interceptor
        this.logger.error(
          `Failed to attach interceptor to ${functionName} at ${exportPtr}`,
          error instanceof Error ? error : new Error(String(error)),
        );
        return false;
      }
    } else {
      // Function not found
      this.logger.warn(`${functionName} export not found. Hook not set.`);
      return false;
    }
  }
}

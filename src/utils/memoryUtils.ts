/**
 * Utility functions for memory operations.
 */

/**
 * Read bytes from memory at the specified address.
 *
 * @param {any} address - The memory address to read from.
 * @param {number} size - Number of bytes to read.
 * @returns {ArrayBuffer} ArrayBuffer containing the read data.
 */
export function readMemoryBytes(address: NativePointer, size: number): ArrayBuffer {
  // Using a double type assertion as a workaround for TypeScript definition mismatch
  // In the actual Frida JavaScript API, Memory.readByteArray is available
  // First cast to unknown, then to the interface we need
  const memoryWithReadByteArray = Memory as unknown as {
    readByteArray(address: NativePointer, size: number): ArrayBuffer;
  };
  return memoryWithReadByteArray.readByteArray(address, size);
}

/**
 * Read a C string from memory at the specified address.
 *
 * @param {any} address - The memory address to read from.
 * @returns {string | null} The read string or null if reading failed.
 */
export function readCString(address: NativePointer): string | null {
  try {
    // Using type assertion as a workaround for TypeScript definition mismatch
    const memoryWithReadCString = Memory as unknown as {
      readCString(address: NativePointer): string | null;
    };
    return memoryWithReadCString.readCString(address);
  } catch (error) {
    console.error(
      `Failed to read C string at ${address}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

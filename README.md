# soSaver-frida

TypeScript Frida script component for the [soSaver](https://github.com/TheQmaks/sosaver) project - a tool for dumping shared libraries (.so files) from Android applications.

## Overview

This repository contains the Frida agent script portion of the soSaver tool, rewritten from JavaScript to TypeScript using a modular, object-oriented approach. The script is responsible for extracting loaded shared libraries from Android applications.

## Features

- **Memory Scanning**: Scans process memory for ELF headers to detect loaded libraries
- **Dynamic Library Hooking**: Intercepts library loading functions (`dlopen`, `android_dlopen_ext`)
- **Modular Architecture**: Clean, object-oriented design with separation of concerns
- **Robust Error Handling**: Comprehensive error handling and fallback mechanisms
- **Periodic Scanning**: Automatically detects newly loaded libraries
- **Multiple Extraction Methods**: Extracts libraries from memory or filesystem when available

## Project Structure

```
src/
├── config/
│   └── constants.ts      # Configuration constants
├── core/
│   ├── memoryScanner.ts  # Memory scanning logic for ELF headers
│   └── moduleDumper.ts   # Module extraction and data transmission
├── hooks/
│   └── libraryLoaderHook.ts # Dynamic library loader interception
├── utils/
│   ├── logger.ts         # Logging utilities
│   ├── memoryUtils.ts    # Memory reading helpers
│   └── messageSender.ts  # Communication with host
└── main.ts               # Main application entry point
```

## Integration with soSaver

This TypeScript Frida script is designed to be used as part of the [soSaver](https://github.com/TheQmaks/soSaver) project. It is injected into target Android processes by the Python component of soSaver, which handles:

- Device connection management
- Script injection
- Processing data received from this script
- Saving extracted libraries to disk
- Command line interface

**You should not use this script directly** - instead, use the soSaver Python tool which will deploy and manage this agent.

## For Developers

### Requirements

- Node.js 14+
- TypeScript 5.0+
- Yarn package manager

### Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/TheQmaks/sosaver-frida.git
   cd sosaver-frida
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Build the project:
   ```
   yarn build
   ```

### Development Commands

- **Build**: `yarn build` - Compile TypeScript to JavaScript
- **Watch Mode**: `yarn watch` - Automatically rebuild on code changes
- **Linting**: `yarn lint` - Run ESLint checks
- **Formatting**: `yarn format` - Format code with Prettier

### Configuration

You can modify constants in `src/config/constants.ts` to adjust behavior:

- `CHUNK_SIZE`: Size of memory chunks for reading/sending (default: 64KB)
- `SCAN_INTERVAL_MS`: Interval for periodic scanning (default: 10 seconds)
- `LOADER_HOOK_DELAY_MS`: Delay after dlopen returns (default: 250ms)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

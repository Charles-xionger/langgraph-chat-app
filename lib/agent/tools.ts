/**
 * @deprecated This file is deprecated. Please use tools/index.ts instead.
 *
 * Legacy tools.ts file - Re-exports from new modular structure
 *
 * Migration guide:
 * Old: import { getInternalTools } from '@/lib/agent/tools'
 * New: import { getInternalTools } from '@/lib/agent/tools'
 *
 * The new structure provides:
 * - Better separation of concerns
 * - Type-safe tool builders
 * - Flexible tool loading with registry pattern
 * - Easy to add custom tools
 */

// Re-export everything from the new modular structure
export * from "./tools/index";

// For backward compatibility, also export individual tool builders
import { WeatherToolBuilder } from "./tools/weather";
import { CalculatorToolBuilder } from "./tools/calculator";
import { SearchWebToolBuilder } from "./tools/search";

/**
 * @deprecated Use ToolLoader instead
 */
export const getWeatherTool = new WeatherToolBuilder().build();

/**
 * @deprecated Use ToolLoader instead
 */
export const calculator = new CalculatorToolBuilder().build();

/**
 * @deprecated Use ToolLoader instead
 */
export const searchWebTool = new SearchWebToolBuilder().build();

/**
 * Project configuration loader for Catspeak.
 * Reads catspeak.config.json from the workspace root.
 * Supports importing API definitions from YAML/JSON files (like OpenAPI specs).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GML_BUILTINS } from './gmlBuiltins';
import { GML_ALL_NAMES } from './gmlNames';

export interface ProjectVariable {
  name: string;
  type?: string;
  description?: string;
}

export interface ProjectFunction {
  name: string;
  params?: string[];
  returns?: string;
  description?: string;
}

export interface ProjectConfig {
  /** Path to a YAML/JSON API file to import (relative to workspace root) */
  import?: string | string[];
  /** Custom global variables */
  globals?: ProjectVariable[];
  /** Custom functions */
  functions?: ProjectFunction[];
  /** Names to suppress undefined warnings for */
  knownNames?: string[];
}

/** Set of all project-defined names */
export const projectNames: Set<string> = new Set();

/** Map of project-defined names to hover info */
export const projectHoverInfo: Map<string, { signature: string; description: string; kind: string }> = new Map();

/**
 * Load catspeak.config.json from a workspace folder.
 */
export function loadProjectConfig(workspacePath: string): ProjectConfig | null {
  const configPath = path.join(workspacePath, 'catspeak.config.json');
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config: ProjectConfig = JSON.parse(raw);
    applyConfig(config, workspacePath);
    return config;
  } catch (e) {
    console.error(`Failed to load catspeak.config.json: ${e}`);
    return null;
  }
}

function isGml(name: string): boolean {
  return GML_BUILTINS.has(name) || GML_ALL_NAMES.has(name);
}

function addName(name: string, signature: string, description: string, kind: string): void {
  if (isGml(name)) return; // skip GML builtins
  projectNames.add(name);
  if (!projectHoverInfo.has(name)) {
    projectHoverInfo.set(name, { signature, description, kind });
  }
}

function applyConfig(config: ProjectConfig, workspacePath: string): void {
  projectNames.clear();
  projectHoverInfo.clear();

  // Load imports first
  if (config.import) {
    const imports = Array.isArray(config.import) ? config.import : [config.import];
    for (const imp of imports) {
      loadApiFile(path.resolve(workspacePath, imp));
    }
  }

  if (config.globals) {
    for (const v of config.globals) {
      addName(v.name, v.name, v.description ?? 'Project global variable.', v.type ? `variable : ${v.type}` : 'variable');
    }
  }

  if (config.functions) {
    for (const f of config.functions) {
      const params = f.params ? f.params.join(', ') : '...';
      const returns = f.returns ?? 'Any';
      addName(f.name, `${f.name}(${params}) → ${returns}`, f.description ?? 'Project function.', 'function');
    }
  }

  if (config.knownNames) {
    for (const name of config.knownNames) {
      if (!isGml(name)) projectNames.add(name);
    }
  }
}

/**
 * Load a YAML or JSON API file and extract names from it.
 * Supports the OpenAPI-style format used by STONKS-9800 and similar games.
 */
function loadApiFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`API file not found: ${filePath}`);
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    let data: any;
    if (ext === '.yaml' || ext === '.yml') {
      data = yaml.load(raw);
    } else {
      data = JSON.parse(raw);
    }
    if (data && typeof data === 'object') {
      extractFromApiData(data);
    }
  } catch (e) {
    console.error(`Failed to load API file ${filePath}: ${e}`);
  }
}

/**
 * Extract function/variable names from an OpenAPI-style YAML structure.
 */
function extractFromApiData(data: any): void {
  // Walk components.schemas sections
  const schemas = data?.components?.schemas;
  if (!schemas || typeof schemas !== 'object') {
    // Try flat structure — just walk all top-level keys
    walkSection(data);
    return;
  }

  for (const sectionName of Object.keys(schemas)) {
    const section = schemas[sectionName];
    if (section && typeof section === 'object') {
      walkSection(section);
    }
  }
}

/**
 * Walk a section of the API data and extract names.
 */
function walkSection(section: any): void {
  if (!section || typeof section !== 'object') return;

  for (const name of Object.keys(section)) {
    const entry = section[name];
    if (!entry || typeof entry !== 'object') continue;
    if (!entry.description && !entry.syntax && !entry.example) continue;

    // Skip GML builtins
    if (isGml(name)) continue;

    const desc = entry.description ?? '';
    const syntax = entry.syntax ?? name;
    const returns = entry.returns ?? '';
    const params = entry.parameters;

    if (params && Array.isArray(params)) {
      // It's a function
      const paramStr = params.map((p: string) => {
        // Extract just the param name from "name: type - desc" format
        const match = p.match(/^(\w+)/);
        return match ? match[1] : p;
      }).join(', ');
      const ret = returns || 'Any';
      addName(name, `${name}(${paramStr}) → ${ret}`, desc, 'function');
    } else if (syntax && syntax.includes('(')) {
      // Has a function-like syntax
      addName(name, syntax.replace(/→.*$/, '').trim() + (returns ? ` → ${returns}` : ''), desc, 'function');
    } else {
      // It's a variable/constant
      addName(name, name, desc, 'variable');
    }
  }
}

/**
 * Format hover content for a project-defined name.
 */
export function formatProjectHover(name: string): string | null {
  const info = projectHoverInfo.get(name);
  if (!info) return null;

  let md = `🎮 **Project Definition**\n\n`;
  md += `\`\`\`catspeak\n${info.signature}\n\`\`\`\n\n`;
  md += info.description;
  return md;
}

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadProjectConfig,
  projectNames,
  projectHoverInfo,
  formatProjectHover,
} from './projectConfig';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'catspeak-test-'));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, 'utf-8');
}

afterEach(() => {
  // Clear state between tests
  projectNames.clear();
  projectHoverInfo.clear();
});

describe('loadProjectConfig', () => {
  test('returns null when no config file exists', () => {
    const dir = makeTmpDir();
    expect(loadProjectConfig(dir)).toBeNull();
    expect(projectNames.size).toBe(0);
  });

  test('loads globals from config', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      globals: [
        { name: 'player_hp', type: 'Real', description: 'Player health points' },
        { name: 'game_score' },
      ],
    }));
    const config = loadProjectConfig(dir);
    expect(config).not.toBeNull();
    expect(projectNames.has('player_hp')).toBe(true);
    expect(projectNames.has('game_score')).toBe(true);
    expect(projectHoverInfo.get('player_hp')?.description).toBe('Player health points');
  });

  test('loads functions from config', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      functions: [
        { name: 'my_custom_func', params: ['a', 'b'], returns: 'Real', description: 'Adds two numbers' },
      ],
    }));
    loadProjectConfig(dir);
    expect(projectNames.has('my_custom_func')).toBe(true);
    const info = projectHoverInfo.get('my_custom_func');
    expect(info).toBeDefined();
    expect(info!.signature).toContain('a, b');
    expect(info!.signature).toContain('Real');
    expect(info!.kind).toBe('function');
  });

  test('loads knownNames from config', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      knownNames: ['some_game_thing', 'another_thing'],
    }));
    loadProjectConfig(dir);
    expect(projectNames.has('some_game_thing')).toBe(true);
    expect(projectNames.has('another_thing')).toBe(true);
    // knownNames don't get hover info
    expect(projectHoverInfo.has('some_game_thing')).toBe(false);
  });

  test('skips GML builtins in globals', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      globals: [
        { name: 'draw_text', description: 'should be skipped' },
        { name: 'my_custom_var', description: 'should be kept' },
      ],
    }));
    loadProjectConfig(dir);
    // draw_text is a GML builtin, should not be in project names
    expect(projectHoverInfo.has('draw_text')).toBe(false);
    expect(projectNames.has('my_custom_var')).toBe(true);
  });

  test('skips GML builtins in knownNames', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      knownNames: ['abs', 'my_thing'],
    }));
    loadProjectConfig(dir);
    // abs is GML, should not be added to projectNames
    expect(projectNames.has('abs')).toBe(false);
    expect(projectNames.has('my_thing')).toBe(true);
  });

  test('handles invalid JSON gracefully', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', '{ broken json');
    const config = loadProjectConfig(dir);
    expect(config).toBeNull();
  });
});

describe('YAML import', () => {
  test('imports functions from YAML file', () => {
    const dir = makeTmpDir();
    const yamlContent = `
components:
  schemas:
    myFunctions:
      custom_notify:
        description: "Shows a notification"
        syntax: "custom_notify(msg)"
        parameters:
          - "msg: string - The message"
        returns: "void"
`;
    writeFile(dir, 'api.yaml', yamlContent);
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: 'api.yaml' }));
    loadProjectConfig(dir);
    expect(projectNames.has('custom_notify')).toBe(true);
    const info = projectHoverInfo.get('custom_notify');
    expect(info).toBeDefined();
    expect(info!.kind).toBe('function');
    expect(info!.description).toBe('Shows a notification');
  });

  test('imports variables from YAML file', () => {
    const dir = makeTmpDir();
    const yamlContent = `
components:
  schemas:
    globals:
      "global.money":
        description: "Player money"
        example: "let m = global.money"
`;
    writeFile(dir, 'api.yaml', yamlContent);
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: 'api.yaml' }));
    loadProjectConfig(dir);
    expect(projectNames.has('global.money')).toBe(true);
    expect(projectHoverInfo.get('global.money')?.kind).toBe('variable');
  });

  test('skips GML builtins from YAML import', () => {
    const dir = makeTmpDir();
    const yamlContent = `
components:
  schemas:
    funcs:
      draw_text:
        description: "Should be skipped"
        syntax: "draw_text(x, y, str)"
        parameters:
          - "x: number"
          - "y: number"
          - "str: string"
        returns: "void"
      my_game_func:
        description: "Custom game function"
        syntax: "my_game_func()"
        returns: "void"
`;
    writeFile(dir, 'api.yaml', yamlContent);
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: 'api.yaml' }));
    loadProjectConfig(dir);
    expect(projectHoverInfo.has('draw_text')).toBe(false);
    expect(projectNames.has('my_game_func')).toBe(true);
  });

  test('supports multiple imports', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'a.yaml', `
components:
  schemas:
    sec:
      func_a:
        description: "From file A"
        syntax: "func_a()"
`);
    writeFile(dir, 'b.yaml', `
components:
  schemas:
    sec:
      func_b:
        description: "From file B"
        syntax: "func_b()"
`);
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: ['a.yaml', 'b.yaml'] }));
    loadProjectConfig(dir);
    expect(projectNames.has('func_a')).toBe(true);
    expect(projectNames.has('func_b')).toBe(true);
  });

  test('handles missing import file gracefully', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: 'nonexistent.yaml' }));
    const config = loadProjectConfig(dir);
    expect(config).not.toBeNull();
    expect(projectNames.size).toBe(0);
  });

  test('imports JSON API files too', () => {
    const dir = makeTmpDir();
    const jsonApi = {
      components: {
        schemas: {
          funcs: {
            json_func: {
              description: 'From JSON',
              syntax: 'json_func(x)',
              parameters: ['x: number'],
              returns: 'Real',
            },
          },
        },
      },
    };
    writeFile(dir, 'api.json', JSON.stringify(jsonApi));
    writeFile(dir, 'catspeak.config.json', JSON.stringify({ import: 'api.json' }));
    loadProjectConfig(dir);
    expect(projectNames.has('json_func')).toBe(true);
    expect(projectHoverInfo.get('json_func')?.kind).toBe('function');
  });

  test('loads the real STONKS_9800_api.yaml', () => {
    // Use the actual test file in the repo
    const repoRoot = path.resolve(__dirname, '..', '..');
    const configDir = makeTmpDir();
    const yamlSrc = path.join(repoRoot, 'test', 'STONKS_9800_api.yaml');
    if (!fs.existsSync(yamlSrc)) return; // skip if not present

    fs.copyFileSync(yamlSrc, path.join(configDir, 'api.yaml'));
    writeFile(configDir, 'catspeak.config.json', JSON.stringify({ import: 'api.yaml' }));
    loadProjectConfig(configDir);

    // mods_notify is a game-specific function, not GML
    expect(projectNames.has('mods_notify')).toBe(true);
    expect(projectHoverInfo.get('mods_notify')?.description).toContain('notification');

    // draw_text IS GML, should be skipped
    expect(projectHoverInfo.has('draw_text')).toBe(false);

    // global.money should be loaded
    expect(projectNames.has('global.money')).toBe(true);
  });
});

describe('formatProjectHover', () => {
  test('returns null for unknown name', () => {
    expect(formatProjectHover('nonexistent')).toBeNull();
  });

  test('formats hover for a project function', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      functions: [{ name: 'my_func', params: ['x'], returns: 'Real', description: 'Does stuff' }],
    }));
    loadProjectConfig(dir);
    const hover = formatProjectHover('my_func');
    expect(hover).not.toBeNull();
    expect(hover).toContain('🎮');
    expect(hover).toContain('my_func');
    expect(hover).toContain('Does stuff');
  });

  test('formats hover for a project variable', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'catspeak.config.json', JSON.stringify({
      globals: [{ name: 'my_var', type: 'String', description: 'A string var' }],
    }));
    loadProjectConfig(dir);
    const hover = formatProjectHover('my_var');
    expect(hover).not.toBeNull();
    expect(hover).toContain('my_var');
    expect(hover).toContain('A string var');
  });
});

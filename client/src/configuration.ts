import * as vscode from 'vscode';

/**
 * Configuration interface for Catspeak extension settings
 */
export interface CatspeakConfiguration {
  /** Enable or disable semantic highlighting */
  semanticHighlighting: boolean;
  
  /** Diagnostic severity level for reporting issues */
  diagnosticSeverity: 'error' | 'warning' | 'hint';
  
  /** Formatting options */
  formatting: {
    /** Number of spaces per indentation level */
    indentSize: number;
    /** Use tabs instead of spaces */
    useTabs: boolean;
  };
  
  /** Enable or disable auto-closing brackets */
  autoClosingBrackets: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: CatspeakConfiguration = {
  semanticHighlighting: true,
  diagnosticSeverity: 'warning',
  formatting: {
    indentSize: 2,
    useTabs: false
  },
  autoClosingBrackets: true
};

/**
 * Configuration manager for Catspeak extension
 * Handles reading and monitoring VSCode settings
 */
export class ConfigurationManager {
  private disposables: vscode.Disposable[] = [];
  private changeHandlers: Array<(config: CatspeakConfiguration) => void> = [];
  
  constructor() {
    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('catspeak')) {
          const config = this.getConfiguration();
          this.notifyHandlers(config);
        }
      })
    );
  }
  
  /**
   * Get current Catspeak configuration from VSCode settings
   * @returns Current configuration with defaults applied
   */
  getConfiguration(): CatspeakConfiguration {
    const config = vscode.workspace.getConfiguration('catspeak');
    
    return {
      semanticHighlighting: config.get<boolean>(
        'semanticHighlighting',
        DEFAULT_CONFIG.semanticHighlighting
      ),
      diagnosticSeverity: config.get<'error' | 'warning' | 'hint'>(
        'diagnosticSeverity',
        DEFAULT_CONFIG.diagnosticSeverity
      ),
      formatting: {
        indentSize: config.get<number>(
          'formatting.indentSize',
          DEFAULT_CONFIG.formatting.indentSize
        ),
        useTabs: config.get<boolean>(
          'formatting.useTabs',
          DEFAULT_CONFIG.formatting.useTabs
        )
      },
      autoClosingBrackets: config.get<boolean>(
        'autoClosingBrackets',
        DEFAULT_CONFIG.autoClosingBrackets
      )
    };
  }
  
  /**
   * Register a handler to be called when configuration changes
   * @param handler Callback function to invoke on configuration change
   * @returns Disposable to unregister the handler
   */
  onConfigurationChanged(
    handler: (config: CatspeakConfiguration) => void
  ): vscode.Disposable {
    this.changeHandlers.push(handler);
    
    return new vscode.Disposable(() => {
      const index = this.changeHandlers.indexOf(handler);
      if (index >= 0) {
        this.changeHandlers.splice(index, 1);
      }
    });
  }
  
  /**
   * Notify all registered handlers of configuration change
   * @param config The new configuration
   */
  private notifyHandlers(config: CatspeakConfiguration): void {
    for (const handler of this.changeHandlers) {
      try {
        handler(config);
      } catch (error) {
        console.error('Error in configuration change handler:', error);
      }
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.changeHandlers = [];
  }
}

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';
import { ConfigurationManager } from './configuration';

/**
 * Language client manager for Catspeak extension
 * Manages the lifecycle of the language server
 */
export class LanguageClientManager {
  private client: LanguageClient | undefined;
  private outputChannel: vscode.OutputChannel;
  private context: vscode.ExtensionContext;
  private configManager: ConfigurationManager;
  
  constructor(
    context: vscode.ExtensionContext,
    configManager: ConfigurationManager
  ) {
    this.context = context;
    this.configManager = configManager;
    this.outputChannel = vscode.window.createOutputChannel('Catspeak Language Server');
  }
  
  /**
   * Start the language server
   * @returns Promise that resolves to the language client
   */
  async startServer(): Promise<LanguageClient> {
    if (this.client) {
      this.outputChannel.appendLine('Language server already running');
      return this.client;
    }
    
    try {
      this.outputChannel.appendLine('Starting Catspeak language server...');
      
      // Get the server module path
      const serverModule = this.context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
      );
      
      // Configure server options
      const serverOptions: ServerOptions = {
        run: {
          module: serverModule,
          transport: TransportKind.ipc
        },
        debug: {
          module: serverModule,
          transport: TransportKind.ipc,
          options: {
            execArgv: ['--nolazy', '--inspect=6009']
          }
        }
      };
      
      // Configure client options
      const clientOptions: LanguageClientOptions = {
        // Register the server for Catspeak documents
        documentSelector: [
          {
            scheme: 'file',
            language: 'catspeak'
          }
        ],
        synchronize: {
          // Synchronize configuration changes to the server
          configurationSection: 'catspeak',
          // Notify the server about file changes to .meow files
          fileEvents: vscode.workspace.createFileSystemWatcher('**/*.meow')
        },
        outputChannel: this.outputChannel,
        // Pass initial configuration to server
        initializationOptions: this.configManager.getConfiguration()
      };
      
      // Create the language client
      this.client = new LanguageClient(
        'catspeakLanguageServer',
        'Catspeak Language Server',
        serverOptions,
        clientOptions
      );
      
      // Start the client (this will also launch the server)
      await this.client.start();
      
      this.outputChannel.appendLine('Catspeak language server started successfully');
      
      // Forward configuration changes to the server
      this.context.subscriptions.push(
        this.configManager.onConfigurationChanged((config) => {
          if (this.client) {
            this.client.sendNotification('workspace/didChangeConfiguration', {
              settings: { catspeak: config }
            });
          }
        })
      );
      
      return this.client;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Failed to start language server: ${errorMessage}`);
      
      // Show error notification to user
      vscode.window.showErrorMessage(
        `Failed to start Catspeak Language Server: ${errorMessage}`
      );
      
      throw error;
    }
  }
  
  /**
   * Stop the language server
   */
  async stopServer(): Promise<void> {
    if (!this.client) {
      this.outputChannel.appendLine('Language server is not running');
      return;
    }
    
    try {
      this.outputChannel.appendLine('Stopping Catspeak language server...');
      await this.client.stop();
      this.client = undefined;
      this.outputChannel.appendLine('Catspeak language server stopped successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Error stopping language server: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Restart the language server
   */
  async restartServer(): Promise<void> {
    this.outputChannel.appendLine('Restarting Catspeak language server...');
    
    try {
      await this.stopServer();
      await this.startServer();
      this.outputChannel.appendLine('Catspeak language server restarted successfully');
      
      vscode.window.showInformationMessage('Catspeak Language Server restarted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Error restarting language server: ${errorMessage}`);
      
      vscode.window.showErrorMessage(
        `Failed to restart Catspeak Language Server: ${errorMessage}`
      );
      
      throw error;
    }
  }
  
  /**
   * Get the current language client instance
   * @returns The language client or undefined if not running
   */
  getClient(): LanguageClient | undefined {
    return this.client;
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}

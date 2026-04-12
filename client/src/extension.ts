import * as vscode from 'vscode';
import { ConfigurationManager } from './configuration';
import { LanguageClientManager } from './languageClient';

let configManager: ConfigurationManager | undefined;
let clientManager: LanguageClientManager | undefined;

/**
 * Activates the Catspeak extension.
 * This function is called when a .meow file is opened.
 * 
 * @param context - The extension context provided by VSCode
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Initialize configuration manager
    configManager = new ConfigurationManager();
    context.subscriptions.push(configManager);
    
    // Initialize language client manager
    clientManager = new LanguageClientManager(context, configManager);
    context.subscriptions.push(clientManager);
    
    // Start the language server
    await clientManager.startServer();
    
    // Register restart command
    context.subscriptions.push(
      vscode.commands.registerCommand('catspeak.restartServer', async () => {
        if (clientManager) {
          await clientManager.restartServer();
        }
      })
    );
    
    const activationTime = Date.now() - startTime;
    console.log(`Catspeak extension activated in ${activationTime}ms`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to activate Catspeak extension: ${errorMessage}`);
    
    // Show error notification to user
    vscode.window.showErrorMessage(
      `Failed to start Catspeak Language Server: ${errorMessage}`
    );
    
    throw error;
  }
}

/**
 * Deactivates the Catspeak extension.
 * This function is called when the extension is deactivated.
 * Performs cleanup by stopping the language server.
 */
export async function deactivate(): Promise<void> {
  if (clientManager) {
    try {
      await clientManager.stopServer();
      console.log('Catspeak extension deactivated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error during deactivation: ${errorMessage}`);
    }
  }
}

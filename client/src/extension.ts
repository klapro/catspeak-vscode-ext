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

    // Register init config command
    context.subscriptions.push(
      vscode.commands.registerCommand('catspeak.initConfig', async () => {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
          vscode.window.showErrorMessage('Open a workspace folder first.');
          return;
        }
        const configUri = vscode.Uri.joinPath(folders[0].uri, 'catspeak.config.json');
        try {
          await vscode.workspace.fs.stat(configUri);
          const overwrite = await vscode.window.showWarningMessage(
            'catspeak.config.json already exists. Overwrite?', 'Yes', 'No'
          );
          if (overwrite !== 'Yes') return;
        } catch {
          // File doesn't exist, good
        }
        const template = JSON.stringify({
          "$schema": "https://raw.githubusercontent.com/klapro/catspeak-vscode-ext/main/catspeak.config.schema.json",
          "import": [],
          "globals": [
            { "name": "global.my_variable", "type": "Real", "description": "My custom global variable" }
          ],
          "functions": [
            { "name": "my_custom_func", "params": ["arg1", "arg2"], "returns": "void", "description": "My custom function" }
          ],
          "knownNames": []
        }, null, 2) + '\n';
        await vscode.workspace.fs.writeFile(configUri, Buffer.from(template));
        const doc = await vscode.workspace.openTextDocument(configUri);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Created catspeak.config.json — add your project definitions and restart the language server.');
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

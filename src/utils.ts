import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from "child_process";


export function getBinaryPath(context: vscode.ExtensionContext): string {
    const binName = 'dbuf-lsp';
    return path.join(context.extensionPath, 'bin', binName);
}

function isCargoInstalled(): boolean {
    try {
        execSync('cargo --version');
        return true;
    } catch {
        return false;
    }
}

export async function installBinary(context: vscode.ExtensionContext): Promise<boolean> {
    const repoUrl = 'https://github.com/DependoBuf/dependobuf.git';
    const binName = 'dbuf-lsp';

    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: "Installing LSP",
    }, async (process) => {
        try {
            process.report({ increment: 0 });
            execSync(`cargo install --git ${repoUrl} --root . --bin ${binName} `, { cwd: context.extensionPath });
            process.report({ increment: 100 });
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install language server: ${error}`);
            return false;
        }
    });
}

export async function setupLanguageServer(context: vscode.ExtensionContext): Promise<boolean> {
    const binaryPath = getBinaryPath(context);

    if (fs.existsSync(binaryPath)) {
        return true;
    }

    const response = await vscode.window.showErrorMessage(
        'Dbuf LSP is required for the extension. Install it?',
        'Yes', 'No'
    );

    if (response !== 'Yes') {
        return false;
    }

    if (!isCargoInstalled()) {
        const response = await vscode.window.showErrorMessage(
            'Rust (cargo) is required to build the language server. Install it first?',
            'Open Rust Installation Page'
        );
        if (response === 'Open Rust Installation Page') {
            vscode.env.openExternal(vscode.Uri.parse('https://www.rust-lang.org/tools/install'));
        }
        return false;
    }

    const success = await installBinary(context);
    if (success) {
        vscode.window.showInformationMessage('Language server successfully installed!');
    }
    return success;
}



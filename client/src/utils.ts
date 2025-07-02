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

export async function buildBinary(context: vscode.ExtensionContext): Promise<boolean> {
    const repoUrl = 'https://github.com/DependoBuf/dependobuf.git';
    const buildDir = path.join(context.extensionPath, 'server-build');


    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: "Downloading LSP",
    }, async (process) => {
        try {
            process.report({ message: `clonning dbuf lsp to ${buildDir}`, increment: 0 });
            if (!fs.existsSync(buildDir)) {
                execSync(`git clone ${repoUrl} ${buildDir}`);
            } else {
                execSync(`git -C ${buildDir} pull`);
            }

            process.report({ message: `building with cargo`, increment: 15 });
            execSync(`cargo build --release`, { cwd: buildDir });
            const binDir = path.join(context.extensionPath, 'bin');
            await fs.ensureDir(binDir);

            process.report({ message: `clonning binary`, increment: 80 });
            const srcBinary = path.join(buildDir, 'target', 'release', 'dbuf-lsp');
            const destBinary = getBinaryPath(context);
            await fs.copy(srcBinary, destBinary);

            fs.chmodSync(destBinary, 0o755); // chmod +x
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to build language server: ${error}`);
            return false;
        } finally {
            process.report({ message: `removing build dir`, increment: 90 });
            fs.removeSync(buildDir);
            process.report({ message: `done`, increment: 100 });
        }
    });
}

export async function setupLanguageServer(context: vscode.ExtensionContext): Promise<boolean> {
    const binaryPath = getBinaryPath(context);

    if (fs.existsSync(binaryPath)) {
        return true;
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

    const success = await buildBinary(context);
    if (success) {
        vscode.window.showInformationMessage('Language server successfully built!');
    }
    return success;
}



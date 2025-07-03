import * as vscode from "vscode";
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';
import { spawn } from 'child_process';

import * as utils from "./utils";

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand('dependobuf.installLSP', async () => {
        await utils.installBinary(context);
        vscode.window.showInformationMessage("DBuf: LSP installed");
    });

    const success = await utils.setupLanguageServer(context);
    if (!success) {
        return;
    }

    const server = spawn(utils.getBinaryPath(context));
    server.on('error', (err) => {
        console.log(`server creation error:\n  ${err}`);
    });
    server.stderr.on("data", (data) => {
        console.log(`${data}`);
    });
    server.on('close', (code) => {
        console.log(`server closed with code: ${code}`);
    });

    const serverOptions: ServerOptions = () => {
        return Promise.resolve(server);
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'dbuf' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.dbuf')
        }
    };

    client = new LanguageClient(
        'dbufServer',
        'DBuf Language Server',
        serverOptions,
        clientOptions
    );

    vscode.window.showInformationMessage(`Starting LSP server`);
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

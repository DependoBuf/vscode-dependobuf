import * as vscode from "vscode";
import { workspace, ExtensionContext } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';
import { spawn } from 'child_process';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    vscode.window.showInformationMessage(`Starting LSP server`)

    const server = spawn("dbuf-lsp")

    server.on('error', (err) => {
        console.log(`server creation error:\n  ${err}`)
    })
    server.stderr.on("data", (data) => {
        console.log(`${data}`)
    })
    server.on('close', (code) => {
        console.log(`server closed with code: ${code}`)
    })

    const serverOptions: ServerOptions = () => {
        return Promise.resolve(server);
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'dbuf' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.dbuf')
        }
    };

    client = new LanguageClient(
        'dbufServer',
        'DBuf Language Server',
        serverOptions,
        clientOptions
    );

    client

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

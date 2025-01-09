import * as vscode from "vscode";
import { workspace, ExtensionContext } from 'vscode';
import * as net from 'net';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo
} from 'vscode-languageclient/node';
import path = require('path');
import { spawn, SpawnOptions, spawnSync } from 'child_process';
import { log } from 'console';

let client: LanguageClient;



export function activate(context: ExtensionContext) {
	vscode.window.showInformationMessage(`Starting LSP server`)

	const log = vscode.window.createOutputChannel("lsp-logs")
	log.show() // delete in future
	log.appendLine("log window created")
	
	const server_path = context.asAbsolutePath(path.join('server'));
	const options: SpawnOptions = {
		cwd: server_path
	};
	const server = spawn("cargo", ["run"], options)

	server.on('error', (err) => {
		log.appendLine(`server creation error: ${err}`)
	})
	server.stderr.on("data", (data) => {
		log.append(`${data}`)
	})
	server.on('close', (code) => {
		log.appendLine(`server closed with code: ${code}`)
	})
	log.appendLine("server created")
	log.appendLine("--------------")

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

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

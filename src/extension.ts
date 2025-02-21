import * as vscode from 'vscode';
import { CustomPanel } from './panels/CustomPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('扩展 "custom-theme-panel" 已激活');

    // 注册命令
    let disposable = vscode.commands.registerCommand('cnc-panel.openPanel', () => {
        CustomPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);

    // 自动打开面板
    CustomPanel.createOrShow(context.extensionUri);
}

export function deactivate() {}

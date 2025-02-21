import * as vscode from 'vscode';

export class CustomPanel {
    public static currentPanel: CustomPanel | undefined;
    private static readonly viewType = 'customThemePanel';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // 设置WebView的HTML内容
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

        // 监听WebView面板的关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 处理来自WebView的消息
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two; // 固定在右侧显示

        if (CustomPanel.currentPanel) {
            CustomPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            CustomPanel.viewType,
            '机床控制面板',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true // 保持面板内容，避免切换时重新加载
            }
        );

        CustomPanel.currentPanel = new CustomPanel(panel, extensionUri);
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `
            <!DOCTYPE html>
            <html lang="zh">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>机床控制面板</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: 'Segoe UI', sans-serif;
                    }
                    .container {
                        padding: 15px;
                        padding-top: 45px;
                    }
                    .tabs {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        display: flex;
                        background-color: var(--vscode-editor-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding: 0 15px;
                        z-index: 1000;
                        height: 40px;
                    }
                    .tab {
                        padding: 10px 20px;
                        cursor: pointer;
                        background: none;
                        border: none;
                        color: var(--vscode-foreground);
                        border-bottom: 2px solid transparent;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        opacity: 0.7;
                        margin-top: 2px;
                    }
                    .tab.active {
                        border-bottom: 2px solid var(--vscode-button-background);
                        color: var(--vscode-button-background);
                        opacity: 1;
                    }
                    .tab-content {
                        display: none;
                    }
                    .tab-content.active {
                        display: block;
                    }
                    .coordinate-display {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 6px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .coordinate-row {
                        display: flex;
                        align-items: center;
                        margin: 8px 0;
                        background: rgba(0,0,0,0.2);
                        padding: 8px;
                        border-radius: 4px;
                    }
                    .coordinate-label {
                        width: 30px;
                        font-weight: bold;
                        color: #00ff00;
                        font-family: 'Consolas', monospace;
                        font-size: 16px;
                    }
                    .coordinate-value {
                        flex: 1;
                        color: #00ff00;
                        font-family: 'Consolas', monospace;
                        text-align: right;
                        padding-right: 15px;
                        font-size: 16px;
                    }
                    .button-group {
                        border: 1px solid var(--vscode-panel-border);
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 6px;
                        background: var(--vscode-editor-background);
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .group-title {
                        margin: -15px -15px 15px -15px;
                        padding: 10px 15px;
                        background: var(--vscode-titleBar-activeBackground);
                        color: var(--vscode-titleBar-activeForeground);
                        font-size: 13px;
                        font-weight: 500;
                        border-top-left-radius: 6px;
                        border-top-right-radius: 6px;
                        display: flex;
                        align-items: center;
                    }
                    .grid-buttons {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .icon-button {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 12px 8px;
                        background-color: var(--vscode-button-secondaryBackground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .icon-button:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                        transform: translateY(-1px);
                    }
                    .icon-button span {
                        font-size: 12px;
                        margin-top: 5px;
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .axis-controls {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .axis-button {
                        padding: 15px;
                        font-size: 14px;
                        font-weight: 500;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    }
                    .axis-button:hover {
                        transform: translateY(-1px);
                    }
                    .slider-container {
                        background: var(--vscode-editor-background);
                        padding: 20px;
                        border-radius: 6px;
                        border: 1px solid var(--vscode-panel-border);
                        margin: 20px 0;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        position: relative;
                        z-index: 1;
                    }
                    .slider-container input[type="range"] {
                        width: 100%;
                        height: 20px;
                        -webkit-appearance: none;
                        background: linear-gradient(to right, #4CAF50 0%, #4CAF50 50%, #666 50%, #666 100%);
                        border-radius: 10px;
                        margin: 10px 0;
                        cursor: pointer;
                    }
                    .slider-container input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 28px;
                        height: 28px;
                        background: white;
                        border: 2px solid #4CAF50;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                    .slider-container input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    }
                    .slider-labels {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 10px;
                    }
                    .slider-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #4CAF50;
                        text-align: center;
                        margin: 10px 0;
                        font-family: 'Consolas', monospace;
                    }
                    .slider-title {
                        font-size: 14px;
                        color: var(--vscode-foreground);
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .operation-buttons {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                    }
                    .operation-button {
                        padding: 12px;
                        font-size: 14px;
                        font-weight: 500;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    }
                    .operation-button:hover {
                        transform: translateY(-1px);
                    }
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 24px;
                        margin-top: 8px;
                    }
                    .switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: var(--vscode-button-secondaryBackground);
                        transition: .4s;
                        border-radius: 24px;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 18px;
                        width: 18px;
                        left: 3px;
                        bottom: 3px;
                        background-color: var(--vscode-button-foreground);
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .slider {
                        background-color: var(--vscode-button-background);
                    }
                    input:checked + .slider:before {
                        transform: translateX(26px);
                    }
                </style>
            </head>
            <body>
                <div class="tabs">
                    <button class="tab active" onclick="showTab(event, 'control')">基础控制</button>
                    <button class="tab" onclick="showTab(event, 'settings')">轴设置</button>
                </div>
                
                <div class="container">
                    <div id="control" class="tab-content active">
                        <div class="coordinate-display">
                            <div class="coordinate-row">
                                <span class="coordinate-label">X</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">6000 mm/min</span>
                            </div>
                            <div class="coordinate-row">
                                <span class="coordinate-label">Y</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">6000 mm/min</span>
                            </div>
                            <div class="coordinate-row">
                                <span class="coordinate-label">Z</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">0.000</span>
                                <span class="coordinate-value">1200 mm/min</span>
                            </div>
                        </div>

                        <div class="slider-container">
                            <div class="slider-title">进给倍率调节</div>
                            <div class="slider-value">50%</div>
                            <input type="range" min="0" max="100" value="50" class="slider" id="speedSlider">
                            <div class="slider-labels">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div class="axis-controls">
                            <button onclick="sendMessage('Z+')" class="axis-button">Z+</button>
                            <button onclick="sendMessage('Y+')" class="axis-button">Y+</button>
                            <button onclick="sendMessage('X+')" class="axis-button">X+</button>
                            
                            <button onclick="sendMessage('高速')" class="axis-button">高速</button>
                            <button onclick="sendMessage('停止')" class="axis-button">停止</button>
                            <button onclick="sendMessage('复位')" class="axis-button">复位</button>
                            
                            <button onclick="sendMessage('Z-')" class="axis-button">Z-</button>
                            <button onclick="sendMessage('Y-')" class="axis-button">Y-</button>
                            <button onclick="sendMessage('X-')" class="axis-button">X-</button>
                        </div>

                        <div class="operation-buttons">
                            <button onclick="sendMessage('启动')" class="operation-button" style="background-color: #4CAF50; color: white;">启动</button>
                            <button onclick="sendMessage('停止')" class="operation-button" style="background-color: #f44336; color: white;">停止</button>
                            <button onclick="sendMessage('单段')" class="operation-button" style="background-color: #ff9800; color: white;">单段</button>
                            <button onclick="sendMessage('手轮')" class="operation-button" style="background-color: #2196F3; color: white;">手轮</button>
                        </div>
                    </div>

                    <div id="settings" class="tab-content">
                        <div class="button-group">
                            <div class="group-title">回零动作</div>
                            <div class="grid-buttons">
                                <button class="icon-button" onclick="sendMessage('X轴回零')">
                                    <span>X轴回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('Y轴回零')">
                                    <span>Y轴回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('Z轴回零')">
                                    <span>Z轴回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('W轴回零')">
                                    <span>W轴回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('A轴回零')">
                                    <span>A轴回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('B轴回零')">
                                    <span>B轴回零</span>
                                </button>
                            </div>
                            <div class="grid-buttons" style="grid-template-columns: repeat(5, 1fr);">
                                <button class="icon-button" onclick="sendMessage('全部回零')">
                                    <span>全部回零</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('直接设定')">
                                    <span>直接设定</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('回固定点')">
                                    <span>回固定点</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('回零设置')">
                                    <span>回零设置</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('编码器检测')">
                                    <span>编码器检测</span>
                                </button>
                            </div>
                        </div>

                        <div class="button-group">
                            <div class="group-title">龙门校正</div>
                            <div class="grid-buttons" style="grid-template-columns: repeat(2, 1fr);">
                                <button class="icon-button" onclick="sendMessage('龙门初始化')">
                                    <span>龙门初始化</span>
                                </button>
                                <div class="icon-button">
                                    <span>龙门回零自动校正</span>
                                    <label class="switch">
                                        <input type="checkbox" onchange="sendMessage('龙门回零自动校正: ' + (this.checked ? 'ON' : 'OFF'))">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="button-group">
                            <div class="group-title">轴基准设定</div>
                            <div class="grid-buttons">
                                <button class="icon-button" onclick="sendMessage('X轴基准')">
                                    <span>X轴基准</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('Y轴基准')">
                                    <span>Y轴基准</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('Z轴基准')">
                                    <span>Z轴基准</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('A轴基准')">
                                    <span>A轴基准</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('B轴基准')">
                                    <span>B轴基准</span>
                                </button>
                                <button class="icon-button" onclick="sendMessage('全部基准')">
                                    <span>全部基准</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function sendMessage(text) {
                        vscode.postMessage({
                            command: 'alert',
                            text: \`操作：\${text}\`
                        });
                    }

                    function showTab(event, tabId) {
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        document.querySelectorAll('.tab').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        document.getElementById(tabId).classList.add('active');
                        event.target.classList.add('active');
                    }

                    document.getElementById('speedSlider').addEventListener('input', function(e) {
                        document.querySelector('.slider-value').textContent = e.target.value + '%';
                        const percent = e.target.value;
                        this.style.background = \`linear-gradient(to right, #4CAF50 0%, #4CAF50 \${percent}%, #666 \${percent}%, #666 100%)\`;
                        sendMessage(\`设置进给倍率：\${percent}%\`);
                    });

                    // 初始化滑块背景
                    const slider = document.getElementById('speedSlider');
                    slider.style.background = \`linear-gradient(to right, #4CAF50 0%, #4CAF50 50%, #666 50%, #666 100%)\`;
                </script>
            </body>
            </html>
        `;
    }

    public dispose() {
        CustomPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

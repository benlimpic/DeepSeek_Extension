import * as vscode from "vscode";
import ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "deepseek-r1-local.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Seek Chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.type === "chat") {
          const userPrompt =
            "Never show me anything between the <think></think> tags." +
            message.text;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:latest",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {
            if (err instanceof Error) {
              responseText = `Error: ${err.message}`;
            } else {
              responseText = "An unknown error occurred.";
            }
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
		<style>

			body { font-family: sans-serif; margin: 1rem; }
			#prompt {
				width: 100%;
				box-sizing:
				border-box;}
			#response {
				border: 1px solid #ccc;
				margin-top: 1rem;
				padding: 0.5rem;
				min-height: 100px;
				overflow: auto;}
			#loading {
				display: none;
				border: 6px solid #f3f3f3;
				border-top: 6px solid #3498db;
				border-radius: 50%;
				width: 120px;
				height: 120px;
				animation: spin 2s linear infinite;}
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg);}}

		</style>
	</head>
	<body>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>


		<h2>Deep Search</h2>
		<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br />
		<button id="askBtn" type="button" class="btn btn-primary">Action!</button>
		<div id="loading"></div>
		<div id="response"></div>
	
	<script>
			const vscode = acquireVsCodeApi();
			const prompt = document.getElementById("prompt");
			const askBtn = document.getElementById("askBtn");
			const loading = document.getElementById("loading");
			const response = document.getElementById("response");

			askBtn.addEventListener("click", () => {
				const text = prompt.value;
				loading.style.display = "block";
				vscode.postMessage({ type: "chat", text });
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if ( command === 'chatResponse') {
					loading.style.display = "none";
					response.innerText = text;
				}
			})
		</script>
	</body>
	</html>`;
}

export function deactivate() {}

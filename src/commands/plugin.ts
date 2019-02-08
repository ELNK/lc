// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IQuickItemEx } from "../shared";
import { Endpoint, languages } from "../shared";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { deleteCache } from "./cache";

export async function switchDefaultLanguage(): Promise<void> {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    const language: string | undefined = await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use" });
    if (!language) {
        return;
    }
    leetCodeConfig.update("defaultLanguage", language, true);
}

export async function switchEndpoint(): Promise<void> {
    const isCnEnbaled: boolean = getLeetCodeEndpoint() === Endpoint.LeetCodeCN;
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        {
            label: `${isCnEnbaled ? "" : "$(check) "}LeetCode`,
            description: "leetcode.com",
            detail: `Enable LeetCode US`,
            value: Endpoint.LeetCode,
        },
        {
            label: `${isCnEnbaled ? "$(check) " : ""}力扣`,
            description: "leetcode-cn.com",
            detail: `启用中国版 LeetCode`,
            value: Endpoint.LeetCodeCN,
        },
    );
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice) {
        return;
    }
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    try {
        const endpoint: string = choice.value;
        await leetCodeExecutor.switchEndpoint(endpoint);
        await leetCodeConfig.update("endpoint", endpoint, true /* UserSetting */);
        vscode.window.showInformationMessage(`Switched the endpoint to ${endpoint}`);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch endpoint. Please open the output channel for details.", DialogType.error);
    }

    try {
        await vscode.commands.executeCommand("leetcode.signout");
        await deleteCache();
        await promptForSignIn();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details.", DialogType.error);
    }
}

export function getLeetCodeEndpoint(): string {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return leetCodeConfig.get<string>("endpoint", Endpoint.LeetCode);
}

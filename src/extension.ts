import type {
    ExtensionContext, OutputChannel, StatusBarItem} from 'vscode';
import {
    StatusBarAlignment,
    commands, env, window
} from 'vscode';

import { dirname } from 'path';

import { initL10n, t } from './localize';

import { File } from './node_utility/File';
import { ResourceManager } from './ResourceManager';

import { stat } from 'fs';
import { ProjectExplorer } from './ui/ProjectExplorer';
import type { IView } from './core/IView';

let myStatusBarItem: StatusBarItem;
let channel: OutputChannel;

export function activate(context: ExtensionContext) {
    initL10n(context);
    console.info('---- keil-assistant actived >>>  ----');
    channel ??= window.createOutputChannel('keil-vscode');
    myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 200);
    myStatusBarItem.command = 'statusbar.project';

    const testKeilRoot = ResourceManager.getInstance(context).getKeilRootDir("MDK");

    stat(testKeilRoot, (err, stat) => {
        if (err || !stat.isDirectory()) {
            channel.show();
            channel.appendLine(`Error: Please set keil root Path, ${err}`);
            window.showErrorMessage(`Error: Please set keil root Path, ${err}`);
        }
    });

    const prjExplorer = new ProjectExplorer(context, channel, myStatusBarItem);
    const subscriber = context.subscriptions;

    subscriber.push(commands.registerCommand('explorer.open', async () => {
        const uri = await window.showOpenDialog({
            openLabel: t('Open keil uVision project'),
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'keilProjectXml': ['uvproj', 'uvprojx', 'uvmpw']
            }
        });

        try {
            if (uri && uri.length > 0) {

                // load project
                const uvPrjPath = uri[0].fsPath;

                await prjExplorer.openProject(uvPrjPath, false);
                // switch workspace
                const msg = t('keil project load done ! switch workspace ?');
                const result = await window.showInformationMessage(msg, t('Ok'), t('Later'));

                if (result === t('Ok')) {
                   prjExplorer.openWorkspace(new File(dirname(uvPrjPath)));
                }
            }
        } catch (error) {
            const errMsg = t('Open project failed! msg');

            window.showErrorMessage(`${errMsg}: ${(error as Error).message}`);
        }
    }));

    subscriber.push(commands.registerCommand('project.close', (item: IView) => prjExplorer.closeProject(item.prjID)));

    subscriber.push(commands.registerCommand('project.build', (item: IView) => prjExplorer.getTarget(item)?.build()));

    subscriber.push(commands.registerCommand('project.rebuild', (item: IView) => prjExplorer.getTarget(item)?.rebuild()));

    subscriber.push(commands.registerCommand('project.download', (item: IView) => prjExplorer.getTarget(item)?.download()));

    subscriber.push(commands.registerCommand('item.copyValue', (item: IView) => env.clipboard.writeText(item.tooltip ?? '')));

    subscriber.push(commands.registerCommand('project.switch', (item: IView) => prjExplorer.switchTargetByProject(item)));

    subscriber.push(commands.registerCommand('project.active', (item: IView) => prjExplorer.activeProject(item)));

    subscriber.push(commands.registerCommand('statusbar.project', async () => {
        void prjExplorer.statusBarSwitchTargetByProject();
    }));

    subscriber.push(commands.registerCommand('project.generateCompileCommandsJson',
        (item: IView) => prjExplorer.getTarget(item)?.updateCompileCommands()
    ));

    subscriber.push(myStatusBarItem);

    void prjExplorer.loadWorkspace();
    console.info('---- keil-assistant actived <<<< ----');
}

export function deactivate() {
    // console.log('---- keil-assistant closed ----');
    channel.dispose();
}

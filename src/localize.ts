import type { ExtensionContext } from 'vscode';
import { env } from 'vscode';
import * as nodeL10n from '@vscode/l10n';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let initialized = false;

/**
 * VS Code 1.70.2 没有内置的 vscode.l10n API，这里直接使用 @vscode/l10n
 * 读取扩展自带的 bundle，保证旧版本上仍能显示本地化文案。
 */
export function initL10n(context: ExtensionContext): void {
    if (initialized) {
        return;
    }
    initialized = true;

    const bundleDir = join(context.extensionPath, 'l10n');
    const locale = env.language.toLowerCase();
    const localeBundle = join(bundleDir, `bundle.l10n.${locale}.json`);
    const defaultBundle = join(bundleDir, 'bundle.l10n.json');
    const bundlePath = locale !== 'en' && existsSync(localeBundle) ? localeBundle : defaultBundle;

    if (!existsSync(bundlePath)) {
        return;
    }

    try {
        nodeL10n.config({ contents: JSON.parse(readFileSync(bundlePath, 'utf8')) });
    } catch (error) {
        console.warn(`[keil-assistant] Failed to load localization bundle: ${error}`);
    }
}

export function t(message: string): string {
    return nodeL10n.t(message);
}

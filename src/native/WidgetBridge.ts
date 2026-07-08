import { registerPlugin } from '@capacitor/core';
import type { WidgetPlaybackData } from '../utils/widgetSync';

export interface WidgetBridgePlugin {
  updateWidget(options: WidgetPlaybackData): Promise<void>;
  refreshWidgets(): Promise<void>;
}

export const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge', {
  web: () => import('./WidgetBridge.web').then((m) => new m.WidgetBridgeWeb()),
});

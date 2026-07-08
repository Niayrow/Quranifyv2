import { WebPlugin } from '@capacitor/core';
import type { WidgetBridgePlugin } from './WidgetBridge';
import type { WidgetPlaybackData } from '../utils/widgetSync';
import { writeWidgetDataToWeb } from '../utils/widgetSync';

export class WidgetBridgeWeb extends WebPlugin implements WidgetBridgePlugin {
  async updateWidget(options: WidgetPlaybackData): Promise<void> {
    writeWidgetDataToWeb(options);
  }

  async refreshWidgets(): Promise<void> {
    // No-op on web.
  }
}

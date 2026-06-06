import { useEffect } from 'react';

export function useTelegramTheme() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Apply Telegram theme colors
      const style = document.documentElement.style;
      const themeParams = tg.themeParams;

      if (themeParams) {
        if (themeParams.bg_color) style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        if (themeParams.text_color) style.setProperty('--tg-theme-text-color', themeParams.text_color);
        if (themeParams.hint_color) style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
        if (themeParams.button_color) style.setProperty('--tg-theme-button-color', themeParams.button_color);
        if (themeParams.button_text_color) style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
        if (themeParams.secondary_bg_color) style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
      }
    }
  }, []);
}

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export function getTelegramUser() {
  try {
    const webapp = window.Telegram?.WebApp;
    if (webapp?.initDataUnsafe?.user) {
      return webapp.initDataUnsafe.user;
    }
  } catch {}
  return { id: 0, username: 'test', first_name: 'Test', last_name: '' };
}

export function initTelegramWebApp() {
  try {
    const webapp = window.Telegram?.WebApp;
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }
  } catch {}
}

export function openChannel(channelUsername: string) {
  try {
    const webapp = window.Telegram?.WebApp;
    if (webapp) {
      webapp.openTelegramLink(`https://t.me/${channelUsername.replace('@', '')}`);
    } else {
      window.open(`https://t.me/${channelUsername.replace('@', '')}`, '_blank');
    }
  } catch {}
}

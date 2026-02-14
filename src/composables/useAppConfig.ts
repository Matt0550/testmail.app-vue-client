
import { ref, watch } from 'vue';
import type { AppConfig } from '@models/config';

const STORAGE_KEY = 'testmail_config_v2';

const DEFAULT_CONFIG: AppConfig = {
  apiKey: '',
  namespace: '',
  refreshInterval: 30,
  liveQuery: false,
  defaultLimit: 10
};

export function useAppConfig() {
  // initialize from localStorage synchronously
  const initial: AppConfig = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AppConfig) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  })();

  const config = ref<AppConfig>(initial);

  // persist on change
  watch(
    config,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch {
        /* ignore */
      }
    },
    { deep: true }
  );

  const setConfig = (next: AppConfig) => {
    config.value = next;
  };

  return { config, setConfig };
}

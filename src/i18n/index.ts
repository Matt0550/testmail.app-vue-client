import { createI18n } from "vue-i18n"
import en from "./locales/en.json"

export const savedLocale = localStorage.getItem('user_language') || "en";

export default createI18n({
  locale: savedLocale,
  fallbackLocale: "en",
  legacy: false,
  globalInjection: true,
  messages: {
    en
  },
})
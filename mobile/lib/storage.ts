import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "budgetbot_auth_token";
const USER_KEY = "budgetbot_user";

const isWeb = Platform.OS === "web";

export const storage = {
  async getToken(): Promise<string | null> {
    if (isWeb) return localStorage.getItem(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (isWeb) { localStorage.setItem(TOKEN_KEY, token); return; }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    if (isWeb) { localStorage.removeItem(TOKEN_KEY); return; }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getUser(): Promise<any | null> {
    const data = isWeb
      ? localStorage.getItem(USER_KEY)
      : await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any): Promise<void> {
    const json = JSON.stringify(user);
    if (isWeb) { localStorage.setItem(USER_KEY, json); return; }
    await SecureStore.setItemAsync(USER_KEY, json);
  },

  async removeUser(): Promise<void> {
    if (isWeb) { localStorage.removeItem(USER_KEY); return; }
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clear(): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const LANG_KEY = "budgetbot_language";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginFormState {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  errors: { email?: string; password?: string };
  loading: boolean;
  apiError: string;
  handleLogin: () => Promise<void>;
  navigateToForgotPassword: () => void;
}

export interface RegisterFormState {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  errors: { name?: string; email?: string; password?: string };
  loading: boolean;
  apiError: string;
  handleRegister: () => Promise<void>;
}

export function useAuthScreen(
  onLogin: (email: string, password: string) => Promise<any>,
  onRegister: (name: string, email: string, password: string) => Promise<any>
) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [language, setLanguage] = useState<"en" | "ru">("en");

  React.useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === "ru" || val === "en") setLanguage(val);
    });
  }, []);

  const toggleLanguage = async () => {
    const next = language === "en" ? "ru" : "en";
    setLanguage(next);
    await AsyncStorage.setItem(LANG_KEY, next);
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginApiError, setLoginApiError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regErrors, setRegErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regApiError, setRegApiError] = useState("");

  const validateLogin = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) errs.email = "Email is required";
    else if (!emailRegex.test(loginEmail)) errs.email = "Invalid email format";
    if (!loginPassword) errs.password = "Password is required";
    else if (loginPassword.length < 6) errs.password = "Min 6 characters";
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = (): boolean => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!regName.trim()) errs.name = "Name is required";
    if (!regEmail.trim()) errs.email = "Email is required";
    else if (!emailRegex.test(regEmail)) errs.email = "Invalid email format";
    if (!regPassword) errs.password = "Password is required";
    else if (regPassword.length < 6) errs.password = "Min 6 characters";
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoginLoading(true);
    setLoginApiError("");
    try {
      await onLogin(loginEmail.trim().toLowerCase(), loginPassword);
    } catch (error: any) {
      setLoginApiError(error.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setRegLoading(true);
    setRegApiError("");
    try {
      await onRegister(
        regName.trim(),
        regEmail.trim().toLowerCase(),
        regPassword
      );
    } catch (error: any) {
      setRegApiError(error.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  const navigateToForgotPassword = () => {
    navigation.navigate("PasswordRecovery");
  };

  const login: LoginFormState = {
    email: loginEmail,
    setEmail: setLoginEmail,
    password: loginPassword,
    setPassword: setLoginPassword,
    errors: loginErrors,
    loading: loginLoading,
    apiError: loginApiError,
    handleLogin,
    navigateToForgotPassword,
  };

  const register: RegisterFormState = {
    name: regName,
    setName: setRegName,
    email: regEmail,
    setEmail: setRegEmail,
    password: regPassword,
    setPassword: setRegPassword,
    errors: regErrors,
    loading: regLoading,
    apiError: regApiError,
    handleRegister,
  };

  return {
    activeTab,
    setActiveTab,
    language,
    toggleLanguage,
    login,
    register,
  };
}

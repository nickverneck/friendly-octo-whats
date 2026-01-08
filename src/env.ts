function requireEnv(name: string): string {
  const value = Bun.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    googleClientId: requireEnv("GOOGLE_CLIENT_ID"),
    googleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    googleRedirectUri: Bun.env.GOOGLE_REDIRECT_URI ?? "",
    googleRefreshToken: requireEnv("GOOGLE_REFRESH_TOKEN"),
    wassengerApiToken: requireEnv("WASSENGER_API_TOKEN"),
    wassengerDeviceId: Bun.env.WASSENGER_DEVICE_ID ?? "",
  };
}

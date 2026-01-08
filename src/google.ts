import { google } from "googleapis";
import { getEnv } from "./env";

let cachedAuth: ReturnType<typeof google.auth.OAuth2> | null = null;

export function getGoogleAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }
  const env = getEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri || undefined
  );
  oauth2Client.setCredentials({
    refresh_token: env.googleRefreshToken,
  });
  google.options({ auth: oauth2Client });
  cachedAuth = oauth2Client;
  return oauth2Client;
}

export function getCalendarClient() {
  getGoogleAuth();
  return google.calendar("v3");
}

export function getSheetsClient() {
  getGoogleAuth();
  return google.sheets("v4");
}

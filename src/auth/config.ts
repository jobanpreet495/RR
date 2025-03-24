import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "bf464573-527c-4057-b6ae-25b23dbbaeec",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: `${window.location.protocol}//${window.location.host}/`
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        console.log(message);
      },
      piiLoggingEnabled: false
    }
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"]
}; 
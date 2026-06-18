let config = {
  token: "",
  baseUrl: "http://4.224.186.213",
};

/**
 * Configure the logger with an access token and server base URL.
 * @param {Object} userConfig 
 * @param {string} userConfig.token - The authorization Bearer token.
 * @param {string} [userConfig.baseUrl] - Optional override for the test server URL.
 */
export function setupLogger(userConfig) {
  config = { ...config, ...userConfig };
}

/**
 * Log message and send it to the Test Server.
 * Signature matches pre-test setup specification: Log(stack, level, package, message)
 * @param {string} stack - 'backend' | 'frontend'
 * @param {string} level - 'debug' | 'info' | 'warn' | 'error' | 'fatal'
 * @param {string} pkg - The package name (e.g. 'api', 'component', 'auth')
 * @param {string} message - Descriptive context message
 */
export async function Log(stack, level, pkg, message) {
  const normalizedStack = String(stack).toLowerCase();
  const normalizedLevel = String(level).toLowerCase();
  const normalizedPackage = String(pkg).toLowerCase();
  
  // Truncate message to 48 characters to respect server validation constraints
  let rawMessage = String(message);
  if (rawMessage.length > 48) {
    rawMessage = rawMessage.substring(0, 45) + "...";
  }

  // Fallback console log for immediate local visibility
  const consoleMsg = `[${normalizedStack.toUpperCase()}][${normalizedLevel.toUpperCase()}][${normalizedPackage}] ${rawMessage}`;
  if (normalizedLevel === "error" || normalizedLevel === "fatal") {
    console.error(consoleMsg);
  } else if (normalizedLevel === "warn") {
    console.warn(consoleMsg);
  } else {
    console.log(consoleMsg);
  }

  // Get token from config
  const token = config.token || (typeof process !== "undefined" ? process.env.ACCESS_TOKEN : "") || "";
  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${config.baseUrl}/evaluation-service/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        stack: normalizedStack,
        level: normalizedLevel,
        package: normalizedPackage,
        message: rawMessage,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Logger API Error] Failed to send log to server: ${response.status} - ${errText}`);
    } else {
      const resData = await response.json();
      return resData;
    }
  } catch (error) {
    console.error(`[Logger API Error] Network error when sending log:`, error.message);
  }
}

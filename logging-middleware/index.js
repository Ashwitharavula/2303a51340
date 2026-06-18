let config = {
  token: "",
  baseUrl: "http://4.224.186.213",
};

export function setupLogger(userConfig) {
  config = { ...config, ...userConfig };
}

export async function Log(stack, level, pkg, message) {
  const normalizedStack = String(stack).toLowerCase();
  const normalizedLevel = String(level).toLowerCase();
  const normalizedPackage = String(pkg).toLowerCase();
  
  let rawMessage = String(message);
  if (rawMessage.length > 48) {
    rawMessage = rawMessage.substring(0, 45) + "...";
  }

  const consoleMsg = `[${normalizedStack.toUpperCase()}][${normalizedLevel.toUpperCase()}][${normalizedPackage}] ${rawMessage}`;
  if (normalizedLevel === "error" || normalizedLevel === "fatal") {
    console.error(consoleMsg);
  } else if (normalizedLevel === "warn") {
    console.warn(consoleMsg);
  } else {
    console.log(consoleMsg);
  }

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

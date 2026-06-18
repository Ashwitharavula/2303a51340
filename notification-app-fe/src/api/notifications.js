import { Log, setupLogger } from "../../../logging-middleware/index.js";

const BASE_URL = "";

const credentials = {
  email: "2303a51340@sru.edu.in",
  name: "ashwitha",
  rollNo: "2303a51340",
  accessCode: "bDreAq",
  clientID: "61684965-f87c-4d18-a2d4-5889d583c40b",
  clientSecret: "punXjvcJbnBYezdD",
};

let tokenCache = {
  token: null,
  expiresAt: 0,
};

async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  try {
    const res = await fetch(`${BASE_URL}/evaluation-service/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      throw new Error(`Auth API returned status ${res.status}`);
    }

    const data = await res.json();
    tokenCache = {
      token: data.access_token,
      expiresAt: data.expires_in || (now + 3600), // Default 1 hour if not specified
    };

    // Configure the logging middleware with the new token
    setupLogger({ token: data.access_token, baseUrl: BASE_URL });
    
    await Log("frontend", "info", "auth", "Frontend authenticated successfully.");
    return tokenCache.token;
  } catch (error) {
    console.error("Auth error:", error.message);
    await Log("frontend", "fatal", "auth", `Auth failed: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch notifications from the evaluation service.
 * Supports limit, page, and notification_type parameters.
 */
export async function fetchNotifications({ page = 1, limit = 10, type = "" } = {}) {
  try {
    const token = await getAuthToken();

    let url = `${BASE_URL}/evaluation-service/notifications?page=${page}&limit=${limit}`;
    if (type && type !== "All") {
      url += `&notification_type=${type}`;
    }

    await Log("frontend", "debug", "api", `Fetching notifications Page ${page}`);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      await Log("frontend", "error", "api", `Fetch failed: ${res.status}`);
      throw new Error(`Server returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    await Log("frontend", "info", "api", `Loaded ${data.notifications?.length || 0} items.`);

    // Returns total count and list of notifications
    return {
      notifications: data.notifications || [],
      // The API returns total notifications or we calculate page items
      // Let's assume pagination info is sent. The endpoint provides paginated notifications.
      // If we don't have total count in response, we calculate it or infer it.
      // Typically, the evaluation service returns a set of notifications. Let's return raw data.
      total: data.total || (data.notifications || []).length, 
    };
  } catch (error) {
    await Log("frontend", "error", "api", `Fetch error: ${error.message}`);
    throw error;
  }
}

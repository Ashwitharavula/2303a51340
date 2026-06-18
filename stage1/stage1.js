import { Log, setupLogger } from "../logging-middleware/index.js";

const BASE_URL = "http://4.224.186.213";

// User Credentials
const credentials = {
  email: "2303a51340@sru.edu.in",
  name: "ashwitha",
  rollNo: "2303a51340",
  accessCode: "bDreAq",
  clientID: "61684965-f87c-4d18-a2d4-5889d583c40b",
  clientSecret: "punXjvcJbnBYezdD",
};

// Priority Weights: Placement > Result > Event
const typeWeights = {
  placement: 3,
  result: 2,
  event: 1,
};

async function authenticate() {
  console.log("Authenticating with Test Server...");
  try {
    const res = await fetch(`${BASE_URL}/evaluation-service/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      throw new Error(`Authentication failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("Authenticated successfully!");
    return data.access_token;
  } catch (error) {
    console.error("Failed to authenticate:", error.message);
    throw error;
  }
}

async function run() {
  try {
    // 1. Authenticate to get a fresh Bearer token
    const token = await authenticate();

    // 2. Set up the Logging Middleware with the token
    setupLogger({ token, baseUrl: BASE_URL });

    // 3. Log initial startup of Stage 1
    await Log("backend", "info", "auth", "Stage 1 script started and authenticated successfully.");

    // 4. Fetch notifications from the protected endpoint
    console.log("Fetching notifications from server...");
    const res = await fetch(`${BASE_URL}/evaluation-service/notifications`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      await Log("backend", "error", "service", `Failed to fetch notifications: ${res.status} - ${errText}`);
      throw new Error(`Failed to fetch notifications: ${res.status}`);
    }

    const data = await res.json();
    const rawNotifications = data.notifications || [];
    console.log(`Fetched ${rawNotifications.length} notifications.`);
    await Log("backend", "info", "service", `Fetched ${rawNotifications.length} notifications from test server.`);

    // 5. Priority Sorting Algorithm
    // Sort logic: Placement (3) > Result (2) > Event (1), then Recency (Timestamp descending)
    const sortedNotifications = [...rawNotifications].sort((a, b) => {
      const typeA = String(a.Type).toLowerCase();
      const typeB = String(b.Type).toLowerCase();

      const weightA = typeWeights[typeA] || 0;
      const weightB = typeWeights[typeB] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight first
      }

      // If weights are equal, sort by Timestamp descending (most recent first)
      const dateA = new Date(a.Timestamp.replace(" ", "T"));
      const dateB = new Date(b.Timestamp.replace(" ", "T"));
      return dateB - dateA;
    });

    // 6. Select top 10 notifications
    const top10 = sortedNotifications.slice(0, 10);

    // 7. Output results in a clean table format
    console.log("\n=================== PRIORITY INBOX (TOP 10) ===================");
    console.table(
      top10.map((n, idx) => ({
        Rank: idx + 1,
        ID: n.ID,
        Type: n.Type,
        Timestamp: n.Timestamp,
        Message: n.Message,
      }))
    );
    console.log("===============================================================\n");

    // 8. Log successful completion
    await Log("backend", "info", "utils", "Priority Inbox top 10 notifications computed and printed.");
  } catch (error) {
    console.error("Critical error in execution:", error.message);
    await Log("backend", "fatal", "middleware", `Critical execution failure: ${error.message}`);
  }
}

run();

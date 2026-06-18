import { Log, setupLogger } from "../logging-middleware/index.js";

const BASE_URL = "http://4.224.186.213";

const credentials = {
  email: "2303a51340@sru.edu.in",
  name: "ashwitha",
  rollNo: "2303a51340",
  accessCode: "bDreAq",
  clientID: "61684965-f87c-4d18-a2d4-5889d583c40b",
  clientSecret: "punXjvcJbnBYezdD",
};

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
    const token = await authenticate();

    setupLogger({ token, baseUrl: BASE_URL });

    await Log("backend", "info", "auth", "Stage 1 script started and authenticated successfully.");

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

    const sortedNotifications = [...rawNotifications].sort((a, b) => {
      const typeA = String(a.Type).toLowerCase();
      const typeB = String(b.Type).toLowerCase();

      const weightA = typeWeights[typeA] || 0;
      const weightB = typeWeights[typeB] || 0;

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      const dateA = new Date(a.Timestamp.replace(" ", "T"));
      const dateB = new Date(b.Timestamp.replace(" ", "T"));
      return dateB - dateA;
    });

    const top10 = sortedNotifications.slice(0, 10);

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

    await Log("backend", "info", "utils", "Priority Inbox top 10 notifications computed and printed.");
  } catch (error) {
    console.error("Critical error in execution:", error.message);
    await Log("backend", "fatal", "middleware", `Critical execution failure: ${error.message}`);
  }
}

run();

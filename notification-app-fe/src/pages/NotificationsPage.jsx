import { useState, useEffect } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import InboxIcon from "@mui/icons-material/Inbox";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../../../logging-middleware/index.js";

const typeWeights = {
  placement: 3,
  result: 2,
  event: 1,
};

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0); // 0 = All Feed, 1 = Priority Inbox
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [priorityLimit, setPriorityLimit] = useState(10);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("viewed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Priority Inbox states
  const [priorityNotifications, setPriorityNotifications] = useState([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError] = useState(null);

  // Load paginated data for All Feed Tab
  const { notifications, totalPages, loading, error } = useNotifications({
    page,
    limit: 10,
    type: filter,
  });

  // Sync viewed IDs with localStorage
  useEffect(() => {
    localStorage.setItem("viewed_notifications", JSON.stringify(viewedIds));
  }, [viewedIds]);

  // Load & calculate Priority Inbox data (Tab 1)
  useEffect(() => {
    if (activeTab !== 1) return;

    let active = true;
    const loadPriorityData = async () => {
      setPriorityLoading(true);
      setPriorityError(null);
      try {
        await Log("frontend", "debug", "page", `Loading Priority Inbox (n=${priorityLimit}, type=${filter})`);
        
        // Since API limit is max 10, to display 15 or 20 we fetch multiple pages in parallel
        const pagesToFetch = priorityLimit > 10 ? [1, 2] : [1];
        
        const fetchPromises = pagesToFetch.map(p => 
          fetchNotifications({ page: p, limit: 10, type: filter })
        );
        
        const results = await Promise.all(fetchPromises);
        
        if (!active) return;

        // Combine items from fetched pages
        let combined = [];
        results.forEach(res => {
          combined = combined.concat(res.notifications || []);
        });

        // Filter duplicates (by ID) if any
        const seenIds = new Set();
        let uniqueList = combined.filter(n => {
          if (seenIds.has(n.ID)) return false;
          seenIds.add(n.ID);
          return true;
        });

        // Filter out viewed/read notifications if we only want unread, 
        // but the specs say "display the top 'n' most important unread notifications first".
        // This implies unread goes first, then read, or we only display unread.
        // Let's sort all notifications such that:
        // 1. Unread notifications go first, then read notifications.
        // 2. Within each group (unread/read), sort by Weight (Placement > Result > Event).
        // 3. Within equal weights, sort by Timestamp (recency descending).
        uniqueList.sort((a, b) => {
          const isReadA = viewedIds.includes(a.ID);
          const isReadB = viewedIds.includes(b.ID);

          // 1. Unread first
          if (isReadA !== isReadB) {
            return isReadA ? 1 : -1;
          }

          // 2. Weight comparison
          const weightA = typeWeights[String(a.Type).toLowerCase()] || 0;
          const weightB = typeWeights[String(b.Type).toLowerCase()] || 0;
          if (weightA !== weightB) {
            return weightB - weightA;
          }

          // 3. Recency comparison
          const dateA = new Date(a.Timestamp.replace(" ", "T"));
          const dateB = new Date(b.Timestamp.replace(" ", "T"));
          return dateB - dateA;
        });

        // Slice to the requested top "n" limit
        setPriorityNotifications(uniqueList.slice(0, priorityLimit));
        await Log("frontend", "info", "page", `Computed top ${priorityLimit} priority notifications.`);
      } catch (err) {
        if (active) {
          setPriorityError(err.message || "Failed to load priority inbox.");
          await Log("frontend", "error", "page", `Priority Inbox error: ${err.message}`);
        }
      } finally {
        if (active) {
          setPriorityLoading(false);
        }
      }
    };

    loadPriorityData();

    return () => {
      active = false;
    };
  }, [activeTab, priorityLimit, filter, viewedIds]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset page to 1 on filter change
    Log("frontend", "info", "component", `Filter changed to ${newFilter}`);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    Log("frontend", "info", "component", `Page changed to ${newPage}`);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    Log("frontend", "info", "component", `Tab switched to ${newValue === 0 ? "All Feed" : "Priority Inbox"}`);
  };

  const handleToggleRead = (id) => {
    setViewedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    Log("frontend", "info", "state", `Notification read status toggled: ${id}`);
  };

  const handleMarkAllRead = () => {
    const activeList = activeTab === 0 ? notifications : priorityNotifications;
    const newViewed = [...viewedIds];
    
    activeList.forEach((n) => {
      if (!newViewed.includes(n.ID)) {
        newViewed.push(n.ID);
      }
    });

    setViewedIds(newViewed);
    Log("frontend", "info", "state", "Marked all visible notifications as read.");
  };

  // Calculate unread count among currently visible notifications
  const activeNotifications = activeTab === 0 ? notifications : priorityNotifications;
  const currentUnreadList = activeNotifications.filter(n => !viewedIds.includes(n.ID));
  const unreadCount = currentUnreadList.length;

  const showLoading = activeTab === 0 ? loading : priorityLoading;
  const showErr = activeTab === 0 ? error : priorityError;
  const showList = activeTab === 0 ? notifications : priorityNotifications;
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 4 }}>
      {/* Header section */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {activeTab === 0 ? (
              <NotificationsIcon sx={{ fontSize: 32, color: "#1976d2" }} />
            ) : (
              <InboxIcon sx={{ fontSize: 32, color: "#2e7d32" }} />
            )}
          </Badge>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            {activeTab === 0 ? "Campus Notifications" : "Priority Inbox"}
          </Typography>
        </Stack>

        {showList.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Mark Visible as Read
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Tabs Menu */}
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, mb: 3, p: 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              borderRadius: 2,
              minHeight: 48,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
            },
          }}
        >
          <Tab icon={<NotificationsIcon />} iconPosition="start" label="All Feed" />
          <Tab icon={<InboxIcon />} iconPosition="start" label="Priority Inbox" />
        </Tabs>
      </Paper>

      {/* Filtering and n-select configurations */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <NotificationFilter value={filter} onChange={handleFilterChange} />

        {activeTab === 1 && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="priority-limit-label">Limit (n)</InputLabel>
            <Select
              labelId="priority-limit-label"
              value={priorityLimit}
              label="Limit (n)"
              onChange={(e) => {
                setPriorityLimit(Number(e.target.value));
                Log("frontend", "info", "component", `Priority limit changed to ${e.target.value}`);
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value={10}>Top 10</MenuItem>
              <MenuItem value={15}>Top 15</MenuItem>
              <MenuItem value={20}>Top 20</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Loading Progress */}
      {showLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={48} thickness={4.5} />
        </Box>
      )}

      {/* Errors display */}
      {!showLoading && showErr && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          Failed to load notifications: {showErr}
        </Alert>
      )}

      {/* Empty State */}
      {!showLoading && !showErr && showList.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No notifications found matching your selection.
        </Alert>
      )}

      {/* Notifications List */}
      {!showLoading && !showErr && showList.length > 0 && (
        <Stack spacing={2}>
          {showList.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isRead={viewedIds.includes(n.ID)}
              onToggleRead={handleToggleRead}
            />
          ))}
        </Stack>
      )}

      {/* Pagination (Only for All Feed tab) */}
      {activeTab === 0 && !showLoading && !showErr && showList.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}
    </Box>
  );
}

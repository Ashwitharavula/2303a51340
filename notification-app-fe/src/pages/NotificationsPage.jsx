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
  const [activeTab, setActiveTab] = useState(0);
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

  const [priorityNotifications, setPriorityNotifications] = useState([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError] = useState(null);

  const { notifications, totalPages, loading, error } = useNotifications({
    page,
    limit: 10,
    type: filter,
  });

  useEffect(() => {
    localStorage.setItem("viewed_notifications", JSON.stringify(viewedIds));
  }, [viewedIds]);

  useEffect(() => {
    if (activeTab !== 1) return;

    let active = true;
    const loadPriorityData = async () => {
      setPriorityLoading(true);
      setPriorityError(null);
      try {
        await Log("frontend", "debug", "page", `Loading Priority Inbox (n=${priorityLimit}, type=${filter})`);
        
        let combined = [];
        const res1 = await fetchNotifications({ page: 1, limit: 10, type: filter });
        if (!active) return;
        combined = combined.concat(res1.notifications || []);

        if (priorityLimit > 10) {
          const res2 = await fetchNotifications({ page: 2, limit: 10, type: filter });
          if (!active) return;
          combined = combined.concat(res2.notifications || []);
        }
        
        const seenIds = new Set();
        let uniqueList = combined.filter(n => {
          if (seenIds.has(n.ID)) return false;
          seenIds.add(n.ID);
          return true;
        });

        uniqueList.sort((a, b) => {
          const isReadA = viewedIds.includes(a.ID);
          const isReadB = viewedIds.includes(b.ID);

          if (isReadA !== isReadB) {
            return isReadA ? 1 : -1;
          }

          const weightA = typeWeights[String(a.Type).toLowerCase()] || 0;
          const weightB = typeWeights[String(b.Type).toLowerCase()] || 0;
          if (weightA !== weightB) {
            return weightB - weightA;
          }

          const dateA = new Date(a.Timestamp.replace(" ", "T"));
          const dateB = new Date(b.Timestamp.replace(" ", "T"));
          return dateB - dateA;
        });

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
    setPage(1);
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

  const activeNotifications = activeTab === 0 ? notifications : priorityNotifications;
  const currentUnreadList = activeNotifications.filter(n => !viewedIds.includes(n.ID));
  const unreadCount = currentUnreadList.length;

  const showLoading = activeTab === 0 ? loading : priorityLoading;
  const showErr = activeTab === 0 ? error : priorityError;
  const showList = activeTab === 0 ? notifications : priorityNotifications;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 4 }}>
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
            Mark Visible as Viewed
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

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

      {showLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={48} thickness={4.5} />
        </Box>
      )}

      {!showLoading && showErr && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          Failed to load notifications: {showErr}
        </Alert>
      )}

      {!showLoading && !showErr && showList.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No notifications found matching your selection.
        </Alert>
      )}

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

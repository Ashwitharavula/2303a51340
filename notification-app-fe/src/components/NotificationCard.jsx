import { Card, CardContent, Typography, Box, IconButton, Tooltip, Chip } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import DraftsIcon from "@mui/icons-material/Drafts";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

const typeConfig = {
  Placement: {
    icon: <WorkIcon sx={{ color: "#2e7d32" }} />,
    color: "success",
    bgColor: "#e8f5e9",
    borderColor: "#4caf50",
  },
  Result: {
    icon: <SchoolIcon sx={{ color: "#1565c0" }} />,
    color: "primary",
    bgColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  Event: {
    icon: <EventIcon sx={{ color: "#e65100" }} />,
    color: "warning",
    bgColor: "#fff3e0",
    borderColor: "#ff9800",
  },
};

/**
 * Beautiful notification item card using Material UI.
 * Shows type-specific colors, icons, read/unread states, and click actions.
 */
export function NotificationCard({ notification, isRead, onToggleRead }) {
  const { ID, Type, Message, Timestamp } = notification;
  const config = typeConfig[Type] || {
    icon: <EventIcon />,
    color: "default",
    bgColor: "#f5f5f5",
    borderColor: "#9e9e9e",
  };

  return (
    <Card
      elevation={isRead ? 0 : 2}
      sx={{
        borderLeft: `6px solid ${config.borderColor}`,
        borderRadius: 2,
        backgroundColor: isRead ? "#fcfcfc" : "#ffffff",
        transition: "all 0.2s ease-in-out",
        opacity: isRead ? 0.85 : 1,
        position: "relative",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Type Icon Container */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: config.bgColor,
            flexShrink: 0,
          }}
        >
          {config.icon}
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Chip
              label={Type}
              color={config.color}
              size="small"
              sx={{ fontWeight: 600, fontSize: "0.75rem", height: 20 }}
            />
            <Typography variant="caption" color="text.secondary">
              {Timestamp}
            </Typography>
          </Box>
          <Typography
            variant="body1"
            fontWeight={isRead ? 500 : 700}
            color={isRead ? "text.secondary" : "text.primary"}
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {Message}
          </Typography>
        </Box>

        {/* Read / Unread Action */}
        <Box sx={{ flexShrink: 0 }}>
          <Tooltip title={isRead ? "Mark as Unread" : "Mark as Read"}>
            <IconButton onClick={() => onToggleRead(ID)} size="small" color={isRead ? "default" : "primary"}>
              {isRead ? (
                <DraftsIcon sx={{ fontSize: 20, color: "text.secondary" }} />
              ) : (
                <MarkEmailUnreadIcon sx={{ fontSize: 20, color: "#1976d2" }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

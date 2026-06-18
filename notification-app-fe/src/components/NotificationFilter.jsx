import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value = "All", onChange }) {
  const handleAlignment = (event, newAlignment) => {
    if (newAlignment !== null && onChange) {
      onChange(newAlignment);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleAlignment}
      size="small"
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      {filters.map((type) => (
        <ToggleButton key={type} value={type} sx={{ textTransform: "none", px: 2 }}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
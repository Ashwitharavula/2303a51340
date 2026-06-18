import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { NotificationsPage } from "./pages/NotificationsPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5", // Indigo
      light: "#818cf8",
      dark: "#3730a3",
    },
    secondary: {
      main: "#10b981", // Emerald
      light: "#34d399",
      dark: "#047857",
    },
    background: {
      default: "#f8fafc", // Slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // Slate-900
      secondary: "#475569", // Slate-600
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.025em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", py: 2 }}>
        <NotificationsPage />
      </Box>
    </ThemeProvider>
  );
}
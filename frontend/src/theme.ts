import { createTheme, alpha } from "@mui/material/styles";

const violet = "#7c3aed";
const pink = "#ec4899";

// Tema MichiCode: violeta + rosa, formas redondeadas y tipografía amigable
const theme = createTheme({
  palette: {
    primary: { main: violet },
    secondary: { main: pink },
    background: { default: "#faf7ff", paper: "#ffffff" },
    text: { primary: "#2e1065", secondary: "#6b5b8a" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'Nunito', 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 900 },
    h2: { fontWeight: 900 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    button: { fontWeight: 800, textTransform: "none", letterSpacing: 0.2 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: "transform .15s ease, box-shadow .15s ease",
          "&:hover": { transform: "translateY(-2px)" },
          "&:active": { transform: "translateY(0) scale(.98)" },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${violet}, ${pink})`,
          boxShadow: `0 10px 24px ${alpha(violet, 0.3)}`,
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${pink}, #f97316)`,
          boxShadow: `0 10px 24px ${alpha(pink, 0.3)}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: alpha("#ffffff", 0.8),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

export default theme;

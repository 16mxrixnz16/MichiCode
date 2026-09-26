import React from "react";
import { Paper, PaperProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface SoftCardProps extends PaperProps {
  accent?: "primary" | "secondary";
}

/** Tarjeta translúcida con borde y sombra del color de acento. */
const SoftCard: React.FC<SoftCardProps> = ({ accent = "primary", sx, children, ...props }) => {
  const theme = useTheme();
  const color = theme.palette[accent].main;

  return (
    <Paper
      elevation={0}
      {...props}
      sx={[
        {
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: { xs: 3, sm: 4 },
          borderRadius: "28px",
          background: alpha("#ffffff", 0.82),
          backdropFilter: "blur(12px)",
          border: `1px solid ${alpha(color, 0.18)}`,
          boxShadow: `0 20px 50px ${alpha(color, 0.14)}`,
          transition: "transform .2s ease, box-shadow .2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 28px 60px ${alpha(color, 0.22)}`,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Paper>
  );
};

export default SoftCard;

import React, { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import { isMuted, meow, setMuted, MUTE_EVENT } from "../sound/meow";

/** Activa o silencia los maullidos. Al reactivarlos, el michi saluda. */
const MuteToggle: React.FC = () => {
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    const onMute = (event: Event) =>
      setMutedState((event as CustomEvent<boolean>).detail);
    window.addEventListener(MUTE_EVENT, onMute);
    return () => window.removeEventListener(MUTE_EVENT, onMute);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    if (!next) meow({ type: "corto" });
  };

  const label = muted ? "Activar maullidos" : "Silenciar maullidos";

  return (
    <Tooltip title={label}>
      <IconButton
        data-no-meow
        aria-label={label}
        aria-pressed={muted}
        onClick={toggle}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,.85)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(124,58,237,.2)",
          color: muted ? "text.secondary" : "primary.main",
          "&:hover": { bgcolor: "#fff" },
        }}
      >
        {muted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default MuteToggle;

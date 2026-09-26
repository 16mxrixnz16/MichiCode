import React, { useState } from "react";
import {
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import { apiService } from "../services/api";
import SoftCard from "./SoftCard";
import { YarnBall } from "./cats/Illustrations";

interface UrlShortenerProps {
  onUrlGenerated: () => void;
}

const UrlShortener: React.FC<UrlShortenerProps> = ({ onUrlGenerated }) => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiService.shortenUrl(url);
      setResult(response.data.shortUrl);

      onUrlGenerated();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al acortar la URL. Revisa la URL y la conexión al servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setError("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  };

  return (
    <SoftCard accent="primary">
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
        <LinkRoundedIcon color="primary" fontSize="large" />
        <Typography variant="h4" component="h2" color="text.primary">
          Acortador de URLs
        </Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Pega un enlace largo y el michi lo deja cortito.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Pega tu URL larga aquí"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          type="url"
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkRoundedIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={!loading && <ContentCutRoundedIcon />}
          sx={{ py: 1.8, fontSize: "1.1rem" }}
        >
          {loading ? (
            <CircularProgress size={26} color="inherit" />
          ) : (
            "Acortar URL"
          )}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: "14px" }}>
          {error}
        </Alert>
      )}
      {result && (
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: "18px",
            bgcolor: "rgba(124,58,237,.07)",
            border: "2px dashed",
            borderColor: "primary.light",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            😺 ¡Listo! Tu URL acortada:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              component="a"
              href={result}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                flex: 1,
                color: "primary.main",
                fontWeight: 800,
                fontSize: "1.1rem",
                wordBreak: "break-all",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {result}
              <OpenInNewIcon
                fontSize="small"
                sx={{ ml: 0.5, verticalAlign: "middle" }}
              />
            </Typography>
            <Tooltip title="Copiar enlace">
              <IconButton
                color="primary"
                onClick={copyToClipboard}
                aria-label="Copiar enlace"
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mt: "auto", pt: 4 }}
      >
        <Box sx={{ lineHeight: 0, flexShrink: 0 }}>
          <YarnBall size={44} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          <strong>Tip michi:</strong> cada enlace corto cuenta sus clicks. Revisa
          el historial para ver cuáles son los más populares 🐾
        </Typography>
      </Stack>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={<span aria-hidden>🐾</span>}
          sx={{ borderRadius: "14px", fontWeight: 700 }}
        >
          ¡Enlace copiado al portapapeles!
        </Alert>
      </Snackbar>
    </SoftCard>
  );
};

export default UrlShortener;

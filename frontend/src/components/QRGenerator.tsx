import React, { useRef, useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import QRCode from "react-qr-code";
import { apiService } from "../services/api";
import SoftCard from "./SoftCard";
import { YarnBall } from "./cats/Illustrations";

interface QRGeneratorProps {
  onQrGenerated: () => void;
}

const PNG_SIZE = 1024;
const PNG_MARGIN = 64;

/** Convierte el SVG del QR que ya se ve en pantalla en un PNG (sin servicios externos). */
function svgToPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const markup = new XMLSerializer().serializeToString(svg);
  const svgUrl = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" })
  );

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PNG_SIZE;
      canvas.height = PNG_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas no disponible"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
      ctx.drawImage(
        img,
        PNG_MARGIN,
        PNG_MARGIN,
        PNG_SIZE - PNG_MARGIN * 2,
        PNG_SIZE - PNG_MARGIN * 2
      );
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) =>
        blob ? resolve(blob) : reject(new Error("No se pudo crear el PNG"))
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("No se pudo leer el QR"));
    };
    img.src = svgUrl;
  });
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ onQrGenerated }) => {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!text || !svg) return;

    setLoading(true);
    setError("");

    try {
      await apiService.saveQrHistory(text);
      onQrGenerated();

      const blob = await svgToPngBlob(svg);
      const urlObject = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlObject;
      link.download = `qr-michicode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlObject);
    } catch (err) {
      console.error("Error al guardar o descargar QR:", err);
      setError("No se pudo guardar o descargar el QR. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SoftCard accent="secondary">
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
        <QrCode2RoundedIcon color="secondary" fontSize="large" />
        <Typography variant="h4" component="h2" color="text.primary">
          Generador de QR
        </Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Escribe un enlace o texto y descarga tu código en PNG.
      </Typography>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Texto o URL para el QR"
          placeholder="https://michicode.com, WiFi, contacto..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          color="secondary"
        />
        <Box
          ref={qrRef}
          sx={{
            bgcolor: "#fff",
            p: 3,
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 280,
            border: "2px dashed",
            borderColor: text ? "transparent" : "secondary.light",
            boxShadow: text ? "0 12px 32px rgba(236,72,153,.18)" : "none",
            transition: "all .2s ease",
          }}
        >
          {text ? (
            <QRCode
              value={text}
              size={220}
              fgColor="#2e1065"
              style={{ width: 220, height: 220 }}
            />
          ) : (
            <>
              <YarnBall size={72} />
              <Typography color="text.secondary" fontWeight={700} mt={2}>
                Escribe algo arriba para tejer tu QR
              </Typography>
            </>
          )}
        </Box>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={downloadQrCode}
          disabled={loading || !text}
          fullWidth
          sx={{ py: 1.8, fontSize: "1.1rem" }}
        >
          {loading ? "Guardando y descargando..." : "Descargar y guardar"}
        </Button>
        {error && (
          <Alert severity="error" sx={{ borderRadius: "14px" }}>
            {error}
          </Alert>
        )}
      </Stack>
    </SoftCard>
  );
};

export default QRGenerator;

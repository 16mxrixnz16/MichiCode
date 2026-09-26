import React, { useState } from "react";
import { Container, Stack, Typography, Box, Grid, Chip } from "@mui/material";
import UrlShortener from "../components/UrlShortener";
import QRGenerator from "../components/QRGenerator";
import UrlList from "../components/UrlList";
import QRList from "../components/QRList";
import CatLane from "../components/cats/CatLane";

const Home: React.FC = () => {
  const [urlRefetchTrigger, setUrlRefetchTrigger] = useState(0);
  const [qrRefetchTrigger, setQrRefetchTrigger] = useState(0);

  const handleUrlGenerated = () => {
    setUrlRefetchTrigger((prev) => prev + 1);
  };

  const handleQrGenerated = () => {
    setQrRefetchTrigger((prev) => prev + 1);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: { xs: 4, sm: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} alignItems="center" mt={{ xs: 2, md: 3 }}>
          <Typography
            variant="h1"
            component="h1"
            fontSize={{ xs: "3.2rem", sm: "4.5rem", md: "5.5rem" }}
            textAlign="center"
            sx={{
              background: "linear-gradient(90deg, #7c3aed, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            MichiCode
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            textAlign="center"
            maxWidth="600px"
          >
            Acorta URLs al instante y genera códigos QR profesionales en
            segundos. Los michis se encargan del resto 🐾
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Chip label="⚡ Instantáneo" variant="outlined" color="primary" />
            <Chip label="🔗 Enlaces cortos" variant="outlined" color="primary" />
            <Chip label="📱 QR descargable" variant="outlined" color="secondary" />
          </Stack>
        </Stack>

        {/* Los gatos pasean en franjas propias, entre secciones: nunca tapan los recuadros */}
        <CatLane coat="corazon" />

        <Grid container spacing={4} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <UrlShortener onUrlGenerated={handleUrlGenerated} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <QRGenerator onQrGenerated={handleQrGenerated} />
          </Grid>
        </Grid>

        <CatLane coat="noche" delay={1200} />

        <Box>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            color="text.primary"
            mb={4}
          >
            Historial
          </Typography>
          <Grid container spacing={4} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <UrlList refetchTrigger={urlRefetchTrigger} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <QRList refetchTrigger={qrRefetchTrigger} />
            </Grid>
          </Grid>
        </Box>

        <CatLane coat="nube" delay={2400} />

        <Stack component="footer" alignItems="center" spacing={0}>
          <Box
            sx={{
              width: "100%",
              borderTop: "3px solid",
              borderColor: "primary.light",
              pt: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              Hecho con 🐾 por el equipo MichiCode
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Home;

import React, { useEffect } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Box,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import useFetch from "../hooks/useFetch";
import SoftCard from "./SoftCard";
import { EmptyBox } from "./cats/Illustrations";

interface UrlItem {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
}

interface UrlListProps {
  refetchTrigger: number;
}

const UrlList: React.FC<UrlListProps> = ({ refetchTrigger }) => {
  const {
    data: urls,
    loading,
    error,
    refetch,
  } = useFetch<UrlItem[]>("/urls", { skip: true });

  useEffect(() => {
    refetch();
  }, [refetchTrigger, refetch]);

  return (
    <SoftCard accent="primary">
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <HistoryRoundedIcon color="primary" />
        <Typography variant="h5" component="h3" color="text.primary">
          URLs acortadas
        </Typography>
        {urls && urls.length > 0 && (
          <Chip label={urls.length} color="primary" size="small" />
        )}
      </Stack>

      {loading && !urls ? (
        <Box textAlign="center" py={6}>
          <CircularProgress />
          <Typography color="text.secondary" mt={2}>
            Buscando tus enlaces...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !urls || urls.length === 0 ? (
        <Box textAlign="center" py={3}>
          <EmptyBox label="Caja vacía: aún no hay URLs" />
          <Typography color="text.secondary" fontWeight={700} mt={1}>
            Aún no has acortado ninguna URL
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}>
          {urls.map((item, index) => (
            <React.Fragment key={item.shortCode}>
              <ListItem alignItems="flex-start" disableGutters>
                <ListItemText
                  primary={
                    <Typography
                      component="a"
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "primary.main",
                        fontWeight: 800,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {item.shortUrl}
                      <OpenInNewIcon
                        fontSize="small"
                        sx={{ ml: 0.5, verticalAlign: "middle" }}
                      />
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.originalUrl}
                      </Typography>
                      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`🐾 ${item.clicks} clicks`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={new Date(item.createdAt).toLocaleDateString("es-ES")}
                          size="small"
                        />
                      </Box>
                    </>
                  }
                  slotProps={{ secondary: { component: "div" } }}
                />
              </ListItem>
              {index < urls.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </SoftCard>
  );
};

export default UrlList;

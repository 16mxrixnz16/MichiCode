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
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import useFetch from "../hooks/useFetch";
import SoftCard from "./SoftCard";
import { EmptyBox } from "./cats/Illustrations";

interface QrItem {
  _id: string;
  content: string;
  createdAt: string;
}

interface QRListProps {
  refetchTrigger: number;
}

const QRList: React.FC<QRListProps> = ({ refetchTrigger }) => {
  const {
    data: qrs,
    loading,
    error,
    refetch,
  } = useFetch<QrItem[]>("/qr/history", {
    skip: true,
  });

  useEffect(() => {
    refetch();
  }, [refetchTrigger, refetch]);

  return (
    <SoftCard accent="secondary">
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <QrCode2RoundedIcon color="secondary" />
        <Typography variant="h5" component="h3" color="text.primary">
          Códigos QR generados
        </Typography>
        {qrs && qrs.length > 0 && (
          <Chip label={qrs.length} color="secondary" size="small" />
        )}
      </Stack>

      {loading && !qrs ? (
        <Box textAlign="center" py={6}>
          <CircularProgress color="secondary" />
          <Typography color="text.secondary" mt={2}>
            Buscando tus códigos QR...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !qrs || qrs.length === 0 ? (
        <Box textAlign="center" py={3}>
          <EmptyBox label="Caja vacía: aún no hay códigos QR" />
          <Typography color="text.secondary" fontWeight={700} mt={1}>
            Aún no has generado ningún código QR
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}>
          {qrs.map((item, index) => (
            <React.Fragment key={item._id}>
              <ListItem alignItems="flex-start" disableGutters>
                <ListItemText
                  primary={
                    <Typography fontWeight={700} sx={{ wordBreak: "break-all" }}>
                      {item.content}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={new Date(item.createdAt).toLocaleDateString("es-ES")}
                        size="small"
                      />
                    </Box>
                  }
                  slotProps={{ secondary: { component: "div" } }}
                />
              </ListItem>
              {index < qrs.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </SoftCard>
  );
};

export default QRList;

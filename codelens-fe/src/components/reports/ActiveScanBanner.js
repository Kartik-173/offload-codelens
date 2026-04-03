import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ScanProgress from "../common/ScanProgress";

const ActiveScanBanner = ({ status, onDismiss }) => {
  if (!status || status.status === "not_found") return null;

  const chipProps = (() => {
    if (status.status === "running") return { label: "Running", color: "info" };
    if (status.status === "completed") return { label: "Completed", color: "success" };
    if (status.status === "failed") return { label: "Failed", color: "error" };
    return { label: "Starting", color: "default" };
  })();

  return (
    <Accordion defaultExpanded elevation={0} sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
          <Typography fontWeight={700}>Active Scan</Typography>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Chip size="small" {...chipProps} variant="outlined" />
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss?.();
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {status ? (
          <ScanProgress status={status} />
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Preparing scan status…</Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ActiveScanBanner;

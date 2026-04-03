import React from "react";
import { Backdrop, Box, CircularProgress, Typography } from "@mui/material";

const BusyBackdrop = ({ open, text = "Please wait...", size = 28 }) => {
  return (
    <Backdrop className="busy-backdrop" open={Boolean(open)}>
      <Box className="busy-backdrop-content">
        <CircularProgress color="inherit" size={size} />
        {text ? (
          <Typography className="busy-backdrop-text" aria-live="polite" sx={{ ml: 2 }}>
            {text}
          </Typography>
        ) : null}
      </Box>
    </Backdrop>
  );
};

export default BusyBackdrop;

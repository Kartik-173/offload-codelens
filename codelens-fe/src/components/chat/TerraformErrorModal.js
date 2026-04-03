import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TerraformErrorModal = ({ open, onClose, errorMessage, onAskAI }) => {
  const [prompt, setPrompt] = useState(errorMessage || "");

  useEffect(() => {
    setPrompt(errorMessage || "");
  }, [errorMessage]);

  const handleAskAI = () => {
    if (prompt.trim()) {
      onAskAI(prompt.trim());
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="modal-blur-backdrop">
      <Box className="terraform-error-modal">
        <IconButton
          aria-label="Close terraform error dialog"
          className="terraform-error-close-btn"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography className="terraform-error-title">
          Terraform Error
        </Typography>

        <TextField
          className="terraform-error-textfield"
          multiline
          minRows={8}
          fullWidth
          variant="outlined"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          InputProps={{ readOnly: true }}
        />

        <div className="terraform-error-actions">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAskAI}
            disabled={!prompt.trim()}
          >
            Ask AI
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default TerraformErrorModal;

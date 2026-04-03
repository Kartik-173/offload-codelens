import { Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

const defaultOptions = {
  initialOpen: false,
  duration: 5000,
  message: "",
  actionButtonName: "Close",
  yPosition: "center",
  xPosition: "center",
};

export const SNACKBAR_THEME = {
  RED: {
    BAR_BACKGROUND: "#F2D7D5",
    BTN_BACKGROUND: "#EC7063",
    TEXT: "#000",
  },
  BLUE: {
    BAR_BACKGROUND: "#D4E6F1",
    BTN_BACKGROUND: "#7FB3D5",
    TEXT: "#000",
  },
  GREEN: {
    BAR_BACKGROUND: "#D0ECE7",
    BTN_BACKGROUND: "#73C6B6",
    TEXT: "#000",
  },
  YELLOW: {
    BAR_BACKGROUND: "#FCF3CF",
    BTN_BACKGROUND: "#F7DC6F",
    TEXT: "#000",
  },
  ORANGE: {
    BAR_BACKGROUND: "#F6DDCC",
    BTN_BACKGROUND: "#E59866",
    TEXT: "#000",
  },
  GREY: {
    BAR_BACKGROUND: "#D5D8DC",
    BTN_BACKGROUND: "#808B96",
    TEXT: "#000",
  },
};

/**
 * Snackbar Notification Component
 * @param {*} props
 * @returns
 */

const SnackbarNotification = (props) => {
  const [open, setOpen] = useState(
    props["initialOpen"] ?? defaultOptions["initialOpen"]
  );
  const [onCloseHandler, setOnCloseHandler] = useState(
    () => props["onCloseHandler"] ?? (() => {})
  );
  const [duration, setDuration] = useState(
    props["duration"] ?? defaultOptions["duration"]
  );
  const [message, setMessage] = useState(
    props["message"] ?? defaultOptions["message"]
  );
  const [actionBtn, setActionBtn] = useState(
    props["actionButtonName"] ?? defaultOptions["actionButtonName"]
  );
  const [theme, setTheme] = useState(props["theme"] ?? SNACKBAR_THEME.YELLOW);
  const [vertical, setVertical] = useState(
    props["yPosition"] ?? defaultOptions["yPosition"]
  );
  const [horizontal, setHorizontal] = useState(
    props["xPosition"] ?? defaultOptions["xPosition"]
  );

  useEffect(() => {
    setOnCloseHandler(() => props["onCloseHandler"] ?? (() => {}));
  }, [props["onCloseHandler"]]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    onCloseHandler();
    setOpen(false);
  };

  const action = (
    <>
      <Button
        size="small"
        onClick={handleClose}
        variant="contained"
        style={{
          backgroundColor: theme["BTN_BACKGROUND"],
        }}
      >
        {actionBtn}
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  );

  return (
    <Snackbar
      className="snackbar-container"
      anchorOrigin={{ vertical, horizontal }}
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      message={message}
      action={action}
    >
      <SnackbarContent
        style={{
          color: theme["TEXT"],
          backgroundColor: theme["BAR_BACKGROUND"],
        }}
        message={message}
        action={action}
      />
    </Snackbar>
  );
};

export default SnackbarNotification;

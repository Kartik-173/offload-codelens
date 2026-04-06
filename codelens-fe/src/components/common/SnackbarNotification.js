import { useEffect, useState } from "react";
import { X } from "lucide-react";

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

  if (!open) return null;

  const positionClasses = {
    top: "top-4",
    bottom: "bottom-4",
    center: "top-1/2 -translate-y-1/2",
  };

  const horizontalClasses = {
    left: "left-4",
    right: "right-4",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={`snackbar-container fixed z-50 ${positionClasses[vertical] || positionClasses.center} ${horizontalClasses[horizontal] || horizontalClasses.center}`}
    >
      <div
        className="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
        style={{
          color: theme["TEXT"],
          backgroundColor: theme["BAR_BACKGROUND"],
        }}
      >
        <span className="text-sm">{message}</span>
        <button
          className="rounded px-3 py-1 text-sm font-medium text-white"
          style={{ backgroundColor: theme["BTN_BACKGROUND"] }}
          onClick={handleClose}
        >
          {actionBtn}
        </button>
        <button
          className="rounded p-1 hover:bg-black/10"
          aria-label="close"
          onClick={handleClose}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default SnackbarNotification;

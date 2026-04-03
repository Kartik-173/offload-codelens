import React from "react";
import { TextField, Button, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const ChatInputBar = ({ input, setInput, handleSend, handleKeyPress, disabled, mode, setMode }) => {
  return (
    <div className="chat-input-area">
      <div className="input-wrapper">
        <TextField
          multiline
          maxRows={6}
          placeholder={"Type your message..."}
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-text"
          disabled={disabled}
          InputProps={{ classes: { notchedOutline: "no-border" } }}
        />
      </div>
      <div className="controls-bottom">
        <AttachFileIcon className="attach-icon" />
        <FormControl className="select-control" size="small">
          <InputLabel>Mode</InputLabel>
          <Select value={mode} onChange={(e) => setMode(e.target.value)} label="Mode">
            <MenuItem value="CHAT">CHAT</MenuItem>
            <MenuItem value="TERRAFORM">TERRAFORM</MenuItem>
          </Select>
        </FormControl>
        <Button className="send-button" variant="contained" onClick={handleSend} disabled={disabled}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatInputBar;

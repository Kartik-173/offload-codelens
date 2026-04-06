import React from "react";
import { Button } from "../ui/button";
import { Paperclip } from "lucide-react";

const ChatInputBar = ({ input, setInput, handleSend, handleKeyPress, disabled, mode, setMode }) => {
  return (
    <div className="chat-input-area">
      <div className="input-wrapper">
        <textarea
          rows={2}
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-text w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={disabled}
        />
      </div>
      <div className="controls-bottom">
        <Paperclip className="attach-icon h-4 w-4" />
        <div className="select-control">
          <label htmlFor="chat-mode" className="sr-only">Mode</label>
          <select
            id="chat-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="CHAT">CHAT</option>
            <option value="TERRAFORM">TERRAFORM</option>
          </select>
        </div>
        <Button className="send-button" onClick={handleSend} disabled={disabled}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatInputBar;

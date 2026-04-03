import React from "react";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";

const ChatEmptyState = ({ onStartChat, onStartTerraform }) => {
  return (
    <div className="chat-empty-state">
      <div className="chat-empty-badge">Welcome</div>
      <h2 className="chat-empty-title">How would you like to begin?</h2>
      <p className="chat-empty-sub">
        Start a natural conversation with the AI, or launch Terraform mode to generate IaC files and iterate quickly.
      </p>
      <div className="chat-empty-actions">
        <button className="chat-empty-btn" onClick={onStartChat}>
          <ChatBubbleOutlineOutlinedIcon className="btn-icon" fontSize="small" />
          Start Chat
        </button>
        <button className="chat-empty-btn secondary" onClick={onStartTerraform}>
          <ConstructionOutlinedIcon className="btn-icon" fontSize="small" />
          Start Terraform
        </button>
      </div>
      <ul className="chat-empty-tips">
        <li>Use Shift+Enter for a new line</li>
        <li>Attach generated files to edit and push to Git</li>
        <li>Your recent chats appear in the sidebar</li>
      </ul>
    </div>
  );
};

export default ChatEmptyState;

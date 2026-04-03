import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Button,
  ListItemButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ChatIcon from "@mui/icons-material/Chat";

import { createChat, getAllChats } from "../../config/chatDB";
import { useNavigate } from "react-router-dom";
import { SidebarMenu } from "../../utils/Helpers";
import { ENV } from '../../config/env';

const Sidebar = ({ selectedChatId, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [isExpanded, setIsExpanded] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
    const sub = () => loadChats();
    window.addEventListener("chat-title-updated", sub);
    window.addEventListener("chats-updated", sub);
    return () => {
      window.removeEventListener("chat-title-updated", sub);
      window.removeEventListener("chats-updated", sub);
    };
  }, []);

  const loadChats = async () => {
    const all = await getAllChats();
    setChats(all);
  };

  const handleAction = async (item) => {
    if (item.action === "newChat") {
      const newChat = await createChat();
      setChats((prev) => [newChat, ...prev]);
      onSelectChat(newChat);
      navigate(`/chat`);
      return;
    }
    if (item.route) navigate(item.route);
    if (item.external) item.external();
  };

  const toggleGroup = (label) => {
    setIsExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = ENV.LOGIN_PAGE;
  };

  const menu = SidebarMenu(navigate);

  return (
    <Box className="sidebar">

      {/* Branding */}
      <Box className="sidebar-branding" onClick={() => navigate("/home")}>
        <Avatar src="/logo.png" alt="logo" className="logo-avatar" />
        <Typography className="sidebar-title">
          <span className="brand-main">CodeLens</span>
          <span className="brand-sub"> by CloudsAnalytics</span>
        </Typography>
      </Box>

      {/* Menu */}
      <Box className="sidebar-actions">
        {menu.map((item) => (
          <Box key={item.label}>
            {!item.expandable ? (
              <Button
                variant="text"
                fullWidth
                className="sidebar-btn neutral-link"
                startIcon={item.icon}
                onClick={() => handleAction(item)}
              >
                {item.label}
              </Button>
            ) : (
              <>
                <Button
                  variant="text"
                  fullWidth
                  className="sidebar-btn neutral-link"
                  startIcon={item.icon}
                  endIcon={isExpanded[item.label] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => toggleGroup(item.label)}
                >
                  {item.label}
                </Button>

                {isExpanded[item.label] && (
                  <Box className="sidebar-security-group">
                    {item.children.map((child) => (
                      <Button
                        key={child.label}
                        variant="text"
                        fullWidth
                        className="sidebar-btn neutral-link sidebar-btn-security-child"
                        startIcon={child.icon}
                        onClick={() => handleAction(child)}
                      >
                        {child.label}
                      </Button>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        ))}
      </Box>

      <Divider className="sidebar-divider" />

      {/* Chats */}
      <List className="sidebar-list">
        {chats.map((chat) => (
          <ListItem
            key={chat.id}
            disablePadding
            className={`sidebar-list-item ${
              selectedChatId === chat.id ? "active" : ""
            }`}
          >
            <Tooltip title={chat.title} placement="right" arrow enterDelay={400}>
              <ListItemButton
                onClick={() => {
                  onSelectChat(chat);
                  navigate(`/chat`);
                }}
              >
                <ListItemIcon className="sidebar-icon">
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary={chat.title} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Sign Out */}
      <Box className="sidebar-signout">
        <Divider className="sidebar-divider" />
        <Button
          variant="text"
          fullWidth
          className="sidebar-btn signout-btn"
          onClick={handleSignOut}
          startIcon={<ExitToAppIcon />}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;

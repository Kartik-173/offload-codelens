import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const TerraformFilePreviewCard = ({ files, onOpenEditor }) => {
  const fileNames = Object.keys(files || {});

  return (
    <Card className="terraform-preview-card">
      <CardContent className="terraform-preview-content">
        <Typography variant="subtitle2" className="terraform-preview-title">
          ✅ Terraform Files Generated
        </Typography>
        <Divider className="terraform-preview-divider" />
        <List className="terraform-preview-list">
          {fileNames.map((file, idx) => (
            <ListItem
              key={idx}
              button
              className="terraform-preview-list-item"
              onClick={onOpenEditor}
            >
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary={file} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TerraformFilePreviewCard;

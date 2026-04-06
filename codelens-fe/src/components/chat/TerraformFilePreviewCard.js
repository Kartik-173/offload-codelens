import React from "react";
import { CircleCheck as CheckCircleIcon } from "lucide-react";

const Card = ({ children, className = "" }) => <div className={className}>{children}</div>;
const CardContent = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Divider = ({ className = "" }) => <div className={className} />;

const TerraformFilePreviewCard = ({ files, onOpenEditor }) => {
  const fileNames = Object.keys(files || {});

  return (
    <Card className="terraform-preview-card">
      <CardContent className="terraform-preview-content">
        <Typography className="terraform-preview-title">
          ✅ Terraform Files Generated
        </Typography>
        <Divider className="terraform-preview-divider" />
        <div className="terraform-preview-list">
          {fileNames.map((file, idx) => (
            <button
              key={idx}
              type="button"
              className="terraform-preview-list-item"
              onClick={onOpenEditor}
            >
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              <span>{file}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TerraformFilePreviewCard;

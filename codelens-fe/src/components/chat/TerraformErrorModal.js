import React, { useEffect, useState } from "react";
import { X as CloseIcon } from "lucide-react";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Button = ({ children, onClick, className = "", disabled }) => <button type="button" onClick={onClick} className={className} disabled={disabled}>{children}</button>;
const IconButton = ({ children, onClick, className = "", ...rest }) => <button type="button" onClick={onClick} className={className} {...rest}>{children}</button>;

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
    open ? (
      <div className="modal-blur-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <Box className="terraform-error-modal" onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label="Close terraform error dialog"
          className="terraform-error-close-btn"
          onClick={onClose}
        >
          <CloseIcon className="h-4 w-4" />
        </IconButton>
        <Typography className="terraform-error-title">
          Terraform Error
        </Typography>

        <textarea
          className="terraform-error-textfield"
          rows={8}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          readOnly
        />

        <div className="terraform-error-actions">
          <Button className="rounded-md border px-3 py-1.5 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            onClick={handleAskAI}
            disabled={!prompt.trim()}
          >
            Ask AI
          </Button>
        </div>
      </Box>
      </div>
    ) : null
  );
};

export default TerraformErrorModal;

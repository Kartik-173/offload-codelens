import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";

import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../common/SnackbarNotification";

import CredentialsApiService from "../../services/CredentialsApiService";

const EMPTY_FORM = {
  accountId: "",
  name: "",
  accessKey: "",
  secretKey: "",
};

const AwsAccountsManager = () => {
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [snackbar, setSnackbar] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------------------------------- */
  /* Utils */
  /* ---------------------------------- */

  const showSuccess = (msg) =>
    setSnackbar({ type: "success", msg });

  const showError = (msg) =>
    setSnackbar({ type: "error", msg });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
  };

  const openDeleteDialog = () => {
    if (!userId) {
      showError("Missing userId");
      return;
    }

    if (!selected?.id) {
      showError("No account selected");
      return;
    }

    setDeleteTarget(selected);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const openDeleteDialogFor = (acc) => {
    if (!userId) {
      showError("Missing userId");
      return;
    }

    if (!acc?.id) {
      showError("No account selected");
      return;
    }

    setDeleteTarget(acc);
    setDeleteDialogOpen(true);
  };

  const deleteAccount = async () => {
    try {
      setSaving(true);
      await CredentialsApiService.deleteCredentials(userId, deleteTarget.id);
      showSuccess("Account deleted successfully");
      closeDeleteDialog();
      await loadAccounts();
    } catch {
      showError("Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------- */
  /* Load accounts */
  /* ---------------------------------- */

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);

      if (!userId) {
        setAccounts([]);
        resetForm();
        return;
      }

      const res = await CredentialsApiService.listAccountIds(userId);

      const payload = res?.data?.data || res?.data || {};
      const withNames = Array.isArray(payload.accounts) ? payload.accounts : null;
      const ids = payload.accountIds || [];

      const formatted = withNames
        ? withNames.map((a) => ({
            id: String(a?.accountId ?? a?.id ?? ""),
            name: a?.name || "",
          })).filter((a) => a.id)
        : ids.map((id) => ({
            id: String(id),
            name: "",
          }));

      setAccounts(formatted);

      if (formatted.length) {
        selectAccount(formatted[0]);
      } else {
        resetForm();
      }
    } catch {
      showError("Failed to load AWS accounts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  /* ---------------------------------- */
  /* Select */
  /* ---------------------------------- */

  const selectAccount = (acc) => {
    setSelected(acc);

    setForm({
      accountId: acc.id,
      name: acc?.name || "",
      accessKey: "",
      secretKey: "",
    });
  };

  /* ---------------------------------- */
  /* Save */
  /* ---------------------------------- */

  const saveAccount = async (e) => {
    e.preventDefault();

    if (!form.accountId || !form.name || !form.accessKey || !form.secretKey) {
      showError("All fields are required");
      return;
    }

    // Validate AWS account ID length (should be 12 digits)
    if (!/^\d{12}$/.test(form.accountId)) {
      showError("AWS Account ID must be exactly 12 digits");
      return;
    }

    const duplicate = accounts.find(
      (a) =>
        a.id === form.accountId &&
        a.id !== selected?.id
    );

    if (duplicate) {
      showError("Account already exists");
      return;
    }

    try {
      setSaving(true);

      await CredentialsApiService.storeCredentials({
        userId,
        accountId: form.accountId,
        name: form.name,
        accessKey: form.accessKey,
        secretKey: form.secretKey,
      });

      showSuccess("Account saved successfully");

      await loadAccounts();

      resetForm();
    } catch {
      showError("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="credentials-loader">
        <CircularProgress size={28} />
        <Typography>Loading AWS accounts…</Typography>
      </Box>
    );
  }

  return (
    <Box className="aws-manager">

      {/* Header */}

      <Box className="aws-header">
        <Box className="credentials-logo-circle">
          <CloudQueueIcon className="credentials-logo-icon" />
        </Box>

        <Box>
          <Typography variant="h5" className="credentials-title">
            AWS Accounts
          </Typography>

          <Typography variant="body2" className="credentials-subtext">
            Manage multiple AWS accounts securely
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Body */}

      <Box className="aws-body">

        {/* Left Panel */}

        <Box className="aws-list">

          <Typography className="aws-list-title">
            Connected Accounts
          </Typography>

          <Box className="credentials-help">
            <Typography className="credentials-help-title">
              How this works
            </Typography>

            <Typography className="credentials-help-text">
              Add your AWS credentials once and use them to run on-demand security scans from this workspace.
            </Typography>

            <Box component="ul" className="credentials-help-list">
              <li>Keys are used only for scanning actions you start.</li>
              <li>You can update an account anytime by saving new credentials.</li>
            </Box>
          </Box>

          {accounts.length === 0 && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No accounts added yet
            </Typography>
          )}

          {accounts.map((acc) => (
            <Box
              key={acc.id}
              className={`aws-account-item ${
                selected?.id === acc.id ? "active" : ""
              }`}
              onClick={() => selectAccount(acc)}
            >
              <Typography>{acc?.name ? `${acc.id}-${acc.name}` : acc.id}</Typography>

              <Tooltip
                title="Delete"
                placement="left"
              >
                <IconButton
                  size="small"
                  className="credentials-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialogFor(acc);
                  }}
                >
                  <DeleteOutlineIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}

          <Button
            variant="outlined"
            fullWidth
            className="aws-add-btn"
            onClick={resetForm}
          >
            + Add Account
          </Button>
        </Box>

        {/* Right Panel */}

        <Box className="aws-editor">

          <Typography className="aws-editor-title">
            {selected ? "Edit Account" : "Add New Account"}
          </Typography>

          <Typography className="credentials-form-hint">
            All fields are required. For security, secret keys are not shown again after saving.
          </Typography>

          <form onSubmit={saveAccount}>

            <TextField
              label="AWS Account ID"
              fullWidth
              required
              value={form.accountId}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                setForm({ ...form, accountId: value });
              }}
              margin="normal"
              inputProps={{
                maxLength: 12,
                placeholder: "12-digit AWS Account ID"
              }}
              helperText={form.accountId && form.accountId.length !== 12 ? "AWS Account ID must be exactly 12 digits" : ""}
              error={form.accountId && form.accountId.length !== 12}
            />

            <TextField
              label="Account Name"
              fullWidth
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              margin="normal"
            />

            <TextField
              label="Access Key ID"
              fullWidth
              required
              value={form.accessKey}
              onChange={(e) =>
                setForm({ ...form, accessKey: e.target.value })
              }
              margin="normal"
            />

            <TextField
              label="Secret Access Key"
              type="password"
              fullWidth
              required
              value={form.secretKey}
              onChange={(e) =>
                setForm({ ...form, secretKey: e.target.value })
              }
              margin="normal"
            />

            <Box className="aws-editor-actions">

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>

              <Button
                type="button"
                variant="outlined"
                color="error"
                disabled={saving || !selected}
                onClick={openDeleteDialog}
              >
                Delete
              </Button>

            </Box>
          </form>
        </Box>

      </Box>

      {/* Snackbar */}

      {snackbar && (
        <SnackbarNotification
          initialOpen
          duration={4000}
          message={snackbar.msg}
          theme={
            snackbar.type === "success"
              ? SNACKBAR_THEME.GREEN
              : SNACKBAR_THEME.RED
          }
          onCloseHandler={() => setSnackbar(null)}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete AWS Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete credentials for{' '}
            <strong>{deleteTarget?.id}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeDeleteDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={deleteAccount} disabled={saving}>
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AwsAccountsManager;

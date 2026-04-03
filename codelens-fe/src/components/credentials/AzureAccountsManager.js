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
  tenantId: "",
  name: "",
  clientId: "",
  clientSecret: "",
  subscriptionId: "",
};

const AzureAccountsManager = () => {
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snackbar, setSnackbar] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      showError("No tenant selected");
      return;
    }

    setDeleteTarget(selected);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const openDeleteDialogFor = (t) => {
    if (!userId) {
      showError("Missing userId");
      return;
    }

    if (!t?.id) {
      showError("No tenant selected");
      return;
    }

    setDeleteTarget(t);
    setDeleteDialogOpen(true);
  };

  const deleteTenant = async () => {
    try {
      setSaving(true);
      await CredentialsApiService.deleteAzureCredentials(userId, deleteTarget.id);
      showSuccess("Tenant deleted successfully");
      closeDeleteDialog();
      await loadTenants();
    } catch {
      showError("Failed to delete tenant");
    } finally {
      setSaving(false);
    }
  };

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);

      if (!userId) {
        setTenants([]);
        resetForm();
        return;
      }

      const res =
        await CredentialsApiService.listAzureTenantIds(userId);

      const payload = res?.data?.data || res?.data || {};
      const withNames = Array.isArray(payload.tenants) ? payload.tenants : null;
      const ids = payload.tenantIds || [];

      const formatted = withNames
        ? withNames.map((t) => ({
            id: String(t?.tenantId ?? t?.id ?? ""),
            name: t?.name || "",
          })).filter((t) => t.id)
        : ids.map((id) => ({
            id: String(id),
            name: "",
          }));

      setTenants(formatted);

      if (formatted.length) {
        selectTenant(formatted[0]);
      } else {
        resetForm();
      }
    } catch {
      showError("Failed to load Azure tenants");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const selectTenant = (t) => {
    setSelected(t);

    setForm({
      tenantId: t.id,
      name: t?.name || "",
      clientId: "",
      clientSecret: "",
      subscriptionId: "",
    });
  };

  const saveTenant = async (e) => {
    e.preventDefault();

    const {
      tenantId,
      name,
      clientId,
      clientSecret,
      subscriptionId,
    } = form;

    if (!tenantId || !name || !clientId || !clientSecret || !subscriptionId) {
      showError("All fields are required");
      return;
    }

    const duplicate = tenants.find(
      (t) =>
        t.id === tenantId &&
        t.id !== selected?.id
    );

    if (duplicate) {
      showError("Tenant already exists");
      return;
    }

    try {
      setSaving(true);

      await CredentialsApiService.storeAzureCredentials({
        userId,
        tenantId,
        name,
        clientId,
        clientSecret,
        subscriptionId,
      });

      showSuccess("Tenant saved");

      await loadTenants();

      resetForm();
    } catch {
      showError("Failed to save tenant");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="credentials-loader">
        <CircularProgress size={28} />
        <Typography>Loading Azure tenants…</Typography>
      </Box>
    );
  }

  return (
    <Box className="azure-manager">
      <Box className="azure-header">
        <Box className="credentials-logo-circle">
          <CloudQueueIcon className="credentials-logo-icon" />
        </Box>

        <Box>
          <Typography variant="h5" className="credentials-title">
            Azure Tenants
          </Typography>

          <Typography variant="body2" className="credentials-subtext">
            Manage multiple Azure tenants securely
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box className="azure-body">
        <Box className="azure-list">
          <Typography className="azure-list-title">
            Connected Tenants
          </Typography>

          <Box className="credentials-help">
            <Typography className="credentials-help-title">
              How this works
            </Typography>

            <Typography className="credentials-help-text">
              Add your Azure tenant details once and use them to run on-demand security scans from this workspace.
            </Typography>

            <Box component="ul" className="credentials-help-list">
              <li>Credentials are used only for actions you start from this product.</li>
              <li>You can update a tenant anytime by saving new values.</li>
            </Box>
          </Box>

          {tenants.length === 0 && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No tenants added yet
            </Typography>
          )}

          {tenants.map((t) => (
            <Box
              key={t.id}
              className={`azure-account-item ${
                selected?.id === t.id ? "active" : ""
              }`}
              onClick={() => selectTenant(t)}
            >
              <Typography>{t?.name ? `${t.id}-${t.name}` : t.id}</Typography>

              <Tooltip
                title="Delete"
                placement="left"
              >
                <IconButton
                  size="small"
                  className="credentials-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialogFor(t);
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
            className="azure-add-btn"
            onClick={resetForm}
          >
            + Add Tenant
          </Button>
        </Box>

        <Box className="azure-editor">
          <Typography className="azure-editor-title">
            {selected ? "Edit Tenant" : "Add New Tenant"}
          </Typography>

          <Typography className="credentials-form-hint">
            All fields are required. For security, secrets are not displayed again after saving.
          </Typography>

          {/* IMPORTANT: autoComplete disabled */}
          <form onSubmit={saveTenant} autoComplete="off">

            {/* Chrome Autofill Trap */}
            <input
              type="text"
              name="fakeuser"
              autoComplete="username"
              style={{ display: "none" }}
            />
            <input
              type="password"
              name="fakepass"
              autoComplete="new-password"
              style={{ display: "none" }}
            />

            <TextField
              label="Tenant ID"
              fullWidth
              required
              margin="normal"
              value={form.tenantId}
              autoComplete="off"
              onChange={(e) =>
                setForm({ ...form, tenantId: e.target.value })
              }
            />

            <TextField
              label="Tenant Name"
              fullWidth
              required
              margin="normal"
              value={form.name}
              autoComplete="off"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <TextField
              label="Client ID"
              fullWidth
              required
              margin="normal"
              value={form.clientId}
              autoComplete="new-password"
              name="azure-client-id"
              onChange={(e) =>
                setForm({ ...form, clientId: e.target.value })
              }
            />

            <TextField
              label="Client Secret"
              type="password"
              fullWidth
              required
              margin="normal"
              value={form.clientSecret}
              autoComplete="new-password"
              name="azure-client-secret"
              onChange={(e) =>
                setForm({ ...form, clientSecret: e.target.value })
              }
            />

            <TextField
              label="Subscription ID"
              fullWidth
              required
              margin="normal"
              value={form.subscriptionId}
              autoComplete="off"
              onChange={(e) =>
                setForm({
                  ...form,
                  subscriptionId: e.target.value,
                })
              }
            />

            <Box className="azure-editor-actions">
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
        <DialogTitle>Delete Azure Tenant</DialogTitle>
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
          <Button variant="contained" color="error" onClick={deleteTenant} disabled={saving}>
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AzureAccountsManager;

import React, { useEffect, useState, useCallback } from "react";
import { Cloud, Trash2 } from "lucide-react";
import { useToast } from "../common/ToastProvider";
import CredentialsApiService from "../../services/CredentialsApiService";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Divider = () => <hr className="my-4 border-slate-200" />;

const EMPTY_FORM = {
  tenantId: "",
  name: "",
  clientId: "",
  clientSecret: "",
  subscriptionId: "",
};

const AzureAccountsManager = () => {
  const { success, error } = useToast();
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showSuccess = (msg) => success(msg);
  const showError = (msg) => error(msg);

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
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <Typography>Loading Azure tenants…</Typography>
      </Box>
    );
  }

  return (
    <Box className="azure-manager">
      <Box className="azure-header">
        <Box className="credentials-logo-circle">
          <Cloud className="credentials-logo-icon" size={24} />
        </Box>

        <Box>
          <Typography className="credentials-title">
            Azure Tenants
          </Typography>

          <Typography className="credentials-subtext">
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
            <Typography className="text-slate-500 mb-2">
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

              <div className="group relative">
                <button
                  type="button"
                  className="credentials-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialogFor(t);
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Box>
          ))}

          <button
            type="button"
            className="azure-add-btn"
            onClick={resetForm}
          >
            + Add Tenant
          </button>
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

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Tenant ID"
              value={form.tenantId}
              autoComplete="off"
              onChange={(e) =>
                setForm({ ...form, tenantId: e.target.value })
              }
              required
            />

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Tenant Name"
              value={form.name}
              autoComplete="off"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Client ID"
              value={form.clientId}
              autoComplete="new-password"
              name="azure-client-id"
              onChange={(e) =>
                setForm({ ...form, clientId: e.target.value })
              }
              required
            />

            <input
              type="password"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Client Secret"
              value={form.clientSecret}
              autoComplete="new-password"
              name="azure-client-secret"
              onChange={(e) =>
                setForm({ ...form, clientSecret: e.target.value })
              }
              required
            />

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Subscription ID"
              value={form.subscriptionId}
              autoComplete="off"
              onChange={(e) =>
                setForm({
                  ...form,
                  subscriptionId: e.target.value,
                })
              }
              required
            />

            <Box className="azure-editor-actions">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                type="button"
                className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                disabled={saving || !selected}
                onClick={openDeleteDialog}
              >
                Delete
              </button>
            </Box>
          </form>
        </Box>
      </Box>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Delete Azure Tenant</h3>
            <p className="mb-6 text-slate-600">
              Are you sure you want to delete credentials for <strong>{deleteTarget?.id}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={closeDeleteDialog}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                onClick={deleteTenant}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default AzureAccountsManager;

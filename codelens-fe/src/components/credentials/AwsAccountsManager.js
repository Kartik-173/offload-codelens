import React, { useEffect, useState, useCallback } from "react";
import { Cloud, Trash2 } from "lucide-react";
import { useToast } from "../common/ToastProvider";
import CredentialsApiService from "../../services/CredentialsApiService";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Divider = () => <hr className="my-4 border-slate-200" />;

const EMPTY_FORM = {
  accountId: "",
  name: "",
  accessKey: "",
  secretKey: "",
};

const AwsAccountsManager = () => {
  const { success, error } = useToast();
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------------------------------- */
  /* Utils */
  /* ---------------------------------- */

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
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <Typography>Loading AWS accounts…</Typography>
      </Box>
    );
  }

  return (
    <Box className="aws-manager">

      {/* Header */}

      <Box className="aws-header">
        <Box className="credentials-logo-circle">
          <Cloud className="credentials-logo-icon" size={24} />
        </Box>

        <Box>
          <Typography className="credentials-title">
            AWS Accounts
          </Typography>

          <Typography className="credentials-subtext">
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
            <Typography className="text-slate-500 mb-2">
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

              <div className="group relative">
                <button
                  type="button"
                  className="credentials-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialogFor(acc);
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
            className="aws-add-btn"
            onClick={resetForm}
          >
            + Add Account
          </button>
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

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="AWS Account ID (12 digits)"
              value={form.accountId}
              maxLength={12}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setForm({ ...form, accountId: value });
              }}
              required
            />
            {form.accountId && form.accountId.length !== 12 && (
              <p className="mt-1 text-xs text-red-500">AWS Account ID must be exactly 12 digits</p>
            )}

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Account Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <input
              type="text"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Access Key ID"
              value={form.accessKey}
              onChange={(e) =>
                setForm({ ...form, accessKey: e.target.value })
              }
              required
            />

            <input
              type="password"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Secret Access Key"
              value={form.secretKey}
              onChange={(e) =>
                setForm({ ...form, secretKey: e.target.value })
              }
              required
            />

            <Box className="aws-editor-actions">

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
            <h3 className="mb-4 text-lg font-semibold">Delete AWS Account</h3>
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
                onClick={deleteAccount}
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

export default AwsAccountsManager;

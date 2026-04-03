// src/hooks/useRunApiTestForm.js

import { useState } from "react";
import { initialFormState, validateApiTestForm } from "../utils/Helpers";

export const useRunApiTestForm = () => {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => {
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const change = (e) => {
    const { name, value } = e.target;

    if (name === "rate") {
      setForm((f) =>
        value === "custom"
          ? { ...f, rateMode: "custom" }
          : { ...f, rateMode: "preset", rate: Number(value) }
      );
      setErrors((e) => ({ ...e, rate: undefined, customRate: undefined }));
      return;
    }

    if (name === "duration") {
      setForm((f) =>
        value === "custom"
          ? { ...f, durationMode: "custom" }
          : { ...f, durationMode: "preset", duration: value }
      );
      setErrors((e) => ({
        ...e,
        duration: undefined,
        customDurationSeconds: undefined,
      }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
    clearError(name);
  };

  const validate = () => {
    const nextErrors = validateApiTestForm(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const reset = () => {
    setForm(initialFormState);
    setErrors({});
  };

  return {
    form,
    setForm,
    errors,
    submitting,
    setSubmitting,
    change,
    validate,
    reset,
    clearError,
  };
};

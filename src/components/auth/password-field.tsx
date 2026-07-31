"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  required = true,
  minLength = 8,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

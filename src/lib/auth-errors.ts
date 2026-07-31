const messages: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Já existe uma conta com este e-mail.",
  "Password should be at least 6 characters": "A senha informada é muito curta.",
  "New password should be different from the old password.":
    "A nova senha precisa ser diferente da senha anterior.",
};

export function translateAuthError(message: string) {
  return messages[message] ?? "Não foi possível concluir a operação. Tente novamente.";
}

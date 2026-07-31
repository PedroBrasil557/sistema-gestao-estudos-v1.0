export function noteCategoryTone(name: string): "blue" | "green" | "orange" | "purple" | "cyan" | "gray" | "red" {
  const normalized = name.toLocaleLowerCase("pt-BR");
  if (normalized.includes("dúvida") || normalized.includes("duvida")) return "purple";
  if (normalized.includes("fórmula") || normalized.includes("formula")) return "cyan";
  if (normalized.includes("conceito")) return "green";
  if (normalized.includes("ideia")) return "orange";
  if (normalized.includes("exercício") || normalized.includes("exercicio")) return "red";
  if (normalized.includes("revisão") || normalized.includes("revisao")) return "gray";
  return "blue";
}

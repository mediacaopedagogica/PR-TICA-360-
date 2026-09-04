import { PlacedObject } from './types';

export interface BudgetSummary {
  clientBudget: number;
  itemsSpent: number;
  designFee: number;
  totalSpent: number;
  remaining: number;
  exceededBy: number;
  isOverBudget: boolean;
  percentUsed: number;
}

/**
 * Fonte única de verdade do orçamento pedagógico do caso atual.
 * Regra aprovada: paredes, portas, janelas, piso e cobertura NÃO entram
 * no total de Design de Interiores. Entram apenas itens colocados no
 * projeto + honorários configurados.
 */
export function calculateBudgetSummary(
  clientBudget: number,
  placedObjects: PlacedObject[],
  designFee = 0,
): BudgetSummary {
  const safeBudget = Number.isFinite(clientBudget) ? Math.max(0, clientBudget) : 0;
  const itemsSpent = placedObjects.reduce((sum, item) => sum + (Number.isFinite(item.price) ? Math.max(0, item.price) : 0), 0);
  const safeFee = Number.isFinite(designFee) ? Math.max(0, designFee) : 0;
  const totalSpent = itemsSpent + safeFee;
  const remaining = safeBudget - totalSpent;
  const exceededBy = Math.max(0, -remaining);
  const percentUsed = safeBudget > 0 ? (totalSpent / safeBudget) * 100 : totalSpent > 0 ? 100 : 0;

  return {
    clientBudget: safeBudget,
    itemsSpent,
    designFee: safeFee,
    totalSpent,
    remaining,
    exceededBy,
    isOverBudget: totalSpent > safeBudget,
    percentUsed,
  };
}

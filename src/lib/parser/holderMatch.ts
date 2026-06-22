import type { Operator } from '@/lib/types/entities';
import type { UserAccount } from '@/lib/types/account';
import { accountDisplayName, operatorDisplayName } from '@/lib/utils/entities';
import { namesMatch } from '@/lib/parser/normalize';

/** True when the parsed holder matches a registered operator or account holder. */
export function holderMatchesRegisteredOperator(
  holderName: string,
  operators: Operator[],
  account: UserAccount | null,
): boolean {
  const trimmed = holderName.trim();
  if (!trimmed) return false;

  for (const op of operators) {
    if (namesMatch(trimmed, operatorDisplayName(op))) return true;
  }

  if (account && namesMatch(trimmed, accountDisplayName(account))) {
    return true;
  }

  return false;
}

/**
 * createOperator — owner-only callable. Enforces MAX_OPERATORS quota
 * (V-004) and the "private" / "company" sub-shape contract.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  cleanString,
  enforceQuota,
  nowIso,
  requireAppCheck,
  requireAuth,
} from './util';

interface Address {
  line1?: string; line2?: string; city?: string; postalCode?: string; country?: string;
}
interface PrivateDetails {
  firstName?: string; lastName?: string; dateOfBirth?: string;
  email?: string; phone?: string; address?: Address;
}
interface CompanyDetails {
  companyName?: string; contactPerson?: string; vatNumber?: string;
  uniqueCompanyNumber?: string; email?: string; address?: Address;
}
interface Input {
  kind?: string;
  label?: string;
  isDefault?: boolean;
  private?: PrivateDetails;
  company?: CompanyDetails;
}

function sanitizeAddress(a: Address | undefined): Address {
  return {
    line1: cleanString(a?.line1, 200),
    line2: cleanString(a?.line2, 200),
    city: cleanString(a?.city, 200),
    postalCode: cleanString(a?.postalCode, 32),
    country: cleanString(a?.country, 100),
  };
}

export const createOperator = onCall<Input>(async (request) => {
  requireAppCheck(request, 'createOperator');
  const ctx = requireAuth(request);

  const kind = cleanString(request.data.kind, 16);
  if (kind !== 'private' && kind !== 'company') {
    throw new HttpsError('invalid-argument', 'kind must be "private" or "company".');
  }

  await enforceQuota(ctx.uid, 'operator');

  const priv = request.data.private ?? {};
  const comp = request.data.company ?? {};
  const payload = {
    userId: ctx.uid,
    kind,
    label: cleanString(request.data.label, 200),
    isDefault: request.data.isDefault === true,
    private: {
      firstName: cleanString(priv.firstName, 200),
      lastName: cleanString(priv.lastName, 200),
      dateOfBirth: cleanString(priv.dateOfBirth, 32),
      email: cleanString(priv.email, 320),
      phone: cleanString(priv.phone, 64),
      address: sanitizeAddress(priv.address),
    },
    company: {
      companyName: cleanString(comp.companyName, 300),
      contactPerson: cleanString(comp.contactPerson, 200),
      vatNumber: cleanString(comp.vatNumber, 64),
      uniqueCompanyNumber: cleanString(comp.uniqueCompanyNumber, 64),
      email: cleanString(comp.email, 320),
      address: sanitizeAddress(comp.address),
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (kind === 'private' && !payload.private.firstName && !payload.private.lastName) {
    throw new HttpsError('invalid-argument', 'Private operator requires first/last name.');
  }
  if (kind === 'company' && !payload.company.companyName) {
    throw new HttpsError('invalid-argument', 'Company operator requires companyName.');
  }

  const db = getFirestore();

  if (payload.isDefault) {
    // Demote any existing default operator for this user atomically.
    const existing = await db
      .collection('operators')
      .where('userId', '==', ctx.uid)
      .where('isDefault', '==', true)
      .get();
    const batch = db.batch();
    for (const d of existing.docs) {
      batch.update(d.ref, { isDefault: false, updatedAt: nowIso() });
    }
    const ref = db.collection('operators').doc();
    batch.set(ref, payload);
    await batch.commit();
    return { id: ref.id };
  }

  const ref = await db.collection('operators').add(payload);
  return { id: ref.id };
});

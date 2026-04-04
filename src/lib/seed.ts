import { createProfile } from '@/lib/firebase/firestore';
import type { ProfileFormData } from '@/lib/types';

const demoProfile: ProfileFormData = {
  slug: 'marco-rossi-op001',
  language: 'it',
  status: 'active',
  visibility: 'public',
  verificationStatus: 'verified',
  publishedAt: '2024-06-01T08:00:00.000Z',
  lastVerifiedAt: '2024-06-15T10:30:00.000Z',

  person: {
    firstName: 'Marco',
    lastName: 'Rossi',
    birthDate: '1985-03-12',
    nationality: 'Italian',
    operatorCode: 'OP-2024-001',
    operatorLicense: 'IT-RPL-A2-2024-4521',
    emergencyContact: '+39 333 9876543',
  },

  organization: {
    companyName: 'Alpine Drones SRL',
    companyDetails: 'Professional aerial survey and inspection services.\nSpecializing in mountain and alpine environments.',
    companyAddress: 'Via Roma 42, 39100 Bolzano (BZ), Italy',
    companyVatOrRegistration: 'IT02345678901 / REA BZ-123456',
  },

  drone: {
    droneName: 'Summit Scout',
    droneModel: 'DJI Matrice 350 RTK',
    droneSerialNumber: '1ZNBJ4M0030A7E',
    droneRegistrationCode: 'IT-UAS-042-2024',
  },

  insurance: {
    provider: 'Allianz Aviation Insurance',
    policyNumber: 'AV-2024-78901-IT',
    issueDate: '2024-01-15',
    expiryDate: '2026-12-31',
    notes: 'Covers VLOS and BVLOS operations within EU airspace.',
    pdfUrl: '',
  },

  assets: {
    profilePhotoUrl: '',
    logoUrl: '',
    bannerUrl: '',
    qrCodeUrl: '',
    nfcReference: '',
  },

  documents: [],

  admin: {
    internalNotes: 'Demo profile for testing. Created automatically by seedDemoProfile().',
    lastEditedBy: 'system',
  },
};

export async function seedDemoProfile(): Promise<string> {
  const id = await createProfile(demoProfile);
  console.log('[seedDemoProfile] Created profile:', {
    id,
    slug: demoProfile.slug,
    name: `${demoProfile.person.firstName} ${demoProfile.person.lastName}`,
    organization: demoProfile.organization.companyName,
    visibility: demoProfile.visibility,
  });
  return id;
}

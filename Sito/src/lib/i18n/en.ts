/**
 * English translations — authoritative source of all translation keys.
 *
 * Every key used in the application MUST be declared here first.
 * The TypeScript type `TranslationKey` is derived from this object,
 * and all other language files are type-checked against it.
 *
 * Keys are organized into four categories:
 *
 *   LABELS    — Short UI text: field names, buttons, navigation, column headers
 *   STATUS    — State indicators and badges
 *   MESSAGES  — User-facing text: errors, alerts, hints, descriptions
 *   SECTIONS  — Page titles, section headers, subtitles, content blocks
 */

export const translations = {

  // ═══════════════════════════════════════════════════════════════════════════
  // LABELS — Field names, buttons, navigation, column headers, short UI text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Common UI ──
  'common.save': 'Save changes',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.search': 'Search',
  'common.back': 'Back',
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.upload': 'Upload',
  'common.download': 'Download',
  'common.preview': 'Preview',
  'common.publish': 'Publish',
  'common.unpublish': 'Unpublish',
  'common.published': 'Public',
  'common.unpublished': 'Private',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'common.actions': 'Actions',
  'common.language': 'Language',
  'common.all': 'All',
  'common.filter': 'Filter',
  'common.sortBy': 'Sort by',
  'common.notAvailable': 'N/A',
  'common.select': 'Select…',
  'common.clickOrDragToUpload': 'Click or drag file to upload',
  'common.remove': 'Remove',
  'common.viewDocument': 'View document',
  'common.retry': 'Try again',
  'common.tryAgain': 'Something went wrong while loading this page. Please try again later.',
  'common.version': 'v1.0',

  // ── Navigation ──
  'nav.home': 'Home',
  'nav.dashboard': 'Dashboard',
  'nav.login': 'Sign in',
  'nav.logout': 'Sign out',
  'nav.newProfile': 'New profile',
  'nav.adminBadge': 'ADMIN',
  'nav.shop': 'Shop',
  'nav.account': 'My account',
  'nav.signup': 'Create account',

  // ── Login form ──
  'login.email': 'Email address',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.noAccount': 'Don’t have an account?',
  'login.signupCta': 'Create one',

  // ── Sign-up form ──
  'signup.title': 'Create your account',
  'signup.subtitle': 'Track your orders, manage shipments and access your profile.',
  'signup.submit': 'Create account',
  'signup.passwordConfirm': 'Confirm password',
  'signup.haveAccount': 'Already have an account?',
  'signup.errorPasswordShort': 'Password must be at least 6 characters.',
  'signup.errorPasswordMismatch': 'Passwords do not match.',
  'signup.errorEmailInUse': 'An account with this email already exists.',
  'signup.errorGeneric': 'Could not create the account. Please try again.',

  // ── Account area ──
  'account.eyebrow': 'Account',
  'account.title': 'Welcome, {name}',
  'account.subtitle': 'Review your profile and follow your orders.',
  'account.tabProfile': 'Profile',
  'account.tabOrders': 'Orders',
  'account.personalInfo': 'Personal information',
  'account.shippingAddress': 'Shipping address',
  'account.readOnly': 'Read-only',
  'account.noAddress': 'No address saved yet.',
  'account.editNotice': 'Profile editing will be available soon. To change any detail, please contact our support team.',
  'account.memberSince': 'Member since {date}',

  // ── Orders ──
  'orders.emptyTitle': 'No orders yet',
  'orders.emptyDesc': 'Once you place your first order, you’ll find it here with full tracking and traceability.',
  'orders.emptyCta': 'Go to the shop',
  'orders.orderNumber': 'Order #',
  'orders.placedOn': 'Placed on {date}',
  'orders.viewDetails': 'View details',
  'orders.backToOrders': 'Back to orders',
  'orders.progress': 'Progress',
  'orders.shippingTitle': 'Shipment',
  'orders.carrier': 'Carrier',
  'orders.openTracking': 'Open tracking',
  'orders.shipTo': 'Shipped to',
  'orders.eta': 'Estimated delivery · {date}',
  'orders.deliveredOn': 'Delivered on {date}',
  'orders.items': 'Items in this order',
  'orders.professionalTrace': 'Professional traceability',
  'orders.showTrace': 'Show traceability',
  'orders.hideTrace': 'Hide traceability',
  'orders.subtotal': 'Subtotal',
  'orders.shippingFee': 'Shipping',
  'orders.total': 'Total',
  'orders.timeline': 'Full chain-of-custody',
  'orders.notFound': 'Order not found or not accessible.',

  // ── Order status labels ──
  'orderStatus.pending': 'Pending',
  'orderStatus.paid': 'Paid',
  'orderStatus.in_production': 'In production',
  'orderStatus.assembled': 'Assembled',
  'orderStatus.quality_check': 'Quality check',
  'orderStatus.packed': 'Packed',
  'orderStatus.shipped': 'Shipped',
  'orderStatus.in_transit': 'In transit',
  'orderStatus.delivered': 'Delivered',
  'orderStatus.cancelled': 'Cancelled',

  // ── Traceability detail fields ──
  'trace.batch': 'Batch',
  'trace.material': 'Material / filament',
  'trace.printedAt': 'Printed at',
  'trace.printer': 'Printer',
  'trace.assembledAt': 'Assembled at',
  'trace.assembledBy': 'Assembled by',
  'trace.qcAt': 'QC passed at',
  'trace.qcBy': 'QC inspector',
  'trace.notes': 'Notes',

  // ── Field labels ──
  'field.language': 'Language preference',
  'field.firstName': 'First name',
  'field.lastName': 'Last name',
  'field.operatorCode': 'Operator code',
  'field.email': 'Email',
  'field.phone': 'Phone',
  'field.emergencyContact': 'Emergency contact',
  'field.photo': 'Profile photo',
  'field.visibility': 'Visibility',
  'field.birthDate': 'Date of birth',
  'field.nationality': 'Nationality',
  'field.operatorLicense': 'Operator license',
  'field.companyName': 'Company name',
  'field.companyDetails': 'Company details',
  'field.companyAddress': 'Company address',
  'field.companyVatOrRegistration': 'VAT / Registration number',
  'field.droneName': 'Drone name',
  'field.droneModel': 'Model',
  'field.serialNumber': 'Serial No.',
  'field.droneRegNumber': 'Registration',
  'field.logo': 'Logo',
  'field.banner': 'Banner image',
  'field.insuranceProvider': 'Insurance provider',
  'field.policyNumber': 'Policy number',
  'field.issuedAt': 'Issue date',
  'field.expiresAt': 'Expiry date',
  'field.policyPdf': 'Policy document (PDF)',
  'field.insuranceNotes': 'Policy notes',
  'field.qrImage': 'QR code image',
  'field.slug': 'Public URL slug',
  'field.lastEditedBy': 'Last edited by',
  'field.publishedAt': 'Published at',
  'field.lastVerifiedAt': 'Last verified at',
  'field.adminNotes': 'Internal admin notes',

  // ── Dashboard table columns ──
  'dashboard.name': 'Operator',
  'dashboard.organization': 'Organization',
  'dashboard.operatorCode': 'Operator code',
  'dashboard.verification': 'Verification',
  'dashboard.insuranceStatus': 'Insurance',
  'dashboard.expiryDate': 'Expiry date',
  'dashboard.updatedAt': 'Updated',
  'dashboard.completeness': 'Completeness',
  'dashboard.policyExpiry': 'Policy expiry',
  'dashboard.draft': 'Draft',
  'dashboard.status': 'Status',
  'dashboard.incomplete': 'Incomplete',

  // ── Dashboard filters ──
  'dashboard.filterByStatus': 'Filter by status',
  'dashboard.filterByPolicy': 'Filter by policy',
  'dashboard.filterByVerification': 'Verification',
  'dashboard.filterByVisibility': 'Visibility',
  'dashboard.sortName': 'Name',
  'dashboard.sortExpiry': 'Policy expiry',
  'dashboard.sortPriority': 'Document urgency',
  'dashboard.sortUpdated': 'Last updated',

  // ── Document type labels ──
  'docType.insurancePolicy': 'Insurance policy',
  'docType.operatorLicense': 'Operator license',
  'docType.droneRegistration': 'Drone registration',
  'docType.trainingCertificate': 'Training certificate',
  'docType.other': 'Other document',

  // ── Public page data labels ──
  'profile.operatorId': 'Operator ID',
  'profile.registrationCode': 'Registration',
  'profile.provider': 'Provider',
  'profile.policyNumber': 'Policy No.',
  'profile.coverage': 'Coverage',
  'profile.validFrom': 'Valid from',
  'profile.validUntil': 'Valid until',
  'profile.notes': 'Notes',
  'profile.viewPolicy': 'View original policy document',
  'profile.downloadPolicy': 'Download policy document',
  'profile.droneId': 'Drone ID',
  'profile.droneModel': 'Model',
  'profile.serialNumber': 'Serial No.',
  'profile.droneRegNumber': 'Registration',
  'profile.category': 'Category',
  'profile.contact': 'Contact',
  'profile.emergencyContact': 'Emergency',
  'profile.documents': 'Documents',
  'profile.verifiedOn': 'Verified on',
  'profile.lastUpdated': 'Last updated',

  // ── Toggle / action labels ──
  'toggle.makePublic': 'Publish',
  'toggle.makePrivate': 'Unpublish',
  'form.generateSlug': 'Generate URL',
  'form.publicUrlPreview': 'Public URL:',
  'form.profileId': 'Profile ID:',

  // ── Verification links labels ──
  'field.nfcReference': 'NFC tag reference',
  'field.publicUrl': 'Public page URL',
  'links.copyUrl': 'Copy',
  'links.copied': 'Copied',
  'links.nfcNotAssigned': 'Not assigned',

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS — State indicators, badges, computed statuses
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Profile lifecycle ──
  'status.active': 'Active',
  'status.draft': 'Draft',
  'status.archived': 'Archived',
  'status.suspended': 'Suspended',

  // ── Visibility ──
  'visibility.private': 'Private',
  'visibility.public': 'Public',

  // ── Verification ──
  'verification.unverified': 'Unverified',
  'verification.pending': 'Pending review',
  'verification.verified': 'Verified',
  'verification.rejected': 'Rejected',
  'verification.status': 'Verification status',
  'verification.lastVerified': 'Last verified',
  'verification.verifiedBy': 'Verified by',
  'verification.notes': 'Verification notes',

  // ── Insurance policy ──
  'policy.valid': 'Valid',
  'policy.expiring': 'Expiring soon',
  'policy.expired': 'Expired',
  'policy.missing': 'Missing',
  'policy.status': 'Policy status',

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES — Errors, alerts, hints, descriptions, dynamic text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Login & auth ──
  'login.error': 'Authentication failed. Check your credentials and try again.',
  'login.restrictedNotice': 'Restricted to authorized administrators.',

  // ── Form validation & feedback ──
  'form.validation.required': 'This field is required',
  'form.validation.slugRequired': 'A public URL slug is required before publishing',
  'form.validation.slugFormat': 'Slug must contain only lowercase letters, numbers, and hyphens',
  'form.saving': 'Saving…',
  'form.saved': 'All changes saved successfully.',
  'form.submitError': 'Failed to save. Please check your connection and try again.',

  // ── Form hints ──
  'form.photoHint': 'Square image recommended, minimum 200\u00d7200 px.',
  'form.pdfHint': 'Upload the original insurance policy document in PDF format.',
  'form.qrHint': 'Upload or generate a QR code for this operator profile.',

  // ── Dashboard alerts ──
  'dashboard.alerts': 'Operational Alerts',
  'dashboard.alertNoPdf': '{count} profile(s) missing insurance PDF',
  'dashboard.alertExpiring': '{count} policy(s) expiring within 30 days',
  'dashboard.alertCompleteNotPublished': '{count} complete profile(s) not yet published',
  'dashboard.alertPublishedNotVerified': '{count} published profile(s) not verified',
  'dashboard.noAlerts': 'No operational alerts. Everything looks good.',

  // ── Dashboard messages ──
  'dashboard.confirmDelete': 'This will permanently delete the operator profile, including all associated documents and public verification links. This cannot be undone.',
  'dashboard.deleteModalNote': 'All public QR and NFC verification links for this operator will stop working immediately. Associated documents and metadata will be permanently removed.',
  'dashboard.adjustFilters': 'No profiles match the current filters. Adjust your criteria or clear filters.',
  'dashboard.searchPlaceholder': 'Name, company, or operator code…',
  'common.noResults': 'No matching profiles',
  'common.filtersActive': '{count} filter(s) active',
  'common.clearFilters': 'Clear all filters',
  'common.noDocument': 'No document uploaded',
  'common.noQr': 'No QR code uploaded',

  // ── Policy descriptions (dynamic) ──
  'policy.daysLeft': '{days} days remaining',
  'policy.expiredDaysAgo': 'Expired {days} days ago',
  'policy.desc.validUntil': 'Valid until {date}',
  'policy.desc.expiringOn': 'Expiring on {date} — {days} days left',
  'policy.desc.expiredOn': 'Expired on {date} ({days} days ago)',
  'policy.desc.noPolicyOnFile': 'No policy document on file',

  // ── Public page messages ──
  'public.insuranceValid': 'Insurance coverage is active and valid.',
  'public.insuranceExpiring': 'Insurance coverage is expiring within {days} days.',
  'public.insuranceExpired': 'Insurance coverage has expired. Contact the operator or organization for updated documentation.',
  'public.insuranceMissing': 'No insurance information on file for this operator.',
  'public.noInformation': 'Not provided',
  'public.policyNotAvailable': 'Original policy document not available.',
  'public.policyNotAvailableHint': 'The issuing organization has not uploaded the policy document for this profile.',
  'public.latestRecord': 'This page reflects the latest published record as of the date shown above.',
  'public.scanToVerify': 'Scan this code to verify the operator profile',

  // ── Profile unavailable messages ──
  'profile.notFoundDesc': 'The operator profile you are looking for does not exist or has been removed.',
  'profile.notPublishedDesc': 'This operator profile is currently not available for public viewing. It may be under review or has been withdrawn.',
  'profile.disclaimer': 'This information is provided for verification purposes only. Data accuracy is the responsibility of the issuing organization.',
  'profile.expiringInDays': 'Expiring in {days} days',

  // ── Verification links descriptions ──
  'links.publicUrlDesc': 'This is the permanent public URL for this operator profile. Share it directly or encode it in the QR code.',
  'links.publicUrlNotReady': 'Set a slug and publish the profile to generate a public URL.',
  'links.qrDesc': 'Upload or generate a QR code image that links to this operator\u2019s public verification page.',
  'links.nfcDesc': 'A physical NFC tag can be linked to this profile for tap-to-verify access. NFC tag programming is not yet available.',
  'links.nfcFuture': 'NFC integration will be available in a future release. This field is reserved for the NFC tag identifier.',

  // ── Empty states ──
  'empty.noProfilesIcon': 'No operators registered',
  'empty.noResultsIcon': 'No matching results',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS — Page titles, section headers, subtitles, content blocks
  // ═══════════════════════════════════════════════════════════════════════════

  // ── App identity ──
  'app.title': 'DroneTag',
  'app.description': 'Operator credential verification and insurance document management for the drone industry',

  // ── Login page ──
  'login.title': 'Administration Access',
  'login.subtitle': 'Sign in to manage operator profiles, documents, and verification records.',

  // ── Home page ──
  'home.hero': 'Drone Operator Credential Verification',
  'home.subtitle': 'A centralized platform for issuing, managing, and verifying professional operator credentials, insurance documents, and compliance records.',
  'home.feature1Title': 'Operator Credentials',
  'home.feature1Desc': 'Issue digital identification profiles for UAS operators, linked to insurance documentation and registration data.',
  'home.feature2Title': 'Real-Time Verification',
  'home.feature2Desc': 'Third parties can instantly verify operator credentials and insurance validity via public QR-linked profiles.',
  'home.feature3Title': 'Compliance Monitoring',
  'home.feature3Desc': 'Automated tracking of insurance policy expiry dates, document completeness, and verification status across all operators.',
  'home.cta': 'Administrator Sign In',
  'home.footer': 'DroneTag \u00a9 {year}. Operator verification and document management.',
  'home.learnMore': 'How it works',
  'home.systemDesc': 'DroneTag provides a professional document management layer for drone operations, connecting operators, organizations, and verifiers through a single source of truth.',

  // ── Dashboard ──
  'dashboard.title': 'Operator Profiles',
  'dashboard.subtitle': 'Manage credentials, insurance policies, and verification status for all registered operators.',
  'dashboard.createNew': 'Register operator',
  'dashboard.noProfiles': 'No operator profiles registered',
  'dashboard.noProfilesHint': 'Register your first operator to begin managing credentials, insurance tracking, and public verification.',
  'dashboard.deleteModalTitle': 'Permanently delete operator profile?',

  // ── Dashboard KPI labels ──
  'dashboard.stats.total': 'Total profiles',
  'dashboard.stats.published': 'Public',
  'dashboard.stats.verified': 'Verified',
  'dashboard.stats.expiring': 'Expiring soon',
  'dashboard.stats.expired': 'Expired',
  'dashboard.stats.incomplete': 'Incomplete',

  // ── Admin pages ──
  'admin.createProfileTitle': 'Register New Operator',
  'admin.editProfileTitle': 'Edit Operator Profile',
  'admin.environment': 'Administration',

  // ── Form section headers ──
  'form.person': 'Operator Identity',
  'form.person.desc': 'Personal identification and contact details for the operator.',
  'form.organization': 'Organization',
  'form.organization.desc': 'Company or organization the operator is affiliated with.',
  'form.insurance': 'Insurance Coverage',
  'form.insurance.desc': 'Third-party liability insurance details and policy documentation.',
  'form.drone': 'Registered Drone',
  'form.drone.desc': 'UAS (Unmanned Aircraft System) identification and registration data.',
  'form.documents': 'Additional Documents',
  'form.verification': 'Verification & Audit',
  'form.verification.desc': 'Verification status and audit trail.',
  'form.assets': 'Media & Documents',
  'form.assets.desc': 'Profile photos, organization logo, and verification codes.',
  'form.statusAndAccess': 'Publication & Access Control',
  'form.statusAndAccess.desc': 'Controls profile lifecycle, visibility, and public URL.',
  'form.adminSection': 'Internal Notes',
  'form.adminSection.desc': 'Administrative annotations. Not visible on the public profile.',

  // ── Verification links section ──
  'form.verificationLinks': 'Verification & Access Links',
  'form.verificationLinks.desc': 'Public URL, QR code, and NFC reference for external verification of this operator profile.',
  'links.publicUrlTitle': 'Public Page URL',
  'links.qrTitle': 'QR Code',
  'links.nfcTitle': 'NFC Tag',

  // ── Form card headers ──
  'form.publicDataTitle': 'Operator Data',
  'form.publicDataSubtitle': 'This data may be visible on the public verification page when published.',
  'form.mediaTitle': 'Media & Verification Codes',
  'form.mediaSubtitle': 'Visual assets used on the public profile and verification page.',
  'form.adminTitle': 'Administration',
  'form.adminSubtitle': 'Internal settings and metadata. Not exposed on the public page.',

  // ── Public profile section headers ──
  'profile.organization': 'Organization',
  'profile.orgDetails': 'Organization Details',
  'profile.insurance': 'Insurance Coverage',
  'profile.qrCode': 'QR Verification',
  'profile.droneInfo': 'Registered Drone',
  'profile.notFound': 'Profile not found',
  'profile.notPublished': 'Profile not available',
  'public.operatorProfile': 'Operator Profile',
  'public.verifiedOperator': 'Verified Operator',
  'public.identity': 'Operator Identity',
  'public.operatorCode': 'Operator Code',
  'public.licenseNumber': 'License No.',
  'public.droneInformation': 'Drone Information',
  'public.insuranceCoverage': 'Insurance Coverage',
  'public.policyDetails': 'Policy Details',
  'public.policyDocument': 'Policy Document',
  'public.qrVerification': 'QR Verification Code',
  'public.verificationRecord': 'Verification Record',
  'public.profileReference': 'Profile Reference',
  'public.poweredBy': 'Powered by DroneTag',

} as const satisfies Record<string, string>;

/** Union of every valid translation key, derived from the English file. */
export type TranslationKey = keyof typeof translations;

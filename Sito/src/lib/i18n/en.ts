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
  'login.adminProvisioned':
    'Accounts are created by an administrator. Contact us if you need credentials.',

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
  'account.notProvisioned.title': 'Account not activated',
  'account.notProvisioned.body':
    'You can sign in, but your profile has not been created by an administrator yet. Contact DroneTag to get access.',

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
  'field.holderName': 'Policy holder',
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
  'dashboard.viewPublicProfile': 'View public profile',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // M2 — User dashboard CRUD (multi-entity model)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Account tabs ──
  'account.tab.operators': 'Operators',
  'account.tab.drones': 'Drones',
  'account.tab.insurances': 'Insurances',
  'account.tab.certificates': 'Certificates',
  'account.tab.documents': 'Documents',

  // ── Account profile editor ──
  'account.section.accountType': 'Account type',
  'account.accountType.private': 'Private individual',
  'account.accountType.company': 'Company',
  'account.section.privateInfo': 'Personal information',
  'account.section.companyInfo': 'Company information',
  'account.section.address': 'Address',
  'account.section.media': 'Public profile images',
  'account.mediaHint': 'Photo, logo and banner appear on your public drone page (/u/…). Contact and address details stay private.',
  'account.section.pilot': 'Pilot identity',
  'account.saved': 'Changes saved',
  'account.saveError': 'Could not save changes. Please try again.',
  'account.editHint': 'Edit your account details. Photo, logo and banner are shown on your public drone page; address, phone and other fields stay private.',

  // ── Common address / company fields ──
  'field.addressLine1': 'Address line 1',
  'field.addressLine2': 'Address line 2 (optional)',
  'field.city': 'City',
  'field.postalCode': 'Postal code',
  'field.country': 'Country',
  'field.companyContactPerson': 'Contact person',
  'field.companyVat': 'VAT / tax number',
  'field.companyUniqueNumber': 'Company registry number (optional)',

  // ── Operators ──
  'operator.list.title': 'Operators',
  'operator.list.subtitle': 'Up to {max} operators per account.',
  'operator.list.empty': 'No operators yet',
  'operator.list.emptyDesc': 'Add an operator to associate with your drones.',
  'operator.list.new': 'New operator',
  'operator.list.atCap': 'You have reached the operator limit.',
  'operator.kind.private': 'Private individual',
  'operator.kind.company': 'Company',
  'operator.field.kind': 'Operator type',
  'operator.field.label': 'Display label',
  'operator.field.isDefault': 'Default operator',
  'operator.field.isDefaultHint': 'Used when no temporary override is active.',
  'operator.current.badge': 'Current operator',
  'operator.current.hint': 'Select your current operator here. It is pre-filled when you create a new drone and used when no temporary override is active on a flight.',
  'operator.current.set': 'Set {name} as current operator',
  'operator.current.setShort': 'Set as current',
  'operator.create.title': 'New operator',
  'operator.edit.title': 'Edit operator',
  'operator.delete.title': 'Delete operator?',
  'operator.delete.warningPublic': 'This operator is currently the default for {count} public drone(s). Deleting it will leave those drones without a default operator.',

  // ── Drones ──
  'drone.list.title': 'Drones',
  'drone.list.empty': 'No drones yet',
  'drone.list.emptyDesc': 'Add your first drone to publish a public profile.',
  'drone.list.new': 'New drone',
  'drone.list.atCap': 'You have used all your drone slots.',
  'drone.field.manufacturer': 'Manufacturer',
  'drone.field.model': 'Model / name',
  'drone.field.classMarking': 'Class marking',
  'drone.field.serialNumber': 'Drone serial number',
  'drone.field.controllerSerial': 'Controller serial number',
  'drone.field.defaultOperator': 'Default operator',
  'drone.field.linkedPilot': 'Linked pilot',
  'drone.field.insurance': 'Insurance policy',
  'drone.field.insuranceNone': 'No insurance linked',
  'drone.field.status': 'Status',
  'drone.field.visibility': 'Visibility',
  'drone.field.slug': 'Public URL slug',
  'drone.publicUrl': 'Public URL',
  'drone.copySlug': 'Copy public URL',
  'drone.slugCopied': 'Public URL copied',
  'drone.create.title': 'New drone',
  'drone.edit.title': 'Drone details',
  'drone.delete.title': 'Delete drone?',
  'drone.delete.warning': 'This drone is currently public at {url}. The QR/NFC card will stop working immediately.',
  'drone.class.c0': 'C0 (under 250 g)',
  'drone.class.c1': 'C1 (under 900 g)',
  'drone.class.c2': 'C2 (under 4 kg)',
  'drone.class.c3': 'C3 (under 25 kg)',
  'drone.class.c4': 'C4 (under 25 kg, no automation)',
  'drone.class.unknown': 'Unknown / not classified',
  'drone.detail.basics': 'Basic information',
  'drone.detail.identity': 'Identity & serials',
  'drone.detail.publish': 'Publishing',
  'drone.detail.linked': 'Linked entities',
  'drone.backToList': 'Back to drones',

  // ── Insurances ──
  'insurance.list.title': 'Insurance policies',
  'insurance.list.subtitle': 'Policies linked to a drone or operator.',
  'insurance.list.empty': 'No insurance policies',
  'insurance.list.emptyDesc': 'Add a policy to attach to your drone or operator.',
  'insurance.list.new': 'New policy',
  'insurance.field.link': 'Linked to',
  'insurance.link.drone': 'Drone',
  'insurance.link.operator': 'Operator',
  'insurance.field.drone': 'Linked drone',
  'insurance.field.operator': 'Linked operator',
  'insurance.create.title': 'New insurance policy',
  'insurance.edit.title': 'Edit insurance policy',
  'insurance.delete.title': 'Delete insurance?',
  'insurance.delete.warningPublic': 'This policy is currently linked to a public drone. Deleting it will remove the insurance status from that public profile.',
  'insurance.field.validity': 'Valid from – to',
  'insurance.parse.hint': 'We read holder, policy number, dates and drone marca/tipo from the PDF. You can edit the fields below.',
  'insurance.parse.parsing': 'Reading policy data from PDF…',
  'insurance.parse.success': 'Policy data extracted — check the fields below.',
  'insurance.parse.partial': 'Some fields were extracted — please complete the rest manually.',
  'insurance.parse.failed': 'Could not read this PDF automatically. Enter the details manually.',
  'insurance.parse.droneDetected': 'Drone from PDF',
  'insurance.parse.droneMatched': 'linked to your fleet',
  'insurance.parse.droneNotMatched': 'select the drone manually',

  // ── Certificates ──
  'cert.list.title': 'Certificates',
  'cert.list.subtitle': 'A1/A3, A2, STS-theoretical, STS-01, STS-02 or custom.',
  'cert.list.empty': 'No certificates',
  'cert.list.emptyDesc': 'Add your A1/A3, A2 or STS certificates.',
  'cert.list.new': 'New certificate',
  'cert.list.atCap': 'You have used all your certificate slots.',
  'cert.field.kind': 'Certificate type',
  'cert.field.label': 'Display label',
  'cert.field.registrationNumber': 'Registration number',
  'cert.field.registrationNumberHint': 'Read from the PDF automatically, or enter manually',
  'cert.field.issuedBy': 'Issued by',
  'cert.field.fileUrl': 'Certificate URL',
  'cert.field.filePdf': 'Certificate document (PDF)',
  'cert.field.number': 'Certificate number',
  'cert.field.notes': 'Notes',
  'cert.kind.a1a3': 'A1 / A3',
  'cert.kind.a2': 'A2',
  'cert.kind.stsTheoretical': 'STS theoretical',
  'cert.kind.sts01': 'STS-01',
  'cert.kind.sts02': 'STS-02',
  'cert.kind.custom': 'Custom certificate',
  'cert.create.title': 'New certificate',
  'cert.edit.title': 'Edit certificate',
  'cert.delete.title': 'Delete certificate?',
  'cert.parse.hint': 'For Italian certificates we auto-read the ITA-… code, dates and type. You can edit the fields below.',
  'cert.parse.parsing': 'Reading certificate data from PDF…',
  'cert.parse.success': 'Certificate data extracted — check the fields below.',
  'cert.parse.partial': 'Some fields were extracted — please complete the rest manually.',
  'cert.parse.failed': 'Could not read this PDF automatically. Enter the details manually.',

  // ── Documents ──
  'doc.list.title': 'Uploaded documents',
  'doc.list.subtitle': '{used} of {max} document slots used.',
  'doc.list.empty': 'No documents',
  'doc.list.emptyDesc': 'Upload PDFs (insurance policy, registration, training certificate, etc).',
  'doc.list.new': 'New document',
  'doc.list.atCap': 'You have used all your document slots.',
  'doc.field.kind': 'Document type',
  'doc.field.label': 'Display label',
  'doc.field.fileUrl': 'File URL',
  'doc.field.fileName': 'File name',
  'doc.field.notes': 'Notes',
  'doc.kind.insurance_policy': 'Insurance policy',
  'doc.kind.operator_license': 'Operator license',
  'doc.kind.drone_registration': 'Drone registration',
  'doc.kind.training_certificate': 'Training certificate',
  'doc.kind.identity': 'Identity document',
  'doc.kind.other': 'Other',
  'doc.create.title': 'New document',
  'doc.edit.title': 'Edit document',
  'doc.delete.title': 'Delete document?',
  'doc.urlHint': 'Paste a public URL to the file (Firebase Storage URL, signed link, etc).',

  // ── Slot helpers ──
  'slot.usage': '{used} of {max} used',
  'slot.atCap': 'Limit reached',
  'slot.contactToUpgrade': 'Contact admin to add more slots.',

  // ── Confirm dialog ──
  'confirm.continue': 'Continue',
  'confirm.dangerWarning': 'This action cannot be undone.',

  // ── Form errors ──
  'form.errors.title': 'Please fix the highlighted fields.',
  'form.errors.invalidEmail': 'Enter a valid email address.',
  'form.errors.invalidUrl': 'Enter a valid URL.',
  'form.errors.urlNotAllowed': 'URL must be hosted on Firebase Storage or a trusted host configured by the admin.',
  'form.errors.expiryBeforeIssue': 'Expiry date must be after the issue date.',

  // ═══════════════════════════════════════════════════════════════════════════
  // M3 — Public drone page + Report found drone
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Public drone card ──
  'publicDrone.eyebrow': 'Drone identification',
  'publicDrone.holderPilot': 'Pilot',
  'publicDrone.holderOperatorPrivate': 'Operator',
  'publicDrone.holderOperatorCompany': 'Operator (company)',
  'publicDrone.classification': 'Drone class',
  'publicDrone.identifier': 'Serial number',
  'publicDrone.policyNumberMasked': 'Policy reference',
  'publicDrone.validUntil': 'Valid until',
  'publicDrone.insuranceUnknown': 'No insurance information on file',
  'publicDrone.insuranceActive': 'Insurance active',
  'publicDrone.insuranceExpiring': 'Insurance expiring soon',
  'publicDrone.insuranceExpired': 'Insurance expired',
  'publicDrone.viewPolicyPdf': 'View policy document',
  'publicDrone.openApp': 'Open app / sign in',
  'publicDrone.reportFound': 'I found this drone',
  'publicDrone.reportFoundShort': 'Report found drone',
  'publicDrone.lastVerified': 'Last verified',
  'publicDrone.publishedOn': 'Published on',
  'publicDrone.disclaimer': 'DroneTag is a private digital identification platform. It does not replace official operator registration, pilot certification, insurance obligations or authority-issued documentation.',

  // ── Report form (modal) ──
  'reportFound.title': 'Report a found drone',
  'reportFound.subtitle': 'Help return this drone to its owner. Sharing your contact details is optional.',
  'reportFound.field.finderName': 'Your name (optional)',
  'reportFound.field.finderEmail': 'Your email (optional)',
  'reportFound.field.message': 'Message to the owner (optional)',
  'reportFound.field.locationText': 'Approximate location (optional)',
  'reportFound.field.locationTextHint': 'Free-form: address, landmark, neighbourhood, etc.',
  'reportFound.geolocation.add': 'Share my GPS location',
  'reportFound.geolocation.added': 'GPS location captured',
  'reportFound.geolocation.remove': 'Remove GPS location',
  'reportFound.geolocation.error': 'Could not access location. You can still describe it in the field above.',
  'reportFound.privacy': 'Your details are sent only to the drone owner. The owner cannot see your phone number or address.',
  'reportFound.submit': 'Send report',
  'reportFound.submitting': 'Sending…',
  'reportFound.successTitle': 'Thank you for the report',
  'reportFound.successBody': 'The drone owner has been notified. They may reach out using the contact details you provided, if any.',
  'reportFound.errorBody': 'We could not send your report. Please try again in a moment.',
  'reportFound.cooldown': 'Please wait a few seconds before sending another report.',

  // ── Inbox ──
  'inbox.title': 'Inbox',
  'inbox.subtitle': 'Reports from people who found one of your drones.',
  'inbox.tab': 'Inbox',
  'inbox.empty': 'No reports yet',
  'inbox.emptyDesc': 'When someone scans one of your public drone cards and uses the “Report found drone” button, you will see their message here.',
  'inbox.unread': 'Unread',
  'inbox.read': 'Read',
  'inbox.markRead': 'Mark as read',
  'inbox.viewLocation': 'Open in map',
  'inbox.locationCoords': '{lat}, {lng} (±{accuracy} m)',
  'inbox.fromAnonymous': 'Anonymous finder',
  'inbox.contact': 'Contact',
  'inbox.location': 'Reported location',
  'inbox.message': 'Message',
  'inbox.about': 'About this drone',
  'inbox.openDrone': 'Open drone',
  'inbox.receivedAt': 'Received {date}',

  // ── Public page error / loading states ──
  'publicDrone.errorTitle': 'Could not load this drone',
  'publicDrone.errorBody': 'There was a problem retrieving the drone profile. Please check your connection and try again.',

  // ═══════════════════════════════════════════════════════════════════════════
  // M4 — Temporary operator switching
  // ═══════════════════════════════════════════════════════════════════════════

  'activeOp.section.title': 'Active operator',
  'activeOp.section.subtitle': 'Temporarily reassign this drone to another operator. The override automatically expires after 24 hours.',
  'activeOp.label.effective': 'Effective right now',
  'activeOp.label.default': 'Default operator',
  'activeOp.label.activeOverride': 'Temporary override',
  'activeOp.label.expiresAt': 'Reverts to default at',
  'activeOp.label.setAt': 'Activated at',
  'activeOp.label.reason': 'Reason',
  'activeOp.countdown.hours': '{hours}h {minutes}m left',
  'activeOp.countdown.minutes': '{minutes}m left',
  'activeOp.countdown.expired': 'Expired — falling back to the default operator',
  'activeOp.cta.switch': 'Switch active operator',
  'activeOp.cta.clearNow': 'Clear temporary operator now',
  'activeOp.cta.confirmAndApply': 'Confirm and activate',
  'activeOp.modal.title': 'Activate temporary operator',
  'activeOp.modal.subtitle': 'Choose the operator that should be in charge of this drone for the next 24 hours.',
  'activeOp.modal.field.operator': 'Operator',
  'activeOp.modal.field.reason': 'Reason (optional)',
  'activeOp.modal.field.reasonHint': 'Helps you and any admin understand why the override was activated.',
  'activeOp.modal.responsibility': 'I confirm that I have verified all operator data, insurance coverage, drone association and legal responsibility before activating this operator.',
  'activeOp.modal.responsibilityRequired': 'You must confirm responsibility before activating the temporary operator.',
  'activeOp.modal.duration': 'The override stays active for 24 hours and then automatically reverts to the default operator.',
  'activeOp.modal.sameAsDefault': 'The selected operator is already the default. Choose a different operator to activate a temporary override.',
  'activeOp.empty.noAlternativeTitle': 'No alternative operator available',
  'activeOp.empty.noAlternativeDesc': 'Add a second operator on the Operators page to enable temporary switching.',
  'activeOp.clear.title': 'Clear temporary operator?',
  'activeOp.clear.message': 'The drone will immediately revert to its default operator and the override audit trail will be removed.',
  'activeOp.banner.activeNow': 'A temporary operator override is currently active.',
  'activeOp.errorBody': 'Could not update the active operator. Please try again.',

  // ═══════════════════════════════════════════════════════════════════════════
  // M5 — Admin panel + plans/slots + PWA + final disclaimers
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Canonical legal disclaimer (PRD §9) ──
  'legal.platformDisclaimer': 'DroneTag is a private digital identification and document management platform. It does not replace official drone operator registration, pilot certification, insurance obligations, or authority-issued documentation.',
  'legal.notOfficial': 'Not an official government or aviation authority registry.',

  // ── Admin nav / overview ──
  'admin.title': 'Admin',
  'admin.subtitle': 'Operate the platform: users, drones, reports, plans and verification queue.',
  'admin.nav.overview': 'Overview',
  'admin.nav.users': 'Users',
  'admin.nav.drones': 'Drones',
  'admin.nav.reports': 'Reports',
  'admin.nav.verify': 'Verification',
  'admin.nav.plans': 'Plans',
  'admin.nav.legacy': 'Legacy profiles',
  'admin.stats.users': 'Users',
  'admin.stats.drones': 'Drones',
  'admin.stats.publicDrones': 'Public drones',
  'admin.stats.reports': 'Reports',
  'admin.stats.unreadReports': 'Unread reports',
  'admin.stats.plans': 'Active plans',
  'admin.stats.activeOverrides': 'Active overrides',
  'admin.stats.legacyProfiles': 'Legacy profiles',

  // ── Admin users ──
  'admin.users.title': 'Users',
  'admin.users.subtitle': 'View, search and edit any account on the platform.',
  'admin.users.searchPlaceholder': 'Name, email, company, VAT…',
  'admin.users.empty': 'No users yet',
  'admin.users.loadError':
    'Could not load users. Check you are online, have admin permissions (sign out and back in after grant-admin), and that Firestore rules are deployed.',
  'admin.users.create.title': 'New user',
  'admin.users.create.subtitle':
    'Create login credentials and Firestore profile. The user can sign in and manage their documents only.',
  'admin.users.create.tempPassword': 'Temporary password',
  'admin.users.create.submit': 'Create user',
  'admin.users.create.errorEmailInUse': 'An account with this email already exists.',
  'admin.users.create.errorGeneric': 'Could not create the user. Please try again.',
  'admin.users.create.errorAdminSdk':
    'Firebase Admin is not configured locally. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env.local to your service-account JSON file path (Firebase Console \u2192 Project settings \u2192 Service accounts \u2192 Generate new private key), then restart npm run dev.',
  'admin.users.create.errorNameRequired': 'First name and last name are required.',
  'admin.users.create.errorInvalidEmail': 'Enter a valid email address.',
  'admin.users.create.errorAuth': 'Admin session expired. Sign out, sign in again, and retry.',
  'admin.users.create.errorNetwork':
    'Network error while creating the user. Check your connection and try again.',
  'admin.users.create.errors.summary':
    '{count} fields need attention before the account can be created.',
  'admin.users.create.errors.email_required': 'Email is required so the user can sign in.',
  'admin.users.create.errors.email_invalid': 'Enter a valid email address (e.g. name@company.it).',
  'admin.users.create.errors.password_required':
    'Temporary password is required (share it with the user securely).',
  'admin.users.create.errors.password_too_short': 'Password must be at least 6 characters.',
  'admin.users.create.errors.firstName_required': 'First name is required.',
  'admin.users.create.errors.lastName_required': 'Last name is required.',
  'admin.users.create.errors.companyName_required':
    'Company name is required for company accounts.',
  'admin.users.create.errors.companyContactPerson_required':
    'Contact person is required for company accounts.',
  'admin.users.col.name': 'Name',
  'admin.users.col.type': 'Type',
  'admin.users.col.email': 'Email',
  'admin.users.col.created': 'Created',
  'admin.users.openProfile': 'Manage account',
  'admin.users.editData': 'Edit details',
  'common.showPassword': 'Show password',
  'common.hidePassword': 'Hide password',
  'admin.users.loginHint.title': 'User sign-in',
  'admin.users.loginHint.body':
    'The user signs in at /login with this email and the temporary password set at creation. They can complete their profile under My account after the first login.',
  'admin.users.publicHint.title': 'Public page (QR / NFC)',
  'admin.users.publicHint.body':
    'In the current model the public page is tied to a drone with Public visibility and a slug. The user creates it under My account → Drones, or you manage it in the Drones section below.',
  'admin.users.publicHint.none':
    'No public drone yet: create a drone and set visibility to Public to get the /u/slug URL.',
  'admin.users.publicProfileUnavailable':
    'No public page yet: add a drone with Public visibility and a slug (My account \u2192 Drones).',
  'admin.users.detail.account': 'Account fields',
  'admin.users.detail.pilot': 'Pilot identity',
  'admin.users.detail.slots': 'Slots',
  'admin.users.detail.operators': 'Operators',
  'admin.users.detail.drones': 'Drones',
  'admin.users.detail.insurances': 'Insurances',
  'admin.users.detail.certificates': 'Certificates',
  'admin.users.detail.documents': 'Documents',
  'admin.users.backToList': 'Back to users',

  // ── Admin slots editor ──
  'admin.slots.title': 'Slots & quotas',
  'admin.slots.subtitle': 'Set how many of each slot kind this user is entitled to.',
  'admin.slots.kind.certificate': 'Certificates',
  'admin.slots.kind.drone': 'Drones',
  'admin.slots.kind.operator': 'Operators (max 3)',
  'admin.slots.kind.pdf': 'Document PDFs',
  'admin.slots.kind.nfc_badge': 'Physical NFC badges',
  'admin.slots.kind.personalization': 'Personalization (logo / banner)',
  'admin.slots.usage': 'Used: {used}',
  'admin.slots.save': 'Save slot counts',

  // ── Admin verification queue ──
  'admin.verify.title': 'Verification queue',
  'admin.verify.subtitle': 'Approve or reject documents, certificates and insurance policies submitted by users.',
  'admin.verify.tab.documents': 'Documents',
  'admin.verify.tab.certificates': 'Certificates',
  'admin.verify.tab.insurances': 'Insurances',
  'admin.verify.markVerified': 'Mark verified',
  'admin.verify.markRejected': 'Mark rejected',
  'admin.verify.markPending': 'Mark pending',
  'admin.verify.empty': 'Nothing waiting for review',
  'admin.verify.emptyDesc': 'New submissions appear here automatically.',

  // ── Admin drones list ──
  'admin.drones.title': 'All drones',
  'admin.drones.subtitle': 'Search across every drone, including public, private and archived states.',
  'admin.drones.searchPlaceholder': 'Slug, manufacturer, model, serial, owner email…',
  'admin.drones.col.drone': 'Drone',
  'admin.drones.col.owner': 'Owner',
  'admin.drones.col.status': 'Status',
  'admin.drones.col.override': 'Active override',
  'admin.drones.openInAdmin': 'Open',
  'admin.drones.adminEdit.title': 'Edit drone',
  'admin.drones.adminEdit.subtitle': 'Admin override: any field you change here is written directly to Firestore.',
  'admin.drones.clearOverride': 'Clear override',

  // ── Admin reports ──
  'admin.reports.title': 'Report-found inbox (all users)',
  'admin.reports.subtitle': 'Submissions sent by people who scanned a public drone profile.',
  'admin.reports.searchPlaceholder': 'Slug, finder name, email, message…',
  'admin.reports.col.received': 'Received',
  'admin.reports.col.drone': 'Drone',
  'admin.reports.col.finder': 'Finder',
  'admin.reports.col.message': 'Message',
  'admin.reports.col.location': 'Location',
  'admin.reports.col.read': 'Read',

  // ── Admin plans ──
  'admin.plans.title': 'Plans & pricing',
  'admin.plans.subtitle': 'Configure prices for each slot kind. Pricing is read by the marketing page and the user dashboard.',
  'admin.plans.col.label': 'Label',
  'admin.plans.col.kind': 'Slot kind',
  'admin.plans.col.price': 'Price',
  'admin.plans.col.currency': 'Currency',
  'admin.plans.col.active': 'Active',
  'admin.plans.new': 'New plan',
  'admin.plans.create.title': 'Create plan',
  'admin.plans.edit.title': 'Edit plan',
  'admin.plans.delete.title': 'Delete plan?',
  'admin.plans.field.label': 'Display label',
  'admin.plans.field.description': 'Description',
  'admin.plans.field.kind': 'Slot kind',
  'admin.plans.field.priceCents': 'Price (in minor units, e.g. cents)',
  'admin.plans.field.currency': 'Currency',
  'admin.plans.field.active': 'Active',
  'admin.plans.empty': 'No plans configured yet',
  'admin.plans.emptyDesc': 'Create a plan for each slot type your users can purchase.',

  // ── Account: plan & slots summary card ──
  'account.plan.title': 'Plan & slots',
  'account.plan.subtitle': 'Quota included in your account. Contact admin to increase limits.',
  'account.plan.empty': 'Your account uses the base plan.',
  'account.plan.contactAdmin': 'Contact admin',

  // ── PWA ──
  'pwa.appName': 'DroneTag',
  'pwa.appShortName': 'DroneTag',
  'pwa.appDescription': 'Digital identification and document management for drone operators.',
  'pwa.install.cta': 'Install app',
  'pwa.install.dismiss': 'Not now',
  'pwa.install.installed': 'DroneTag is installed',

  // ── Billing placeholder (PR-SEC-4 prep layer) ──
  'billing.title': 'Billing & subscription',
  'billing.subtitle': 'Manage your DroneTag plan and slot entitlements.',
  'billing.comingSoon': 'Coming soon',
  'billing.comingSoonBody': 'Self-service checkout is being prepared. Until then, contact your admin to upgrade slots and plans. Your current quotas are shown below.',
  'billing.subscribe': 'Subscribe',
  'billing.manageProfile': 'Back to profile',
  'account.tab.billing': 'Billing',

  // ── Empty-state hints (STAGING-OPS-1) ──
  'empty.hints.operator.1': 'Pick personal or company holder type.',
  'empty.hints.operator.2': 'Add contact details for legal reporting.',
  'empty.hints.operator.3': 'Mark one operator as default for new drones.',

  'empty.hints.drone.1': 'Add manufacturer, model and class marking.',
  'empty.hints.drone.2': 'Pick a default operator and link a pilot.',
  'empty.hints.drone.3': 'Set status to active + visibility public to share the QR.',

  'empty.hints.insurance.1': 'Upload the policy PDF — name, number and dates are read automatically.',
  'empty.hints.insurance.2': 'Review the data and save to see the active/expired badge.',

  'empty.hints.certificate.1': 'Upload the certificate PDF — type, issuer and dates are read automatically.',
  'empty.hints.certificate.2': 'Review the data and save to see the valid/expired badge.',

  'empty.hints.document.1': 'Upload any supporting PDF (manuals, declarations, …).',
  'empty.hints.document.2': 'Documents are private until you publish them.',

  'empty.hints.inbox.1': 'Reports appear here when a finder scans your QR.',
  'empty.hints.inbox.2': 'Reply directly to the finder by email when you receive one.',

  // ── PWA UX (STAGING-OPS-1) ──
  'pwa.install.success': 'DroneTag installed. Look for the home-screen icon.',
  'pwa.offline.banner': 'You\u2019re offline — changes will sync when you reconnect.',
  'pwa.online.toast': 'Back online.',
  'pwa.iosHint.title': 'Add DroneTag to your iPhone home screen',
  'pwa.iosHint.body': 'Tap the Share icon in Safari, then choose \u201CAdd to Home Screen\u201D for a one-tap launcher.',

  // ── Error boundary (STAGING-OPS-1) ──
  'error.boundary.title': 'Something went wrong on this screen.',
  'error.boundary.body': 'The DroneTag platform is still up — only this page failed to load. Try again or go back to your dashboard.',
  'error.boundary.publicBody': 'Try refreshing the page. If the QR keeps failing, the drone may have been temporarily unpublished by its owner.',
  'error.boundary.adminBody': 'Server-side log included below. Copy the digest before retrying so you can correlate against Firebase logs.',
  'error.boundary.retry': 'Try again',
  'error.boundary.goHome': 'Go to dashboard',
  'error.boundary.goPublic': 'Go to home page',
  'error.boundary.diagnostics': 'Diagnostics',
  'error.boundary.digest': 'Error digest',

  // ── NFC tooling (PR-SEC-4) ──
  'admin.nav.nfc': 'NFC tools',
  'admin.nfc.title': 'NFC / QR tooling',
  'admin.nfc.subtitle': 'Generate the URL payloads encoded onto each badge and export the full batch as CSV for an external NFC writer.',
  'admin.nfc.col.slug': 'Slug',
  'admin.nfc.col.url': 'Public URL',
  'admin.nfc.col.owner': 'Owner',
  'admin.nfc.exportCsv': 'Export CSV',
  'admin.nfc.copyUrl': 'Copy URL',
  'admin.nfc.empty': 'No public-active drones to encode.',

} as const satisfies Record<string, string>;

/** Union of every valid translation key, derived from the English file. */
export type TranslationKey = keyof typeof translations;

import type { TranslationMap } from './schema';

/**
 * German translations.
 * Structure mirrors en.ts — see that file for key documentation.
 */
export const translations: TranslationMap = {

  // ═══════════════════════════════════════════════════════════════════════════
  // LABELS — Field names, buttons, navigation, column headers, short UI text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Common UI ──
  'common.save': '\u00c4nderungen speichern',
  'common.cancel': 'Abbrechen',
  'common.delete': 'L\u00f6schen',
  'common.edit': 'Bearbeiten',
  'common.create': 'Erstellen',
  'common.search': 'Suchen',
  'common.back': 'Zur\u00fcck',
  'common.loading': 'Wird geladen\u2026',
  'common.error': 'Fehler',
  'common.success': 'Erfolg',
  'common.confirm': 'Best\u00e4tigen',
  'common.yes': 'Ja',
  'common.no': 'Nein',
  'common.upload': 'Hochladen',
  'common.download': 'Herunterladen',
  'common.preview': 'Vorschau',
  'common.publish': 'Ver\u00f6ffentlichen',
  'common.unpublish': 'Ver\u00f6ffentlichung aufheben',
  'common.published': '\u00d6ffentlich',
  'common.unpublished': 'Privat',
  'common.required': 'Pflichtfeld',
  'common.optional': 'Optional',
  'common.actions': 'Aktionen',
  'common.language': 'Sprache',
  'common.all': 'Alle',
  'common.filter': 'Filtern',
  'common.sortBy': 'Sortieren nach',
  'common.notAvailable': 'k.\u00a0A.',
  'common.select': 'Ausw\u00e4hlen\u2026',
  'common.clickOrDragToUpload': 'Zum Hochladen klicken oder Datei hierher ziehen',
  'common.remove': 'Entfernen',
  'common.viewDocument': 'Dokument anzeigen',
  'common.retry': 'Erneut versuchen',
  'common.tryAgain': 'Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
  'common.version': 'v1.0',

  // ── Navigation ──
  'nav.home': 'Start',
  'nav.dashboard': 'Dashboard',
  'nav.login': 'Anmelden',
  'nav.logout': 'Abmelden',
  'nav.newProfile': 'Neues Profil',
  'nav.adminBadge': 'ADMIN',

  // ── Login form ──
  'login.email': 'E-Mail-Adresse',
  'login.password': 'Passwort',
  'login.submit': 'Anmelden',

  // ── Field labels ──
  'field.language': 'Spracheinstellung',
  'field.firstName': 'Vorname',
  'field.lastName': 'Nachname',
  'field.operatorCode': 'Betreibercode',
  'field.email': 'E-Mail',
  'field.phone': 'Telefon',
  'field.emergencyContact': 'Notfallkontakt',
  'field.photo': 'Profilfoto',
  'field.visibility': 'Sichtbarkeit',
  'field.birthDate': 'Geburtsdatum',
  'field.nationality': 'Staatsangeh\u00f6rigkeit',
  'field.operatorLicense': 'Betreiberlizenz',
  'field.companyName': 'Firmenname',
  'field.companyDetails': 'Unternehmensangaben',
  'field.companyAddress': 'Firmenadresse',
  'field.companyVatOrRegistration': 'USt-IdNr. / Registrierungsnummer',
  'field.droneName': 'Drohnenname',
  'field.droneModel': 'Modell',
  'field.serialNumber': 'Serien-Nr.',
  'field.droneRegNumber': 'Registrierung',
  'field.logo': 'Logo',
  'field.banner': 'Bannerbild',
  'field.insuranceProvider': 'Versicherer',
  'field.policyNumber': 'Policennummer',
  'field.issuedAt': 'Ausstellungsdatum',
  'field.expiresAt': 'Ablaufdatum',
  'field.policyPdf': 'Policendokument (PDF)',
  'field.insuranceNotes': 'Policenhinweise',
  'field.qrImage': 'QR-Code-Bild',
  'field.slug': '\u00d6ffentlicher URL-Slug',
  'field.lastEditedBy': 'Zuletzt bearbeitet von',
  'field.publishedAt': 'Ver\u00f6ffentlicht am',
  'field.lastVerifiedAt': 'Zuletzt verifiziert am',
  'field.adminNotes': 'Interne Admin-Notizen',

  // ── Dashboard table columns ──
  'dashboard.name': 'Betreiber',
  'dashboard.organization': 'Organisation',
  'dashboard.operatorCode': 'Betreibercode',
  'dashboard.verification': 'Verifizierung',
  'dashboard.insuranceStatus': 'Versicherung',
  'dashboard.expiryDate': 'Ablaufdatum',
  'dashboard.updatedAt': 'Aktualisiert',
  'dashboard.completeness': 'Vollst\u00e4ndigkeit',
  'dashboard.policyExpiry': 'Policenablauf',
  'dashboard.draft': 'Entwurf',
  'dashboard.status': 'Status',
  'dashboard.incomplete': 'Unvollst\u00e4ndig',

  // ── Dashboard filters ──
  'dashboard.filterByStatus': 'Nach Status filtern',
  'dashboard.filterByPolicy': 'Nach Police filtern',
  'dashboard.filterByVerification': 'Verifizierung',
  'dashboard.filterByVisibility': 'Sichtbarkeit',
  'dashboard.sortName': 'Name',
  'dashboard.sortExpiry': 'Policenablauf',
  'dashboard.sortPriority': 'Dokumentendringlichkeit',
  'dashboard.sortUpdated': 'Zuletzt aktualisiert',

  // ── Document type labels ──
  'docType.insurancePolicy': 'Versicherungspolice',
  'docType.operatorLicense': 'Betreiberlizenz',
  'docType.droneRegistration': 'Drohnenregistrierung',
  'docType.trainingCertificate': 'Schulungszertifikat',
  'docType.other': 'Sonstiges Dokument',

  // ── Public page data labels ──
  'profile.operatorId': 'Betreiber-ID',
  'profile.registrationCode': 'Registrierung',
  'profile.provider': 'Versicherer',
  'profile.policyNumber': 'Policen-Nr.',
  'profile.coverage': 'Deckung',
  'profile.validFrom': 'G\u00fcltig ab',
  'profile.validUntil': 'G\u00fcltig bis',
  'profile.notes': 'Hinweise',
  'profile.viewPolicy': 'Originaldokument der Police anzeigen',
  'profile.downloadPolicy': 'Policendokument herunterladen',
  'profile.droneId': 'Drohnen-ID',
  'profile.droneModel': 'Modell',
  'profile.serialNumber': 'Serien-Nr.',
  'profile.droneRegNumber': 'Registrierung',
  'profile.category': 'Kategorie',
  'profile.contact': 'Kontakt',
  'profile.emergencyContact': 'Notfall',
  'profile.documents': 'Dokumente',
  'profile.verifiedOn': 'Verifiziert am',
  'profile.lastUpdated': 'Zuletzt aktualisiert',

  // ── Toggle / action labels ──
  'toggle.makePublic': 'Ver\u00f6ffentlichen',
  'toggle.makePrivate': 'Ver\u00f6ffentlichung aufheben',
  'form.generateSlug': 'URL generieren',
  'form.publicUrlPreview': '\u00d6ffentliche URL:',
  'form.profileId': 'Profil-ID:',

  // ── Verification links labels ──
  'field.nfcReference': 'NFC-Tag-Referenz',
  'field.publicUrl': '\u00d6ffentliche Profil-URL',
  'links.copyUrl': 'Kopieren',
  'links.copied': 'Kopiert',
  'links.nfcNotAssigned': 'Nicht zugewiesen',

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS — State indicators, badges, computed statuses
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Profile lifecycle ──
  'status.active': 'Aktiv',
  'status.draft': 'Entwurf',
  'status.archived': 'Archiviert',
  'status.suspended': 'Gesperrt',

  // ── Visibility ──
  'visibility.private': 'Privat',
  'visibility.public': '\u00d6ffentlich',

  // ── Verification ──
  'verification.unverified': 'Nicht verifiziert',
  'verification.pending': 'Pr\u00fcfung ausstehend',
  'verification.verified': 'Verifiziert',
  'verification.rejected': 'Abgelehnt',
  'verification.status': 'Verifizierungsstatus',
  'verification.lastVerified': 'Zuletzt verifiziert',
  'verification.verifiedBy': 'Verifiziert von',
  'verification.notes': 'Verifizierungshinweise',

  // ── Insurance policy ──
  'policy.valid': 'G\u00fcltig',
  'policy.expiring': 'L\u00e4uft bald ab',
  'policy.expired': 'Abgelaufen',
  'policy.missing': 'Fehlend',
  'policy.status': 'Policenstatus',

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES — Errors, alerts, hints, descriptions, dynamic text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Login & auth ──
  'login.error': 'Authentifizierung fehlgeschlagen. Bitte pr\u00fcfen Sie Ihre Anmeldedaten.',
  'login.restrictedNotice': 'Zugang nur f\u00fcr autorisierte Administratorinnen und Administratoren.',

  // ── Form validation & feedback ──
  'form.validation.required': 'Dieses Feld ist erforderlich',
  'form.validation.slugRequired': 'Vor der Ver\u00f6ffentlichung ist ein \u00f6ffentlicher URL-Slug erforderlich.',
  'form.validation.slugFormat': 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
  'form.saving': 'Wird gespeichert\u2026',
  'form.saved': 'Alle \u00c4nderungen wurden erfolgreich gespeichert.',
  'form.submitError': 'Speichern fehlgeschlagen. Bitte pr\u00fcfen Sie Ihre Verbindung.',

  // ── Form hints ──
  'form.photoHint': 'Quadratisches Bild empfohlen, mindestens 200\u00d7200 px.',
  'form.pdfHint': 'Laden Sie die Original-PDF der Versicherungspolice hoch.',
  'form.qrHint': 'QR-Code f\u00fcr dieses Profil hochladen oder generieren.',

  // ── Dashboard alerts ──
  'dashboard.alerts': 'Betriebshinweise',
  'dashboard.alertNoPdf': '{count} Profil(e) ohne Versicherungs-PDF',
  'dashboard.alertExpiring': '{count} Police(n) l\u00e4uft/laufen innerhalb von 30 Tagen ab',
  'dashboard.alertCompleteNotPublished': '{count} vollst\u00e4ndige(s) Profil(e) noch nicht ver\u00f6ffentlicht',
  'dashboard.alertPublishedNotVerified': '{count} ver\u00f6ffentlichte(s) Profil(e) nicht verifiziert',
  'dashboard.noAlerts': 'Keine Betriebshinweise. Alles in Ordnung.',

  // ── Dashboard messages ──
  'dashboard.confirmDelete': 'Dieses Betreiberprofil wird unwiderruflich und dauerhaft entfernt. Zugeh\u00f6rige Nachweise und Verkn\u00fcpfungen gehen verloren. M\u00f6chten Sie fortfahren?',
  'dashboard.deleteModalNote': '\u00d6ffentliche QR- und NFC-Links zu diesem Profil werden sofort ung\u00fcltig. Die Daten sind f\u00fcr Dritte nicht mehr abrufbar. Diese Aktion kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
  'dashboard.adjustFilters': 'Passen Sie Suche oder Filter an, um passende Profile einzublenden oder die Ergebnisliste zu verfeinern.',
  'dashboard.searchPlaceholder': 'Name, Unternehmen oder Betreibercode\u2026',
  'common.noResults': 'Keine passenden Profile',
  'common.filtersActive': '{count} Filter aktiv',
  'common.clearFilters': 'Alle Filter zur\u00fccksetzen',
  'common.noDocument': 'Kein Dokument hochgeladen',
  'common.noQr': 'Kein QR-Code hochgeladen',

  // ── Policy descriptions (dynamic) ──
  'policy.daysLeft': 'Noch {days} Tage',
  'policy.expiredDaysAgo': 'Vor {days} Tagen abgelaufen',
  'policy.desc.validUntil': 'G\u00fcltig bis {date}',
  'policy.desc.expiringOn': 'L\u00e4uft am {date} ab \u2014 noch {days} Tage',
  'policy.desc.expiredOn': 'Abgelaufen am {date} (vor {days} Tagen)',
  'policy.desc.noPolicyOnFile': 'Kein Policendokument vorhanden',

  // ── Public page messages ──
  'public.insuranceValid': 'Der Versicherungsschutz ist aktiv und g\u00fcltig.',
  'public.insuranceExpiring': 'Der Versicherungsschutz l\u00e4uft in {days} Tagen ab.',
  'public.insuranceExpired': 'Der Versicherungsschutz ist abgelaufen. Kontaktieren Sie den Betreiber oder die Organisation f\u00fcr aktuelle Unterlagen.',
  'public.insuranceMissing': 'Keine Versicherungsinformationen f\u00fcr diesen Betreiber hinterlegt.',
  'public.noInformation': 'Nicht angegeben',
  'public.policyNotAvailable': 'Originaldokument der Police nicht verf\u00fcgbar.',
  'public.policyNotAvailableHint': 'Die ausstellende Organisation hat das Policendokument f\u00fcr dieses Profil nicht hochgeladen.',
  'public.latestRecord': 'Diese Seite zeigt den letzten ver\u00f6ffentlichten Stand zum oben angegebenen Datum.',
  'public.scanToVerify': 'Scannen Sie diesen Code um das Betreiberprofil zu verifizieren',

  // ── Profile unavailable messages ──
  'profile.notFoundDesc': 'Das gesuchte Betreiberprofil existiert nicht oder wurde entfernt.',
  'profile.notPublishedDesc': 'Dieses Betreiberprofil ist derzeit nicht \u00f6ffentlich einsehbar. Es wird m\u00f6glicherweise \u00fcberpr\u00fcft oder wurde zur\u00fcckgezogen.',
  'profile.disclaimer': 'Diese Angaben dienen ausschlie\u00dflich der Verifizierung. Die Richtigkeit der Daten obliegt der ausstellenden Organisation.',
  'profile.expiringInDays': 'L\u00e4uft in {days} Tagen ab',

  // ── Verification links descriptions ──
  'links.publicUrlDesc': 'Dies ist die dauerhafte \u00f6ffentliche URL f\u00fcr dieses Betreiberprofil. Teilen Sie sie direkt oder kodieren Sie sie im QR-Code.',
  'links.publicUrlNotReady': 'Legen Sie einen Slug fest und ver\u00f6ffentlichen Sie das Profil, um eine \u00f6ffentliche URL zu erstellen.',
  'links.qrDesc': 'Laden Sie ein QR-Code-Bild hoch oder generieren Sie eines, das zur \u00f6ffentlichen Verifizierungsseite dieses Betreibers f\u00fchrt.',
  'links.nfcDesc': 'Ein physischer NFC-Tag kann mit diesem Profil verkn\u00fcpft werden, um per Ber\u00fchrung zu verifizieren. Die NFC-Programmierung ist noch nicht verf\u00fcgbar.',
  'links.nfcFuture': 'Die NFC-Integration wird in einer zuk\u00fcnftigen Version verf\u00fcgbar sein. Dieses Feld ist f\u00fcr die NFC-Tag-Kennung reserviert.',

  // ── Empty states ──
  'empty.noProfilesIcon': 'Keine Betreiber registriert',
  'empty.noResultsIcon': 'Keine passenden Ergebnisse',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS — Page titles, section headers, subtitles, content blocks
  // ═══════════════════════════════════════════════════════════════════════════

  // ── App identity ──
  'app.title': 'DroneTag',
  'app.description': 'Professionelle Verifizierung von Betreibernachweisen und zentrale Dokumentenf\u00fchrung f\u00fcr Drohnenbetrieb.',

  // ── Login page ──
  'login.title': 'Verwaltungszugriff',
  'login.subtitle': 'Melden Sie sich an, um Betreiberprofile, Nachweise und Verifizierung zu verwalten.',

  // ── Home page ──
  'home.hero': 'Verifizierung von Drohnenbetreibernachweisen',
  'home.subtitle': 'Zentrale Plattform zur Ausstellung, Pr\u00fcfung und Nachverfolgung operativer Nachweise im Drohneneinsatz.',
  'home.feature1Title': 'Betreibernachweise',
  'home.feature1Desc': 'Digitale Identifikation und Nachweise f\u00fcr zertifizierte UAS-Betreiber aus einer Hand.',
  'home.feature2Title': 'Echtzeit-Verifizierung',
  'home.feature2Desc': 'Sofortige Pr\u00fcfung g\u00fcltiger Profile per QR-Scan \u2014 ohne Medienbruch.',
  'home.feature3Title': 'Compliance-\u00dcberwachung',
  'home.feature3Desc': 'Automatisierte \u00dcberwachung von Versicherungs- und Dokumentenfristen f\u00fcr dauerhafte Konformit\u00e4t.',
  'home.cta': 'Administratoranmeldung',
  'home.footer': 'DroneTag \u00a9 {year}. Operatorenverifikation und Dokumentenverwaltung.',
  'home.learnMore': 'So funktioniert es',
  'home.systemDesc': 'DroneTag unterst\u00fctzt Organisationen bei der sicheren Hinterlegung und dem Nachweis operativer Qualifikationen und Policen.',

  // ── Dashboard ──
  'dashboard.title': 'Betreiberprofile',
  'dashboard.subtitle': 'Nachweise, Policen und Verifizierung zentral verwalten.',
  'dashboard.createNew': 'Betreiber registrieren',
  'dashboard.noProfiles': 'Keine Betreiberprofile registriert',
  'dashboard.noProfilesHint': 'Legen Sie zun\u00e4chst ein Betreiberprofil an, um Nachweise zu erfassen, zu ver\u00f6ffentlichen und zu verifizieren.',
  'dashboard.deleteModalTitle': 'Betreiberprofil dauerhaft l\u00f6schen?',

  // ── Dashboard KPI labels ──
  'dashboard.stats.total': 'Profile gesamt',
  'dashboard.stats.published': '\u00d6ffentlich',
  'dashboard.stats.verified': 'Verifiziert',
  'dashboard.stats.expiring': 'L\u00e4uft bald ab',
  'dashboard.stats.expired': 'Abgelaufen',
  'dashboard.stats.incomplete': 'Unvollst\u00e4ndig',

  // ── Admin pages ──
  'admin.createProfileTitle': 'Neuen Betreiber registrieren',
  'admin.editProfileTitle': 'Betreiberprofil bearbeiten',
  'admin.environment': 'Verwaltung',

  // ── Form section headers ──
  'form.person': 'Identit\u00e4t des Betreibers',
  'form.person.desc': 'Pers\u00f6nliche Identifikationsdaten des zertifizierten Drohnenbetreibers.',
  'form.organization': 'Organisation',
  'form.organization.desc': 'Unternehmenszugeh\u00f6rigkeit und Angaben zur ausstellenden Organisation.',
  'form.insurance': 'Versicherungsdeckung',
  'form.insurance.desc': 'Angaben zur Haftpflicht- bzw. Betriebshaftpflichtversicherung und Policendokumente.',
  'form.drone': 'Registrierte Drohne',
  'form.drone.desc': 'Kennzeichnung und Stammdaten des registrierten unbemannten Luftfahrtsystems (UAS).',
  'form.documents': 'Weitere Dokumente',
  'form.verification': 'Verifizierung & Pr\u00fcfpfad',
  'form.verification.desc': 'Aktueller Verifizierungsstatus und nachvollziehbare Pr\u00fcf- bzw. Audit-Historie.',
  'form.assets': 'Medien & Dokumente',
  'form.assets.desc': 'Fotos, Logos sowie Verifizierungscodes (z.\u00a0B. QR) f\u00fcr die \u00f6ffentliche Profilseite.',
  'form.statusAndAccess': 'Ver\u00f6ffentlichung & Zugriffskontrolle',
  'form.statusAndAccess.desc': 'Lebenszyklus des Profils, Sichtbarkeit und Freigabe f\u00fcr die \u00f6ffentliche Verifizierung.',
  'form.adminSection': 'Interne Hinweise',
  'form.adminSection.desc': 'Administrative Anmerkungen, die nicht auf der \u00f6ffentlichen Seite erscheinen.',

  // ── Verification links section ──
  'form.verificationLinks': 'Verifizierung & Zugangslinks',
  'form.verificationLinks.desc': '\u00d6ffentliche URL, QR-Code und NFC-Referenz zur externen Verifizierung dieses Betreiberprofils.',
  'links.publicUrlTitle': '\u00d6ffentliche Seiten-URL',
  'links.qrTitle': 'QR-Code',
  'links.nfcTitle': 'NFC-Tag',

  // ── Form card headers ──
  'form.publicDataTitle': 'Betreiberdaten',
  'form.publicDataSubtitle': 'Diese Angaben werden auf der \u00f6ffentlichen Profilseite angezeigt.',
  'form.mediaTitle': 'Medien & Verifizierungscodes',
  'form.mediaSubtitle': 'Visuelle Assets und Codes zur externen Verifizierung des Profils.',
  'form.adminTitle': 'Administration',
  'form.adminSubtitle': 'Interne Einstellungen und Notizen, nicht \u00f6ffentlich einsehbar.',

  // ── Public profile section headers ──
  'profile.organization': 'Organisation',
  'profile.orgDetails': 'Organisationsdetails',
  'profile.insurance': 'Versicherungsschutz',
  'profile.qrCode': 'QR-Verifizierung',
  'profile.droneInfo': 'Registrierte Drohne',
  'profile.notFound': 'Profil nicht gefunden',
  'profile.notPublished': 'Profil nicht verf\u00fcgbar',
  'public.operatorProfile': 'Betreiberprofil',
  'public.verifiedOperator': 'Verifizierter Betreiber',
  'public.identity': 'Betreiberidentit\u00e4t',
  'public.operatorCode': 'Betreibercode',
  'public.licenseNumber': 'Lizenznr.',
  'public.droneInformation': 'Drohneninformationen',
  'public.insuranceCoverage': 'Versicherungsschutz',
  'public.policyDetails': 'Policendetails',
  'public.policyDocument': 'Policendokument',
  'public.qrVerification': 'QR-Verifizierungscode',
  'public.verificationRecord': 'Verifizierungsprotokoll',
  'public.profileReference': 'Profilreferenz',
  'public.poweredBy': 'Powered by DroneTag',
};

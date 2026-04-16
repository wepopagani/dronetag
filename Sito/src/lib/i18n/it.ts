import type { TranslationMap } from './schema';

/**
 * Italian translations.
 * Structure mirrors en.ts — see that file for key documentation.
 */
export const translations: TranslationMap = {

  // ═══════════════════════════════════════════════════════════════════════════
  // LABELS — Field names, buttons, navigation, column headers, short UI text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Common UI ──
  'common.save': 'Salva modifiche',
  'common.cancel': 'Annulla',
  'common.delete': 'Elimina',
  'common.edit': 'Modifica',
  'common.create': 'Crea',
  'common.search': 'Cerca',
  'common.back': 'Indietro',
  'common.loading': 'Caricamento\u2026',
  'common.error': 'Errore',
  'common.success': 'Operazione riuscita',
  'common.confirm': 'Conferma',
  'common.yes': 'S\u00ec',
  'common.no': 'No',
  'common.upload': 'Carica',
  'common.download': 'Scarica',
  'common.preview': 'Anteprima',
  'common.publish': 'Pubblica',
  'common.unpublish': 'Annulla pubblicazione',
  'common.published': 'Pubblico',
  'common.unpublished': 'Privato',
  'common.required': 'Obbligatorio',
  'common.optional': 'Facoltativo',
  'common.actions': 'Azioni',
  'common.language': 'Lingua',
  'common.all': 'Tutti',
  'common.filter': 'Filtra',
  'common.sortBy': 'Ordina per',
  'common.notAvailable': 'N/D',
  'common.select': 'Seleziona\u2026',
  'common.clickOrDragToUpload': 'Clicca o trascina il file per caricarlo',
  'common.remove': 'Rimuovi',
  'common.viewDocument': 'Visualizza documento',
  'common.retry': 'Riprova',
  'common.tryAgain': 'Si è verificato un errore durante il caricamento. Riprova più tardi.',
  'common.version': 'v1.0',

  // ── Navigation ──
  'nav.home': 'Home',
  'nav.dashboard': 'Dashboard',
  'nav.login': 'Accedi',
  'nav.logout': 'Esci',
  'nav.newProfile': 'Nuovo profilo',
  'nav.adminBadge': 'ADMIN',
  'nav.shop': 'Negozio',
  'nav.account': 'Il mio account',
  'nav.signup': 'Crea account',

  // ── Login form ──
  'login.email': 'Indirizzo email',
  'login.password': 'Password',
  'login.submit': 'Accedi',
  'login.noAccount': 'Non hai un account?',
  'login.signupCta': 'Registrati',

  // ── Sign-up form ──
  'signup.title': 'Crea il tuo account',
  'signup.subtitle': 'Segui i tuoi ordini, monitora le spedizioni e accedi al tuo profilo.',
  'signup.submit': 'Crea account',
  'signup.passwordConfirm': 'Conferma password',
  'signup.haveAccount': 'Hai già un account?',
  'signup.errorPasswordShort': 'La password deve contenere almeno 6 caratteri.',
  'signup.errorPasswordMismatch': 'Le password non coincidono.',
  'signup.errorEmailInUse': 'Esiste già un account con questa email.',
  'signup.errorGeneric': 'Impossibile creare l’account. Riprova.',

  // ── Account area ──
  'account.eyebrow': 'Account',
  'account.title': 'Benvenuto, {name}',
  'account.subtitle': 'Consulta il tuo profilo e segui i tuoi ordini.',
  'account.tabProfile': 'Profilo',
  'account.tabOrders': 'Ordini',
  'account.personalInfo': 'Dati personali',
  'account.shippingAddress': 'Indirizzo di spedizione',
  'account.readOnly': 'Sola lettura',
  'account.noAddress': 'Nessun indirizzo salvato.',
  'account.editNotice': 'La modifica del profilo sarà presto disponibile. Per modificare i tuoi dati, contatta il nostro supporto.',
  'account.memberSince': 'Iscritto dal {date}',

  // ── Orders ──
  'orders.emptyTitle': 'Nessun ordine',
  'orders.emptyDesc': 'Quando effettuerai il primo ordine, lo troverai qui con tracciamento e tracciabilità completi.',
  'orders.emptyCta': 'Vai al negozio',
  'orders.orderNumber': 'Ordine n°',
  'orders.placedOn': 'Effettuato il {date}',
  'orders.viewDetails': 'Vedi dettagli',
  'orders.backToOrders': 'Torna agli ordini',
  'orders.progress': 'Avanzamento',
  'orders.shippingTitle': 'Spedizione',
  'orders.carrier': 'Corriere',
  'orders.openTracking': 'Apri tracking',
  'orders.shipTo': 'Spedito a',
  'orders.eta': 'Consegna stimata · {date}',
  'orders.deliveredOn': 'Consegnato il {date}',
  'orders.items': 'Prodotti nell’ordine',
  'orders.professionalTrace': 'Tracciabilità professionale',
  'orders.showTrace': 'Mostra tracciabilità',
  'orders.hideTrace': 'Nascondi tracciabilità',
  'orders.subtotal': 'Subtotale',
  'orders.shippingFee': 'Spedizione',
  'orders.total': 'Totale',
  'orders.timeline': 'Cronologia completa',
  'orders.notFound': 'Ordine non trovato o non accessibile.',

  // ── Order status labels ──
  'orderStatus.pending': 'In attesa',
  'orderStatus.paid': 'Pagato',
  'orderStatus.in_production': 'In produzione',
  'orderStatus.assembled': 'Assemblato',
  'orderStatus.quality_check': 'Controllo qualità',
  'orderStatus.packed': 'Imballato',
  'orderStatus.shipped': 'Spedito',
  'orderStatus.in_transit': 'In transito',
  'orderStatus.delivered': 'Consegnato',
  'orderStatus.cancelled': 'Annullato',

  // ── Traceability detail fields ──
  'trace.batch': 'Lotto',
  'trace.material': 'Materiale / filamento',
  'trace.printedAt': 'Stampato il',
  'trace.printer': 'Stampante',
  'trace.assembledAt': 'Assemblato il',
  'trace.assembledBy': 'Assemblato da',
  'trace.qcAt': 'QC superato il',
  'trace.qcBy': 'Ispettore QC',
  'trace.notes': 'Note',

  // ── Field labels ──
  'field.language': 'Preferenza lingua',
  'field.firstName': 'Nome',
  'field.lastName': 'Cognome',
  'field.operatorCode': 'Codice operatore',
  'field.email': 'Email',
  'field.phone': 'Telefono',
  'field.emergencyContact': 'Contatto di emergenza',
  'field.photo': 'Foto profilo',
  'field.visibility': 'Visibilit\u00e0',
  'field.birthDate': 'Data di nascita',
  'field.nationality': 'Nazionalit\u00e0',
  'field.operatorLicense': 'Patente operatore',
  'field.companyName': 'Ragione sociale',
  'field.companyDetails': 'Dati aziendali',
  'field.companyAddress': 'Sede aziendale',
  'field.companyVatOrRegistration': 'Partita IVA / Numero di registrazione',
  'field.droneName': 'Nome drone',
  'field.droneModel': 'Modello',
  'field.serialNumber': 'N. serie',
  'field.droneRegNumber': 'Registrazione',
  'field.logo': 'Logo',
  'field.banner': 'Immagine banner',
  'field.insuranceProvider': 'Compagnia assicurativa',
  'field.policyNumber': 'Numero polizza',
  'field.issuedAt': 'Data emissione',
  'field.expiresAt': 'Data di scadenza',
  'field.policyPdf': 'Documento polizza (PDF)',
  'field.insuranceNotes': 'Note sulla polizza',
  'field.qrImage': 'Immagine codice QR',
  'field.slug': 'Slug URL pubblico',
  'field.lastEditedBy': 'Ultima modifica di',
  'field.publishedAt': 'Pubblicato il',
  'field.lastVerifiedAt': 'Ultima verifica il',
  'field.adminNotes': 'Note interne amministratore',

  // ── Dashboard table columns ──
  'dashboard.name': 'Operatore',
  'dashboard.organization': 'Organizzazione',
  'dashboard.operatorCode': 'Codice operatore',
  'dashboard.verification': 'Verifica',
  'dashboard.insuranceStatus': 'Assicurazione',
  'dashboard.expiryDate': 'Scadenza',
  'dashboard.updatedAt': 'Aggiornato',
  'dashboard.completeness': 'Completezza',
  'dashboard.policyExpiry': 'Scadenza polizza',
  'dashboard.draft': 'Bozza',
  'dashboard.status': 'Stato',
  'dashboard.incomplete': 'Incompleto',

  // ── Dashboard filters ──
  'dashboard.filterByStatus': 'Filtra per stato',
  'dashboard.filterByPolicy': 'Filtra per polizza',
  'dashboard.filterByVerification': 'Verifica',
  'dashboard.filterByVisibility': 'Visibilit\u00e0',
  'dashboard.sortName': 'Nome',
  'dashboard.sortExpiry': 'Scadenza polizza',
  'dashboard.sortPriority': 'Urgenza documentale',
  'dashboard.sortUpdated': 'Ultimo aggiornamento',

  // ── Document type labels ──
  'docType.insurancePolicy': 'Polizza assicurativa',
  'docType.operatorLicense': 'Patente operatore',
  'docType.droneRegistration': 'Registrazione drone',
  'docType.trainingCertificate': 'Certificato di formazione',
  'docType.other': 'Altro documento',

  // ── Public page data labels ──
  'profile.operatorId': 'ID operatore',
  'profile.registrationCode': 'Registrazione',
  'profile.provider': 'Compagnia',
  'profile.policyNumber': 'N. polizza',
  'profile.coverage': 'Copertura',
  'profile.validFrom': 'Valida dal',
  'profile.validUntil': 'Valida fino al',
  'profile.notes': 'Note',
  'profile.viewPolicy': 'Visualizza il documento di polizza originale',
  'profile.downloadPolicy': 'Scarica documento polizza',
  'profile.droneId': 'ID drone',
  'profile.droneModel': 'Modello',
  'profile.serialNumber': 'N. serie',
  'profile.droneRegNumber': 'Registrazione',
  'profile.category': 'Categoria',
  'profile.contact': 'Contatti',
  'profile.emergencyContact': 'Emergenza',
  'profile.documents': 'Documenti',
  'profile.verifiedOn': 'Verificato il',
  'profile.lastUpdated': 'Ultimo aggiornamento',

  // ── Toggle / action labels ──
  'toggle.makePublic': 'Pubblica',
  'toggle.makePrivate': 'Nascondi',
  'form.generateSlug': 'Genera URL',
  'form.publicUrlPreview': 'URL pubblico:',
  'form.profileId': 'ID Profilo:',

  // ── Verification links labels ──
  'field.nfcReference': 'Riferimento tag NFC',
  'field.publicUrl': 'URL pagina pubblica',
  'links.copyUrl': 'Copia',
  'links.copied': 'Copiato',
  'links.nfcNotAssigned': 'Non assegnato',

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS — State indicators, badges, computed statuses
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Profile lifecycle ──
  'status.active': 'Attivo',
  'status.draft': 'Bozza',
  'status.archived': 'Archiviato',
  'status.suspended': 'Sospeso',

  // ── Visibility ──
  'visibility.private': 'Privato',
  'visibility.public': 'Pubblico',

  // ── Verification ──
  'verification.unverified': 'Non verificato',
  'verification.pending': 'In attesa di revisione',
  'verification.verified': 'Verificato',
  'verification.rejected': 'Rifiutato',
  'verification.status': 'Stato di verifica',
  'verification.lastVerified': 'Ultima verifica',
  'verification.verifiedBy': 'Verificato da',
  'verification.notes': 'Note di verifica',

  // ── Insurance policy ──
  'policy.valid': 'Valida',
  'policy.expiring': 'In scadenza',
  'policy.expired': 'Scaduta',
  'policy.missing': 'Mancante',
  'policy.status': 'Stato della polizza',

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES — Errors, alerts, hints, descriptions, dynamic text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Login & auth ──
  'login.error': 'Autenticazione fallita. Controlla le credenziali e riprova.',
  'login.restrictedNotice': 'Accesso riservato agli amministratori autorizzati.',

  // ── Form validation & feedback ──
  'form.validation.required': 'Questo campo \u00e8 obbligatorio',
  'form.validation.slugRequired': '\u00c8 necessario un URL slug pubblico prima della pubblicazione',
  'form.validation.slugFormat': 'Lo slug deve contenere solo lettere minuscole, numeri e trattini',
  'form.saving': 'Salvataggio\u2026',
  'form.saved': 'Tutte le modifiche salvate con successo.',
  'form.submitError': 'Salvataggio fallito. Controlla la connessione e riprova.',

  // ── Form hints ──
  'form.photoHint': 'Immagine quadrata raccomandata, minimo 200\u00d7200 px.',
  'form.pdfHint': 'Carica il documento originale della polizza assicurativa in formato PDF.',
  'form.qrHint': 'Carica o genera un codice QR per questo profilo operatore.',

  // ── Dashboard alerts ──
  'dashboard.alerts': 'Avvisi operativi',
  'dashboard.alertNoPdf': '{count} profilo/i senza PDF polizza',
  'dashboard.alertExpiring': '{count} polizza/e in scadenza entro 30 giorni',
  'dashboard.alertCompleteNotPublished': '{count} profilo/i completo/i non ancora pubblicato/i',
  'dashboard.alertPublishedNotVerified': '{count} profilo/i pubblicato/i non verificato/i',
  'dashboard.noAlerts': 'Nessun avviso operativo. Tutto in ordine.',

  // ── Dashboard messages ──
  'dashboard.confirmDelete': 'Questa operazione eliminer\u00e0 definitivamente il profilo operatore, inclusi tutti i documenti associati e i link di verifica pubblici. Non \u00e8 possibile annullarla.',
  'dashboard.deleteModalNote': 'Tutti i link di verifica QR e NFC per questo operatore cesseranno immediatamente di funzionare. I documenti e i metadati associati saranno rimossi permanentemente.',
  'dashboard.adjustFilters': 'Nessun profilo corrisponde ai filtri attuali. Modifica i criteri o rimuovi i filtri.',
  'dashboard.searchPlaceholder': 'Nome, azienda o codice operatore\u2026',
  'common.noResults': 'Nessun profilo corrispondente',
  'common.filtersActive': '{count} filtro/i attivo/i',
  'common.clearFilters': 'Rimuovi tutti i filtri',
  'common.noDocument': 'Nessun documento caricato',
  'common.noQr': 'Nessun codice QR caricato',

  // ── Policy descriptions (dynamic) ──
  'policy.daysLeft': '{days} giorni rimanenti',
  'policy.expiredDaysAgo': 'Scaduta da {days} giorni',
  'policy.desc.validUntil': 'Valida fino al {date}',
  'policy.desc.expiringOn': 'Scade il {date} \u2014 {days} giorni rimanenti',
  'policy.desc.expiredOn': 'Scaduta il {date} ({days} giorni fa)',
  'policy.desc.noPolicyOnFile': 'Nessun documento di polizza presente',

  // ── Public page messages ──
  'public.insuranceValid': 'La copertura assicurativa \u00e8 attiva e valida.',
  'public.insuranceExpiring': 'La copertura assicurativa scade tra {days} giorni.',
  'public.insuranceExpired': "La copertura assicurativa \u00e8 scaduta. Contattare l'operatore o l'organizzazione per documentazione aggiornata.",
  'public.insuranceMissing': 'Nessuna informazione assicurativa registrata per questo operatore.',
  'public.noInformation': 'Non fornito',
  'public.policyNotAvailable': 'Documento di polizza originale non disponibile.',
  'public.policyNotAvailableHint': "L'organizzazione emittente non ha caricato il documento di polizza per questo profilo.",
  'public.latestRecord': "Questa pagina riflette l'ultimo record pubblicato alla data indicata sopra.",
  'public.scanToVerify': 'Scansiona questo codice per verificare il profilo operatore',

  // ── Profile unavailable messages ──
  'profile.notFoundDesc': 'Il profilo operatore che stai cercando non esiste o \u00e8 stato rimosso.',
  'profile.notPublishedDesc': 'Questo profilo operatore non \u00e8 attualmente disponibile per la consultazione pubblica. Potrebbe essere in fase di revisione o essere stato ritirato.',
  'profile.disclaimer': "Le informazioni sono fornite esclusivamente a fini di verifica. L'accuratezza dei dati \u00e8 responsabilit\u00e0 dell'organizzazione emittente.",
  'profile.expiringInDays': 'Scade tra {days} giorni',

  // ── Verification links descriptions ──
  'links.publicUrlDesc': "Questo \u00e8 l'URL pubblico permanente per questo profilo operatore. Condividilo direttamente o codificalo nel QR code.",
  'links.publicUrlNotReady': 'Imposta uno slug e pubblica il profilo per generare un URL pubblico.',
  'links.qrDesc': "Carica o genera un'immagine QR code che punta alla pagina di verifica pubblica di questo operatore.",
  'links.nfcDesc': "Un tag NFC fisico pu\u00f2 essere collegato a questo profilo per l'accesso tramite tap. La programmazione NFC non \u00e8 ancora disponibile.",
  'links.nfcFuture': "L'integrazione NFC sar\u00e0 disponibile in una futura versione. Questo campo \u00e8 riservato all'identificativo del tag NFC.",

  // ── Empty states ──
  'empty.noProfilesIcon': 'Nessun operatore registrato',
  'empty.noResultsIcon': 'Nessun risultato corrispondente',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS — Page titles, section headers, subtitles, content blocks
  // ═══════════════════════════════════════════════════════════════════════════

  // ── App identity ──
  'app.title': 'DroneTag',
  'app.description': 'Verifica credenziali operatore e gestione documentale assicurativa per il settore droni',

  // ── Login page ──
  'login.title': 'Accesso Amministrazione',
  'login.subtitle': 'Accedi per gestire profili operatore, documenti e registri di verifica.',

  // ── Home page ──
  'home.hero': 'Verifica Credenziali Operatore Droni',
  'home.subtitle': 'Una piattaforma centralizzata per emettere, gestire e verificare le credenziali professionali degli operatori, i documenti assicurativi e i registri di conformit\u00e0.',
  'home.feature1Title': 'Credenziali Operatore',
  'home.feature1Desc': 'Emetti profili identificativi digitali per operatori UAS, collegati a documentazione assicurativa e dati di registrazione.',
  'home.feature2Title': 'Verifica in Tempo Reale',
  'home.feature2Desc': 'Terze parti possono verificare istantaneamente credenziali operatore e validit\u00e0 assicurativa tramite profili collegati a QR.',
  'home.feature3Title': 'Monitoraggio Conformit\u00e0',
  'home.feature3Desc': 'Tracciamento automatico delle scadenze polizze, completezza documenti e stato di verifica per tutti gli operatori.',
  'home.cta': 'Accesso Amministratore',
  'home.footer': 'DroneTag \u00a9 {year}. Verifica operatori e gestione documentale.',
  'home.learnMore': 'Come funziona',
  'home.systemDesc': "DroneTag fornisce un livello professionale di gestione documentale per operazioni con droni, collegando operatori, organizzazioni e verificatori attraverso un\u2019unica fonte di verit\u00e0.",

  // ── Dashboard ──
  'dashboard.title': 'Profili operatore',
  'dashboard.subtitle': 'Gestisci credenziali, polizze assicurative e stato di verifica per tutti gli operatori registrati.',
  'dashboard.createNew': 'Registra operatore',
  'dashboard.noProfiles': 'Nessun profilo operatore registrato',
  'dashboard.noProfilesHint': 'Registra il primo operatore per iniziare a gestire credenziali, monitoraggio assicurativo e verifica pubblica.',
  'dashboard.deleteModalTitle': 'Eliminare definitivamente il profilo operatore?',

  // ── Dashboard KPI labels ──
  'dashboard.stats.total': 'Profili totali',
  'dashboard.stats.published': 'Pubblici',
  'dashboard.stats.verified': 'Verificati',
  'dashboard.stats.expiring': 'In scadenza',
  'dashboard.stats.expired': 'Scadute',
  'dashboard.stats.incomplete': 'Incompleti',

  // ── Admin pages ──
  'admin.createProfileTitle': 'Registra Nuovo Operatore',
  'admin.editProfileTitle': 'Modifica profilo operatore',
  'admin.environment': 'Amministrazione',

  // ── Form section headers ──
  'form.person': 'Identit\u00e0 Operatore',
  'form.person.desc': "Dati identificativi e di contatto dell'operatore.",
  'form.organization': 'Organizzazione',
  'form.organization.desc': "Azienda o organizzazione di appartenenza dell'operatore.",
  'form.insurance': 'Copertura Assicurativa',
  'form.insurance.desc': "Dettagli dell'assicurazione di responsabilit\u00e0 civile e documentazione della polizza.",
  'form.drone': 'Drone Registrato',
  'form.drone.desc': 'Identificazione e dati di registrazione del sistema aeromobile a pilotaggio remoto (UAS).',
  'form.documents': 'Documenti aggiuntivi',
  'form.verification': 'Verifica e Audit',
  'form.verification.desc': 'Stato di verifica e traccia di audit.',
  'form.assets': 'Media e Documenti',
  'form.assets.desc': 'Foto profilo, logo organizzazione e codici di verifica.',
  'form.statusAndAccess': 'Pubblicazione e Controllo Accesso',
  'form.statusAndAccess.desc': "Controlla il ciclo di vita del profilo, la visibilit\u00e0 e l'URL pubblico.",
  'form.adminSection': 'Note Interne',
  'form.adminSection.desc': 'Annotazioni amministrative. Non visibili sul profilo pubblico.',

  // ── Verification links section ──
  'form.verificationLinks': 'Verifica e Link di Accesso',
  'form.verificationLinks.desc': 'URL pubblico, QR code e riferimento NFC per la verifica esterna di questo profilo operatore.',
  'links.publicUrlTitle': 'URL Pagina Pubblica',
  'links.qrTitle': 'Codice QR',
  'links.nfcTitle': 'Tag NFC',

  // ── Form card headers ──
  'form.publicDataTitle': 'Dati Operatore',
  'form.publicDataSubtitle': 'Questi dati possono essere visibili nella pagina di verifica pubblica quando pubblicati.',
  'form.mediaTitle': 'Media e Codici di Verifica',
  'form.mediaSubtitle': 'Risorse visive utilizzate nel profilo pubblico e nella pagina di verifica.',
  'form.adminTitle': 'Amministrazione',
  'form.adminSubtitle': 'Impostazioni interne e metadati. Non esposti nella pagina pubblica.',

  // ── Public profile section headers ──
  'profile.organization': 'Organizzazione',
  'profile.orgDetails': 'Dettagli organizzazione',
  'profile.insurance': 'Copertura assicurativa',
  'profile.qrCode': 'Verifica QR',
  'profile.droneInfo': 'Drone registrato',
  'profile.notFound': 'Profilo non trovato',
  'profile.notPublished': 'Profilo non disponibile',
  'public.operatorProfile': 'Profilo Operatore',
  'public.verifiedOperator': 'Operatore Verificato',
  'public.identity': 'Identit\u00e0 Operatore',
  'public.operatorCode': 'Codice Operatore',
  'public.licenseNumber': 'N. Licenza',
  'public.droneInformation': 'Informazioni Drone',
  'public.insuranceCoverage': 'Copertura Assicurativa',
  'public.policyDetails': 'Dettagli Polizza',
  'public.policyDocument': 'Documento di Polizza',
  'public.qrVerification': 'Codice QR di Verifica',
  'public.verificationRecord': 'Registro di Verifica',
  'public.profileReference': 'Riferimento Profilo',
  'public.poweredBy': 'Powered by DroneTag',
};

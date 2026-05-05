import type { TranslationMap } from './schema';

/**
 * French translations.
 * Structure mirrors en.ts — see that file for key documentation.
 */
export const translations: TranslationMap = {

  // ═══════════════════════════════════════════════════════════════════════════
  // LABELS — Field names, buttons, navigation, column headers, short UI text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Common UI ──
  'common.save': 'Enregistrer les modifications',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.create': 'Cr\u00e9er',
  'common.search': 'Rechercher',
  'common.back': 'Retour',
  'common.loading': 'Chargement\u2026',
  'common.error': 'Erreur',
  'common.success': 'Succ\u00e8s',
  'common.confirm': 'Confirmer',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.upload': 'T\u00e9l\u00e9verser',
  'common.download': 'T\u00e9l\u00e9charger',
  'common.preview': 'Aper\u00e7u',
  'common.publish': 'Publier',
  'common.unpublish': 'D\u00e9publier',
  'common.published': 'Public',
  'common.unpublished': 'Priv\u00e9',
  'common.required': 'Obligatoire',
  'common.optional': 'Facultatif',
  'common.actions': 'Actions',
  'common.language': 'Langue',
  'common.all': 'Tous',
  'common.filter': 'Filtrer',
  'common.sortBy': 'Trier par',
  'common.notAvailable': 'N/D',
  'common.select': 'S\u00e9lectionner\u2026',
  'common.clickOrDragToUpload': 'Cliquez ou faites glisser le fichier pour le t\u00e9l\u00e9verser',
  'common.remove': 'Retirer',
  'common.viewDocument': 'Voir le document',
  'common.retry': 'Réessayer',
  'common.tryAgain': 'Une erreur est survenue lors du chargement de cette page. Veuillez réessayer plus tard.',
  'common.version': 'v1.0',

  // ── Navigation ──
  'nav.home': 'Accueil',
  'nav.dashboard': 'Tableau de bord',
  'nav.login': 'Connexion',
  'nav.logout': 'D\u00e9connexion',
  'nav.newProfile': 'Nouveau profil',
  'nav.adminBadge': 'ADMIN',
  'nav.shop': 'Boutique',
  'nav.account': 'Mon compte',
  'nav.signup': 'Créer un compte',

  // ── Login form ──
  'login.email': 'Adresse e-mail',
  'login.password': 'Mot de passe',
  'login.submit': 'Se connecter',
  'login.noAccount': 'Pas encore de compte ?',
  'login.signupCta': 'Créer un compte',

  // ── Sign-up form ──
  'signup.title': 'Créez votre compte',
  'signup.subtitle': 'Suivez vos commandes, vos livraisons et consultez votre profil.',
  'signup.submit': 'Créer le compte',
  'signup.passwordConfirm': 'Confirmer le mot de passe',
  'signup.haveAccount': 'Vous avez déjà un compte ?',
  'signup.errorPasswordShort': 'Le mot de passe doit contenir au moins 6 caractères.',
  'signup.errorPasswordMismatch': 'Les mots de passe ne correspondent pas.',
  'signup.errorEmailInUse': 'Un compte existe déjà avec cet e-mail.',
  'signup.errorGeneric': 'Impossible de créer le compte. Veuillez réessayer.',

  // ── Account area ──
  'account.eyebrow': 'Compte',
  'account.title': 'Bienvenue, {name}',
  'account.subtitle': 'Consultez votre profil et suivez vos commandes.',
  'account.tabProfile': 'Profil',
  'account.tabOrders': 'Commandes',
  'account.personalInfo': 'Informations personnelles',
  'account.shippingAddress': 'Adresse de livraison',
  'account.readOnly': 'Lecture seule',
  'account.noAddress': 'Aucune adresse enregistrée.',
  'account.editNotice': 'La modification du profil sera bientôt disponible. Pour toute modification, contactez notre support.',
  'account.memberSince': 'Membre depuis le {date}',

  // ── Orders ──
  'orders.emptyTitle': 'Aucune commande',
  'orders.emptyDesc': 'Dès votre première commande, vous la trouverez ici avec son suivi et sa traçabilité complète.',
  'orders.emptyCta': 'Aller à la boutique',
  'orders.orderNumber': 'Commande n°',
  'orders.placedOn': 'Passée le {date}',
  'orders.viewDetails': 'Voir le détail',
  'orders.backToOrders': 'Retour aux commandes',
  'orders.progress': 'Avancement',
  'orders.shippingTitle': 'Expédition',
  'orders.carrier': 'Transporteur',
  'orders.openTracking': 'Ouvrir le suivi',
  'orders.shipTo': 'Livré à',
  'orders.eta': 'Livraison estimée · {date}',
  'orders.deliveredOn': 'Livré le {date}',
  'orders.items': 'Articles de la commande',
  'orders.professionalTrace': 'Traçabilité professionnelle',
  'orders.showTrace': 'Afficher la traçabilité',
  'orders.hideTrace': 'Masquer la traçabilité',
  'orders.subtotal': 'Sous-total',
  'orders.shippingFee': 'Livraison',
  'orders.total': 'Total',
  'orders.timeline': 'Chronologie complète',
  'orders.notFound': 'Commande introuvable ou inaccessible.',

  // ── Order status labels ──
  'orderStatus.pending': 'En attente',
  'orderStatus.paid': 'Payée',
  'orderStatus.in_production': 'En production',
  'orderStatus.assembled': 'Assemblée',
  'orderStatus.quality_check': 'Contrôle qualité',
  'orderStatus.packed': 'Emballée',
  'orderStatus.shipped': 'Expédiée',
  'orderStatus.in_transit': 'En transit',
  'orderStatus.delivered': 'Livrée',
  'orderStatus.cancelled': 'Annulée',

  // ── Traceability detail fields ──
  'trace.batch': 'Lot',
  'trace.material': 'Matériau / filament',
  'trace.printedAt': 'Imprimé le',
  'trace.printer': 'Imprimante',
  'trace.assembledAt': 'Assemblé le',
  'trace.assembledBy': 'Assemblé par',
  'trace.qcAt': 'CQ validé le',
  'trace.qcBy': 'Inspecteur CQ',
  'trace.notes': 'Notes',

  // ── Field labels ──
  'field.language': 'Langue pr\u00e9f\u00e9r\u00e9e',
  'field.firstName': 'Pr\u00e9nom',
  'field.lastName': 'Nom',
  'field.operatorCode': 'Code op\u00e9rateur',
  'field.email': 'E-mail',
  'field.phone': 'T\u00e9l\u00e9phone',
  'field.emergencyContact': 'Contact d\u2019urgence',
  'field.photo': 'Photo de profil',
  'field.visibility': 'Visibilit\u00e9',
  'field.birthDate': 'Date de naissance',
  'field.nationality': 'Nationalit\u00e9',
  'field.operatorLicense': 'Licence d\u2019op\u00e9rateur',
  'field.companyName': 'Raison sociale',
  'field.companyDetails': 'Coordonn\u00e9es de l\u2019entreprise',
  'field.companyAddress': 'Adresse de l\u2019entreprise',
  'field.companyVatOrRegistration': 'TVA / Num\u00e9ro d\u2019enregistrement',
  'field.droneName': 'Nom du drone',
  'field.droneModel': 'Mod\u00e8le',
  'field.serialNumber': 'N\u00ba de s\u00e9rie',
  'field.droneRegNumber': 'Immatriculation',
  'field.logo': 'Logo',
  'field.banner': 'Image de banni\u00e8re',
  'field.insuranceProvider': 'Assureur',
  'field.policyNumber': 'Num\u00e9ro de police',
  'field.issuedAt': 'Date d\u2019\u00e9mission',
  'field.expiresAt': 'Date d\u2019expiration',
  'field.policyPdf': 'Document de police (PDF)',
  'field.insuranceNotes': 'Notes sur la police',
  'field.qrImage': 'Image du code QR',
  'field.slug': 'Slug d\u2019URL publique',
  'field.lastEditedBy': 'Derni\u00e8re modification par',
  'field.publishedAt': 'Publi\u00e9 le',
  'field.lastVerifiedAt': 'Derni\u00e8re v\u00e9rification le',
  'field.adminNotes': 'Notes internes administrateur',

  // ── Dashboard table columns ──
  'dashboard.name': 'Op\u00e9rateur',
  'dashboard.organization': 'Organisation',
  'dashboard.operatorCode': 'Code op\u00e9rateur',
  'dashboard.verification': 'V\u00e9rification',
  'dashboard.insuranceStatus': 'Assurance',
  'dashboard.expiryDate': 'Date d\u2019expiration',
  'dashboard.updatedAt': 'Mis \u00e0 jour',
  'dashboard.completeness': 'Compl\u00e9tude',
  'dashboard.policyExpiry': 'Expiration de la police',
  'dashboard.draft': 'Brouillon',
  'dashboard.status': 'Statut',
  'dashboard.incomplete': 'Incomplet',

  // ── Dashboard filters ──
  'dashboard.filterByStatus': 'Filtrer par statut',
  'dashboard.filterByPolicy': 'Filtrer par police',
  'dashboard.filterByVerification': 'V\u00e9rification',
  'dashboard.filterByVisibility': 'Visibilit\u00e9',
  'dashboard.sortName': 'Nom',
  'dashboard.sortExpiry': 'Expiration de la police',
  'dashboard.sortPriority': 'Urgence documentaire',
  'dashboard.sortUpdated': 'Derni\u00e8re mise \u00e0 jour',

  // ── Document type labels ──
  'docType.insurancePolicy': 'Police d\u2019assurance',
  'docType.operatorLicense': 'Licence d\u2019op\u00e9rateur',
  'docType.droneRegistration': 'Immatriculation du drone',
  'docType.trainingCertificate': 'Certificat de formation',
  'docType.other': 'Autre document',

  // ── Public page data labels ──
  'profile.operatorId': 'ID op\u00e9rateur',
  'profile.registrationCode': 'Enregistrement',
  'profile.provider': 'Assureur',
  'profile.policyNumber': 'N\u00ba de police',
  'profile.coverage': 'Couverture',
  'profile.validFrom': 'Valide du',
  'profile.validUntil': 'Valide jusqu\u2019au',
  'profile.notes': 'Notes',
  'profile.viewPolicy': 'Voir le document de police original',
  'profile.downloadPolicy': 'T\u00e9l\u00e9charger le document de police',
  'profile.droneId': 'ID drone',
  'profile.droneModel': 'Mod\u00e8le',
  'profile.serialNumber': 'N\u00ba de s\u00e9rie',
  'profile.droneRegNumber': 'Immatriculation',
  'profile.category': 'Cat\u00e9gorie',
  'profile.contact': 'Contact',
  'profile.emergencyContact': 'Urgence',
  'profile.documents': 'Documents',
  'profile.verifiedOn': 'V\u00e9rifi\u00e9 le',
  'profile.lastUpdated': 'Derni\u00e8re mise \u00e0 jour',

  // ── Toggle / action labels ──
  'toggle.makePublic': 'Publier',
  'toggle.makePrivate': 'D\u00e9publier',
  'form.generateSlug': 'G\u00e9n\u00e9rer l\u2019URL',
  'form.publicUrlPreview': 'URL publique\u00a0:',
  'form.profileId': 'ID du profil\u00a0:',

  // ── Verification links labels ──
  'field.nfcReference': 'R\u00e9f\u00e9rence tag NFC',
  'field.publicUrl': 'URL de la page publique',
  'links.copyUrl': 'Copier',
  'links.copied': 'Copi\u00e9',
  'links.nfcNotAssigned': 'Non attribu\u00e9',

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS — State indicators, badges, computed statuses
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Profile lifecycle ──
  'status.active': 'Actif',
  'status.draft': 'Brouillon',
  'status.archived': 'Archiv\u00e9',
  'status.suspended': 'Suspendu',

  // ── Visibility ──
  'visibility.private': 'Priv\u00e9',
  'visibility.public': 'Public',

  // ── Verification ──
  'verification.unverified': 'Non v\u00e9rifi\u00e9',
  'verification.pending': 'En attente de validation',
  'verification.verified': 'V\u00e9rifi\u00e9',
  'verification.rejected': 'Refus\u00e9',
  'verification.status': 'Statut de v\u00e9rification',
  'verification.lastVerified': 'Derni\u00e8re v\u00e9rification',
  'verification.verifiedBy': 'V\u00e9rifi\u00e9 par',
  'verification.notes': 'Notes de v\u00e9rification',

  // ── Insurance policy ──
  'policy.valid': 'Valide',
  'policy.expiring': 'Expire bient\u00f4t',
  'policy.expired': 'Expir\u00e9e',
  'policy.missing': 'Manquante',
  'policy.status': 'Statut de la police',

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES — Errors, alerts, hints, descriptions, dynamic text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Login & auth ──
  'login.error': '\u00c9chec de l\u2019authentification. V\u00e9rifiez vos identifiants.',
  'login.restrictedNotice': 'R\u00e9serv\u00e9 aux administrateurs autoris\u00e9s.',

  // ── Form validation & feedback ──
  'form.validation.required': 'Ce champ est obligatoire',
  'form.validation.slugRequired': 'Un slug d\u2019URL publique est requis avant la publication.',
  'form.validation.slugFormat': 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets',
  'form.saving': 'Enregistrement\u2026',
  'form.saved': 'Toutes les modifications ont \u00e9t\u00e9 enregistr\u00e9es avec succ\u00e8s.',
  'form.submitError': '\u00c9chec de l\u2019enregistrement. V\u00e9rifiez votre connexion.',

  // ── Form hints ──
  'form.photoHint': 'Image carr\u00e9e recommand\u00e9e, minimum 200\u00d7200 px.',
  'form.pdfHint': 'T\u00e9l\u00e9versez le PDF original de la police d\u2019assurance.',
  'form.qrHint': 'T\u00e9l\u00e9versez ou g\u00e9n\u00e9rez le code QR pour ce profil.',

  // ── Dashboard alerts ──
  'dashboard.alerts': 'Alertes op\u00e9rationnelles',
  'dashboard.alertNoPdf': '{count} profil(s) sans PDF de police',
  'dashboard.alertExpiring': '{count} police(s) expire(nt) dans les 30 jours',
  'dashboard.alertCompleteNotPublished': '{count} profil(s) complet(s) non encore publi\u00e9(s)',
  'dashboard.alertPublishedNotVerified': '{count} profil(s) publi\u00e9(s) non v\u00e9rifi\u00e9(s)',
  'dashboard.noAlerts': 'Aucune alerte op\u00e9rationnelle. Tout est en ordre.',

  // ── Dashboard messages ──
  'dashboard.confirmDelete': 'Ce profil op\u00e9rateur sera supprim\u00e9 de fa\u00e7on d\u00e9finitive et irr\u00e9versible. Les titres associ\u00e9s et les liens de v\u00e9rification seront perdus. Souhaitez-vous continuer\u00a0?',
  'dashboard.deleteModalNote': 'Les liens publics QR et NFC cesseront imm\u00e9diatement d\u2019\u00eatre valides et les donn\u00e9es ne seront plus accessibles aux tiers. Cette action est irr\u00e9versible.',
  'dashboard.adjustFilters': 'Ajustez la recherche ou les filtres pour afficher les profils pertinents ou affiner la liste des r\u00e9sultats.',
  'dashboard.searchPlaceholder': 'Nom, entreprise ou code op\u00e9rateur\u2026',
  'common.noResults': 'Aucun profil correspondant',
  'common.filtersActive': '{count} filtre(s) actif(s)',
  'common.clearFilters': 'Effacer tous les filtres',
  'common.noDocument': 'Aucun document t\u00e9l\u00e9vers\u00e9',
  'common.noQr': 'Aucun code QR t\u00e9l\u00e9vers\u00e9',

  // ── Policy descriptions (dynamic) ──
  'policy.daysLeft': '{days} jours restants',
  'policy.expiredDaysAgo': 'Expir\u00e9e depuis {days} jours',
  'policy.desc.validUntil': 'Valide jusqu\u2019au {date}',
  'policy.desc.expiringOn': 'Expire le {date} \u2014 {days} jours restants',
  'policy.desc.expiredOn': 'Expir\u00e9e le {date} (il y a {days} jours)',
  'policy.desc.noPolicyOnFile': 'Aucun document de police enregistr\u00e9',

  // ── Public page messages ──
  'public.insuranceValid': 'La couverture d\u2019assurance est active et valide.',
  'public.insuranceExpiring': 'La couverture d\u2019assurance expire dans {days} jours.',
  'public.insuranceExpired': 'La couverture d\u2019assurance a expir\u00e9. Contactez l\u2019op\u00e9rateur ou l\u2019organisation pour une documentation mise \u00e0 jour.',
  'public.insuranceMissing': 'Aucune information d\u2019assurance enregistr\u00e9e pour cet op\u00e9rateur.',
  'public.noInformation': 'Non fourni',
  'public.policyNotAvailable': 'Document de police original non disponible.',
  'public.policyNotAvailableHint': 'L\u2019organisation \u00e9mettrice n\u2019a pas t\u00e9l\u00e9charg\u00e9 le document de police pour ce profil.',
  'public.latestRecord': 'Cette page refl\u00e8te le dernier enregistrement publi\u00e9 \u00e0 la date indiqu\u00e9e ci-dessus.',
  'public.scanToVerify': 'Scannez ce code pour v\u00e9rifier le profil de l\u2019op\u00e9rateur',

  // ── Profile unavailable messages ──
  'profile.notFoundDesc': 'Le profil d\u2019op\u00e9rateur recherch\u00e9 n\u2019existe pas ou a \u00e9t\u00e9 supprim\u00e9.',
  'profile.notPublishedDesc': 'Ce profil d\u2019op\u00e9rateur n\u2019est actuellement pas disponible pour consultation publique. Il est peut-\u00eatre en cours de r\u00e9vision ou a \u00e9t\u00e9 retir\u00e9.',
  'profile.disclaimer': 'Ces informations sont fournies \u00e0 des fins de v\u00e9rification uniquement. L\u2019exactitude des donn\u00e9es rel\u00e8ve de l\u2019organisation \u00e9mettrice.',
  'profile.expiringInDays': 'Expire dans {days} jours',

  // ── Verification links descriptions ──
  'links.publicUrlDesc': 'Ceci est l\u2019URL publique permanente de ce profil op\u00e9rateur. Partagez-la directement ou encodez-la dans le code QR.',
  'links.publicUrlNotReady': 'D\u00e9finissez un slug et publiez le profil pour g\u00e9n\u00e9rer une URL publique.',
  'links.qrDesc': 'T\u00e9l\u00e9versez ou g\u00e9n\u00e9rez une image de code QR pointant vers la page de v\u00e9rification publique de cet op\u00e9rateur.',
  'links.nfcDesc': 'Un tag NFC physique peut \u00eatre associ\u00e9 \u00e0 ce profil pour un acc\u00e8s par contact. La programmation NFC n\u2019est pas encore disponible.',
  'links.nfcFuture': 'L\u2019int\u00e9gration NFC sera disponible dans une version future. Ce champ est r\u00e9serv\u00e9 \u00e0 l\u2019identifiant du tag NFC.',

  // ── Empty states ──
  'empty.noProfilesIcon': 'Aucun op\u00e9rateur enregistr\u00e9',
  'empty.noResultsIcon': 'Aucun r\u00e9sultat correspondant',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS — Page titles, section headers, subtitles, content blocks
  // ═══════════════════════════════════════════════════════════════════════════

  // ── App identity ──
  'app.title': 'DroneTag',
  'app.description': 'V\u00e9rification professionnelle des titres d\u2019op\u00e9rateur et gestion centralis\u00e9e des documents pour les op\u00e9rations de drones.',

  // ── Login page ──
  'login.title': 'Acc\u00e8s \u00e0 l\u2019administration',
  'login.subtitle': 'Connectez-vous pour g\u00e9rer les profils op\u00e9rateur, les polices et la v\u00e9rification.',

  // ── Home page ──
  'home.hero': 'V\u00e9rification des titres d\u2019op\u00e9rateur de drones',
  'home.subtitle': 'Plateforme professionnelle pour \u00e9mettre, auditer et suivre les titres op\u00e9rationnels des op\u00e9rations UAS.',
  'home.feature1Title': 'Titres d\u2019op\u00e9rateur',
  'home.feature1Desc': '\u00c9mission d\u2019identification num\u00e9rique et de titres pour les op\u00e9rateurs de syst\u00e8mes a\u00e9riens sans pilote.',
  'home.feature2Title': 'V\u00e9rification en temps r\u00e9el',
  'home.feature2Desc': 'Contr\u00f4le imm\u00e9diat des profils valides par scan QR, sans friction.',
  'home.feature3Title': 'Suivi de la conformit\u00e9',
  'home.feature3Desc': 'Suivi automatis\u00e9 des \u00e9ch\u00e9ances d\u2019assurance et de documentation pour maintenir la conformit\u00e9.',
  'home.cta': 'Connexion administrateur',
  'home.footer': 'DroneTag \u00a9 {year}. V\u00e9rification des op\u00e9rateurs et gestion documentaire.',
  'home.learnMore': 'Fonctionnement',
  'home.systemDesc': 'DroneTag aide les organisations \u00e0 conserver et \u00e0 prouver en toute s\u00e9curit\u00e9 les qualifications op\u00e9rationnelles et les polices.',

  // ── Dashboard ──
  'dashboard.title': 'Profils op\u00e9rateurs',
  'dashboard.subtitle': 'G\u00e9rez les titres, les polices et la v\u00e9rification depuis une interface unique.',
  'dashboard.createNew': 'Enregistrer un op\u00e9rateur',
  'dashboard.viewPublicProfile': 'Voir le profil public',
  'dashboard.noProfiles': 'Aucun profil op\u00e9rateur enregistr\u00e9',
  'dashboard.noProfilesHint': 'Enregistrez d\u2019abord un profil op\u00e9rateur pour saisir les titres, les publier et en assurer la v\u00e9rification.',
  'dashboard.deleteModalTitle': 'Supprimer d\u00e9finitivement le profil op\u00e9rateur\u00a0?',

  // ── Dashboard KPI labels ──
  'dashboard.stats.total': 'Profils au total',
  'dashboard.stats.published': 'Publics',
  'dashboard.stats.verified': 'V\u00e9rifi\u00e9s',
  'dashboard.stats.expiring': 'Expire bient\u00f4t',
  'dashboard.stats.expired': 'Expir\u00e9es',
  'dashboard.stats.incomplete': 'Incomplets',

  // ── Admin pages ──
  'admin.createProfileTitle': 'Enregistrer un nouvel op\u00e9rateur',
  'admin.editProfileTitle': 'Modifier le profil op\u00e9rateur',
  'admin.environment': 'Administration',

  // ── Form section headers ──
  'form.person': 'Identit\u00e9 de l\u2019op\u00e9rateur',
  'form.person.desc': 'Donn\u00e9es d\u2019identification personnelle de l\u2019op\u00e9rateur UAS certifi\u00e9.',
  'form.organization': 'Organisation',
  'form.organization.desc': 'Rattachement \u00e0 l\u2019entreprise et informations sur l\u2019organisation \u00e9mettrice.',
  'form.insurance': 'Couverture d\u2019assurance',
  'form.insurance.desc': 'D\u00e9tails de la responsabilit\u00e9 civile et documents de police associ\u00e9s.',
  'form.drone': 'Drone enregistr\u00e9',
  'form.drone.desc': 'Identification et donn\u00e9es du syst\u00e8me a\u00e9rien sans pilote (UAS) enregistr\u00e9.',
  'form.documents': 'Documents compl\u00e9mentaires',
  'form.verification': 'V\u00e9rification et audit',
  'form.verification.desc': 'Statut de v\u00e9rification et historique de contr\u00f4le tra\u00e7able.',
  'form.assets': 'M\u00e9dias et documents',
  'form.assets.desc': 'Photos, logos et codes de v\u00e9rification (p.\u00a0ex. QR) pour la page de profil publique.',
  'form.statusAndAccess': 'Publication et contr\u00f4le d\u2019acc\u00e8s',
  'form.statusAndAccess.desc': 'Cycle de vie du profil, visibilit\u00e9 et autorisation de v\u00e9rification publique.',
  'form.adminSection': 'Notes internes',
  'form.adminSection.desc': 'Annotations administratives non visibles sur la page publique.',

  // ── Verification links section ──
  'form.verificationLinks': 'V\u00e9rification et liens d\u2019acc\u00e8s',
  'form.verificationLinks.desc': 'URL publique, code QR et r\u00e9f\u00e9rence NFC pour la v\u00e9rification externe de ce profil op\u00e9rateur.',
  'links.publicUrlTitle': 'URL de la page publique',
  'links.qrTitle': 'Code QR',
  'links.nfcTitle': 'Tag NFC',

  // ── Form card headers ──
  'form.publicDataTitle': 'Donn\u00e9es op\u00e9rateur',
  'form.publicDataSubtitle': 'Ces champs apparaissent sur la page de profil publique.',
  'form.mediaTitle': 'M\u00e9dias et codes de v\u00e9rification',
  'form.mediaSubtitle': 'Supports visuels et codes pour la v\u00e9rification externe du profil.',
  'form.adminTitle': 'Administration',
  'form.adminSubtitle': 'Param\u00e8tres et notes internes non expos\u00e9s au public.',

  // ── Public profile section headers ──
  'profile.organization': 'Organisation',
  'profile.orgDetails': 'D\u00e9tails de l\u2019organisation',
  'profile.insurance': 'Couverture d\u2019assurance',
  'profile.qrCode': 'V\u00e9rification QR',
  'profile.droneInfo': 'Drone enregistr\u00e9',
  'profile.notFound': 'Profil introuvable',
  'profile.notPublished': 'Profil non disponible',
  'public.operatorProfile': 'Profil Op\u00e9rateur',
  'public.verifiedOperator': 'Op\u00e9rateur V\u00e9rifi\u00e9',
  'public.identity': 'Identit\u00e9 de l\u2019Op\u00e9rateur',
  'public.operatorCode': 'Code Op\u00e9rateur',
  'public.licenseNumber': 'N\u00b0 Licence',
  'public.droneInformation': 'Informations Drone',
  'public.insuranceCoverage': 'Couverture d\u2019Assurance',
  'public.policyDetails': 'D\u00e9tails de la Police',
  'public.policyDocument': 'Document de Police',
  'public.qrVerification': 'Code QR de V\u00e9rification',
  'public.verificationRecord': 'Registre de V\u00e9rification',
  'public.profileReference': 'R\u00e9f\u00e9rence du Profil',
  'public.poweredBy': 'Powered by DroneTag',
};

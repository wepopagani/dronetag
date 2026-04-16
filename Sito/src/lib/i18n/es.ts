import type { TranslationMap } from './schema';

/**
 * Spanish translations.
 * Structure mirrors en.ts — see that file for key documentation.
 */
export const translations: TranslationMap = {

  // ═══════════════════════════════════════════════════════════════════════════
  // LABELS — Field names, buttons, navigation, column headers, short UI text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Common UI ──
  'common.save': 'Guardar cambios',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.create': 'Crear',
  'common.search': 'Buscar',
  'common.back': 'Volver',
  'common.loading': 'Cargando\u2026',
  'common.error': 'Error',
  'common.success': 'Correcto',
  'common.confirm': 'Confirmar',
  'common.yes': 'S\u00ed',
  'common.no': 'No',
  'common.upload': 'Subir',
  'common.download': 'Descargar',
  'common.preview': 'Vista previa',
  'common.publish': 'Publicar',
  'common.unpublish': 'Despublicar',
  'common.published': 'P\u00fablico',
  'common.unpublished': 'Privado',
  'common.required': 'Obligatorio',
  'common.optional': 'Opcional',
  'common.actions': 'Acciones',
  'common.language': 'Idioma',
  'common.all': 'Todos',
  'common.filter': 'Filtrar',
  'common.sortBy': 'Ordenar por',
  'common.notAvailable': 'N/D',
  'common.select': 'Seleccionar\u2026',
  'common.clickOrDragToUpload': 'Haga clic o arrastre el archivo para subirlo',
  'common.remove': 'Quitar',
  'common.viewDocument': 'Ver documento',
  'common.retry': 'Reintentar',
  'common.tryAgain': 'Se produjo un error al cargar esta página. Inténtelo de nuevo más tarde.',
  'common.version': 'v1.0',

  // ── Navigation ──
  'nav.home': 'Inicio',
  'nav.dashboard': 'Panel',
  'nav.login': 'Iniciar sesi\u00f3n',
  'nav.logout': 'Cerrar sesi\u00f3n',
  'nav.newProfile': 'Nuevo perfil',
  'nav.adminBadge': 'ADMIN',
  'nav.shop': 'Tienda',
  'nav.account': 'Mi cuenta',
  'nav.signup': 'Crear cuenta',

  // ── Login form ──
  'login.email': 'Direcci\u00f3n de correo electr\u00f3nico',
  'login.password': 'Contrase\u00f1a',
  'login.submit': 'Iniciar sesi\u00f3n',
  'login.noAccount': '¿No tienes cuenta?',
  'login.signupCta': 'Crear una',

  // ── Sign-up form ──
  'signup.title': 'Crea tu cuenta',
  'signup.subtitle': 'Sigue tus pedidos, envíos y accede a tu perfil.',
  'signup.submit': 'Crear cuenta',
  'signup.passwordConfirm': 'Confirmar contraseña',
  'signup.haveAccount': '¿Ya tienes cuenta?',
  'signup.errorPasswordShort': 'La contraseña debe tener al menos 6 caracteres.',
  'signup.errorPasswordMismatch': 'Las contraseñas no coinciden.',
  'signup.errorEmailInUse': 'Ya existe una cuenta con este correo.',
  'signup.errorGeneric': 'No se pudo crear la cuenta. Inténtalo de nuevo.',

  // ── Account area ──
  'account.eyebrow': 'Cuenta',
  'account.title': 'Bienvenido, {name}',
  'account.subtitle': 'Consulta tu perfil y el estado de tus pedidos.',
  'account.tabProfile': 'Perfil',
  'account.tabOrders': 'Pedidos',
  'account.personalInfo': 'Información personal',
  'account.shippingAddress': 'Dirección de envío',
  'account.readOnly': 'Solo lectura',
  'account.noAddress': 'Aún no hay dirección guardada.',
  'account.editNotice': 'La edición del perfil estará disponible próximamente. Para cambios, contacta con soporte.',
  'account.memberSince': 'Miembro desde {date}',

  // ── Orders ──
  'orders.emptyTitle': 'Sin pedidos',
  'orders.emptyDesc': 'Cuando hagas tu primer pedido lo verás aquí con seguimiento y trazabilidad completos.',
  'orders.emptyCta': 'Ir a la tienda',
  'orders.orderNumber': 'Pedido n.º',
  'orders.placedOn': 'Realizado el {date}',
  'orders.viewDetails': 'Ver detalles',
  'orders.backToOrders': 'Volver a pedidos',
  'orders.progress': 'Avance',
  'orders.shippingTitle': 'Envío',
  'orders.carrier': 'Transportista',
  'orders.openTracking': 'Abrir seguimiento',
  'orders.shipTo': 'Enviar a',
  'orders.eta': 'Entrega estimada · {date}',
  'orders.deliveredOn': 'Entregado el {date}',
  'orders.items': 'Artículos del pedido',
  'orders.professionalTrace': 'Trazabilidad profesional',
  'orders.showTrace': 'Mostrar trazabilidad',
  'orders.hideTrace': 'Ocultar trazabilidad',
  'orders.subtotal': 'Subtotal',
  'orders.shippingFee': 'Envío',
  'orders.total': 'Total',
  'orders.timeline': 'Historial completo',
  'orders.notFound': 'Pedido no encontrado o no accesible.',

  // ── Order status labels ──
  'orderStatus.pending': 'Pendiente',
  'orderStatus.paid': 'Pagado',
  'orderStatus.in_production': 'En producción',
  'orderStatus.assembled': 'Ensamblado',
  'orderStatus.quality_check': 'Control de calidad',
  'orderStatus.packed': 'Empaquetado',
  'orderStatus.shipped': 'Enviado',
  'orderStatus.in_transit': 'En tránsito',
  'orderStatus.delivered': 'Entregado',
  'orderStatus.cancelled': 'Cancelado',

  // ── Traceability detail fields ──
  'trace.batch': 'Lote',
  'trace.material': 'Material / filamento',
  'trace.printedAt': 'Impreso el',
  'trace.printer': 'Impresora',
  'trace.assembledAt': 'Ensamblado el',
  'trace.assembledBy': 'Ensamblado por',
  'trace.qcAt': 'QC aprobado el',
  'trace.qcBy': 'Inspector QC',
  'trace.notes': 'Notas',

  // ── Field labels ──
  'field.language': 'Preferencia de idioma',
  'field.firstName': 'Nombre',
  'field.lastName': 'Apellidos',
  'field.operatorCode': 'C\u00f3digo de operador',
  'field.email': 'Correo electr\u00f3nico',
  'field.phone': 'Tel\u00e9fono',
  'field.emergencyContact': 'Contacto de emergencia',
  'field.photo': 'Foto de perfil',
  'field.visibility': 'Visibilidad',
  'field.birthDate': 'Fecha de nacimiento',
  'field.nationality': 'Nacionalidad',
  'field.operatorLicense': 'Licencia de operador',
  'field.companyName': 'Raz\u00f3n social',
  'field.companyDetails': 'Datos de la empresa',
  'field.companyAddress': 'Direcci\u00f3n de la empresa',
  'field.companyVatOrRegistration': 'NIF / IVA / N\u00famero de registro',
  'field.droneName': 'Nombre del dron',
  'field.droneModel': 'Modelo',
  'field.serialNumber': 'N.\u00ba de serie',
  'field.droneRegNumber': 'Registro',
  'field.logo': 'Logotipo',
  'field.banner': 'Imagen de banner',
  'field.insuranceProvider': 'Aseguradora',
  'field.policyNumber': 'N\u00famero de p\u00f3liza',
  'field.issuedAt': 'Fecha de emisi\u00f3n',
  'field.expiresAt': 'Fecha de vencimiento',
  'field.policyPdf': 'Documento de la p\u00f3liza (PDF)',
  'field.insuranceNotes': 'Notas de la p\u00f3liza',
  'field.qrImage': 'Imagen del c\u00f3digo QR',
  'field.slug': 'Slug de URL p\u00fablica',
  'field.lastEditedBy': '\u00daltima edici\u00f3n por',
  'field.publishedAt': 'Publicado el',
  'field.lastVerifiedAt': '\u00daltima verificaci\u00f3n el',
  'field.adminNotes': 'Notas internas de administraci\u00f3n',

  // ── Dashboard table columns ──
  'dashboard.name': 'Operador',
  'dashboard.organization': 'Organizaci\u00f3n',
  'dashboard.operatorCode': 'C\u00f3digo de operador',
  'dashboard.verification': 'Verificaci\u00f3n',
  'dashboard.insuranceStatus': 'Seguro',
  'dashboard.expiryDate': 'Vencimiento',
  'dashboard.updatedAt': 'Actualizado',
  'dashboard.completeness': 'Completitud',
  'dashboard.policyExpiry': 'Vencimiento de la p\u00f3liza',
  'dashboard.draft': 'Borrador',
  'dashboard.status': 'Estado',
  'dashboard.incomplete': 'Incompleto',

  // ── Dashboard filters ──
  'dashboard.filterByStatus': 'Filtrar por estado',
  'dashboard.filterByPolicy': 'Filtrar por p\u00f3liza',
  'dashboard.filterByVerification': 'Verificaci\u00f3n',
  'dashboard.filterByVisibility': 'Visibilidad',
  'dashboard.sortName': 'Nombre',
  'dashboard.sortExpiry': 'Vencimiento de la p\u00f3liza',
  'dashboard.sortPriority': 'Urgencia documental',
  'dashboard.sortUpdated': '\u00daltima actualizaci\u00f3n',

  // ── Document type labels ──
  'docType.insurancePolicy': 'P\u00f3liza de seguro',
  'docType.operatorLicense': 'Licencia de operador',
  'docType.droneRegistration': 'Registro de dron',
  'docType.trainingCertificate': 'Certificado de formaci\u00f3n',
  'docType.other': 'Otro documento',

  // ── Public page data labels ──
  'profile.operatorId': 'ID de operador',
  'profile.registrationCode': 'Registro',
  'profile.provider': 'Aseguradora',
  'profile.policyNumber': 'N.\u00ba de p\u00f3liza',
  'profile.coverage': 'Cobertura',
  'profile.validFrom': 'V\u00e1lido desde',
  'profile.validUntil': 'V\u00e1lido hasta',
  'profile.notes': 'Notas',
  'profile.viewPolicy': 'Ver documento de p\u00f3liza original',
  'profile.downloadPolicy': 'Descargar documento de la p\u00f3liza',
  'profile.droneId': 'ID del dron',
  'profile.droneModel': 'Modelo',
  'profile.serialNumber': 'N.\u00ba de serie',
  'profile.droneRegNumber': 'Registro',
  'profile.category': 'Categor\u00eda',
  'profile.contact': 'Contacto',
  'profile.emergencyContact': 'Emergencia',
  'profile.documents': 'Documentos',
  'profile.verifiedOn': 'Verificado el',
  'profile.lastUpdated': '\u00daltima actualizaci\u00f3n',

  // ── Toggle / action labels ──
  'toggle.makePublic': 'Publicar',
  'toggle.makePrivate': 'Despublicar',
  'form.generateSlug': 'Generar URL',
  'form.publicUrlPreview': 'URL p\u00fablica:',
  'form.profileId': 'ID del perfil:',

  // ── Verification links labels ──
  'field.nfcReference': 'Referencia de etiqueta NFC',
  'field.publicUrl': 'URL de p\u00e1gina p\u00fablica',
  'links.copyUrl': 'Copiar',
  'links.copied': 'Copiado',
  'links.nfcNotAssigned': 'No asignado',

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS — State indicators, badges, computed statuses
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Profile lifecycle ──
  'status.active': 'Activo',
  'status.draft': 'Borrador',
  'status.archived': 'Archivado',
  'status.suspended': 'Suspendido',

  // ── Visibility ──
  'visibility.private': 'Privado',
  'visibility.public': 'P\u00fablico',

  // ── Verification ──
  'verification.unverified': 'No verificado',
  'verification.pending': 'Pendiente de revisi\u00f3n',
  'verification.verified': 'Verificado',
  'verification.rejected': 'Rechazado',
  'verification.status': 'Estado de verificaci\u00f3n',
  'verification.lastVerified': '\u00daltima verificaci\u00f3n',
  'verification.verifiedBy': 'Verificado por',
  'verification.notes': 'Notas de verificaci\u00f3n',

  // ── Insurance policy ──
  'policy.valid': 'Vigente',
  'policy.expiring': 'Pr\u00f3xima a vencer',
  'policy.expired': 'Vencida',
  'policy.missing': 'Ausente',
  'policy.status': 'Estado de la p\u00f3liza',

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES — Errors, alerts, hints, descriptions, dynamic text
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Login & auth ──
  'login.error': 'Error de autenticaci\u00f3n. Compruebe sus credenciales.',
  'login.restrictedNotice': 'Acceso restringido a administradores autorizados.',

  // ── Form validation & feedback ──
  'form.validation.required': 'Este campo es obligatorio',
  'form.validation.slugRequired': 'Se requiere un slug de URL p\u00fablico antes de publicar.',
  'form.validation.slugFormat': 'El slug solo puede contener letras min\u00fasculas, n\u00fameros y guiones',
  'form.saving': 'Guardando\u2026',
  'form.saved': 'Todos los cambios se han guardado correctamente.',
  'form.submitError': 'No se pudo guardar. Compruebe la conexi\u00f3n.',

  // ── Form hints ──
  'form.photoHint': 'Se recomienda imagen cuadrada, m\u00ednimo 200\u00d7200 px.',
  'form.pdfHint': 'Suba el PDF original de la p\u00f3liza de seguro.',
  'form.qrHint': 'Cargue o genere el c\u00f3digo QR para este perfil.',

  // ── Dashboard alerts ──
  'dashboard.alerts': 'Alertas operativas',
  'dashboard.alertNoPdf': '{count} perfil(es) sin PDF de p\u00f3liza',
  'dashboard.alertExpiring': '{count} p\u00f3liza(s) vence(n) en los pr\u00f3ximos 30 d\u00edas',
  'dashboard.alertCompleteNotPublished': '{count} perfil(es) completo(s) a\u00fan no publicado(s)',
  'dashboard.alertPublishedNotVerified': '{count} perfil(es) publicado(s) no verificado(s)',
  'dashboard.noAlerts': 'Sin alertas operativas. Todo en orden.',

  // ── Dashboard messages ──
  'dashboard.confirmDelete': 'Este perfil de operador se eliminar\u00e1 de forma permanente e irreversible. Se perder\u00e1n las credenciales asociadas y los enlaces de verificaci\u00f3n. \u00bfDesea continuar?',
  'dashboard.deleteModalNote': 'Los enlaces p\u00fablicos QR y NFC dejar\u00e1n de ser v\u00e1lidos de inmediato y los datos dejar\u00e1n de estar disponibles para terceros. Esta acci\u00f3n no se puede deshacer.',
  'dashboard.adjustFilters': 'Modifique la b\u00fasqueda o los filtros para mostrar perfiles pertinentes o acotar los resultados.',
  'dashboard.searchPlaceholder': 'Nombre, empresa o c\u00f3digo de operador\u2026',
  'common.noResults': 'No hay perfiles coincidentes',
  'common.filtersActive': '{count} filtro(s) activo(s)',
  'common.clearFilters': 'Borrar todos los filtros',
  'common.noDocument': 'No hay ning\u00fan documento cargado',
  'common.noQr': 'No hay ning\u00fan c\u00f3digo QR cargado',

  // ── Policy descriptions (dynamic) ──
  'policy.daysLeft': 'Quedan {days} d\u00edas',
  'policy.expiredDaysAgo': 'Vencida hace {days} d\u00edas',
  'policy.desc.validUntil': 'Vigente hasta el {date}',
  'policy.desc.expiringOn': 'Vence el {date} \u2014 {days} d\u00edas restantes',
  'policy.desc.expiredOn': 'Vencida el {date} (hace {days} d\u00edas)',
  'policy.desc.noPolicyOnFile': 'No hay documento de p\u00f3liza registrado',

  // ── Public page messages ──
  'public.insuranceValid': 'La cobertura de seguro est\u00e1 activa y vigente.',
  'public.insuranceExpiring': 'La cobertura de seguro vence en {days} d\u00edas.',
  'public.insuranceExpired': 'La cobertura de seguro ha expirado. Contacte al operador o la organizaci\u00f3n para documentaci\u00f3n actualizada.',
  'public.insuranceMissing': 'No hay informaci\u00f3n de seguro registrada para este operador.',
  'public.noInformation': 'No proporcionado',
  'public.policyNotAvailable': 'Documento de p\u00f3liza original no disponible.',
  'public.policyNotAvailableHint': 'La organizaci\u00f3n emisora no ha cargado el documento de p\u00f3liza para este perfil.',
  'public.latestRecord': 'Esta p\u00e1gina refleja el \u00faltimo registro publicado a la fecha indicada arriba.',
  'public.scanToVerify': 'Escanee este c\u00f3digo para verificar el perfil del operador',

  // ── Profile unavailable messages ──
  'profile.notFoundDesc': 'El perfil de operador que busca no existe o ha sido eliminado.',
  'profile.notPublishedDesc': 'Este perfil de operador no est\u00e1 disponible para consulta p\u00fablica. Puede estar en revisi\u00f3n o haber sido retirado.',
  'profile.disclaimer': 'Esta informaci\u00f3n se facilita \u00fanicamente con fines de verificaci\u00f3n. La exactitud de los datos es responsabilidad de la organizaci\u00f3n emisora.',
  'profile.expiringInDays': 'Caduca en {days} d\u00edas',

  // ── Verification links descriptions ──
  'links.publicUrlDesc': 'Esta es la URL p\u00fablica permanente para este perfil de operador. Comp\u00e1rtala directamente o cod\u00edfiquela en el c\u00f3digo QR.',
  'links.publicUrlNotReady': 'Defina un slug y publique el perfil para generar una URL p\u00fablica.',
  'links.qrDesc': 'Cargue o genere una imagen de c\u00f3digo QR que enlace a la p\u00e1gina de verificaci\u00f3n p\u00fablica de este operador.',
  'links.nfcDesc': 'Se puede vincular una etiqueta NFC f\u00edsica a este perfil para acceso por contacto. La programaci\u00f3n NFC a\u00fan no est\u00e1 disponible.',
  'links.nfcFuture': 'La integraci\u00f3n NFC estar\u00e1 disponible en una versi\u00f3n futura. Este campo est\u00e1 reservado para el identificador de la etiqueta NFC.',

  // ── Empty states ──
  'empty.noProfilesIcon': 'No hay operadores registrados',
  'empty.noResultsIcon': 'No hay resultados coincidentes',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS — Page titles, section headers, subtitles, content blocks
  // ═══════════════════════════════════════════════════════════════════════════

  // ── App identity ──
  'app.title': 'DroneTag',
  'app.description': 'Verificaci\u00f3n profesional de credenciales de operadores y gesti\u00f3n centralizada de documentaci\u00f3n para operaciones con drones.',

  // ── Login page ──
  'login.title': 'Acceso a la administraci\u00f3n',
  'login.subtitle': 'Inicie sesi\u00f3n para gestionar perfiles de operador, p\u00f3lizas y verificaci\u00f3n.',

  // ── Home page ──
  'home.hero': 'Verificaci\u00f3n de credenciales de operadores de drones',
  'home.subtitle': 'Plataforma profesional para emitir, auditar y dar seguimiento a credenciales operativas en operaciones con UAS.',
  'home.feature1Title': 'Credenciales de operador',
  'home.feature1Desc': 'Emisi\u00f3n de identificaci\u00f3n digital y credenciales para operadores de sistemas a\u00e9reos no tripulados.',
  'home.feature2Title': 'Verificaci\u00f3n en tiempo real',
  'home.feature2Desc': 'Comprobaci\u00f3n inmediata de perfiles v\u00e1lidos mediante escaneo QR, sin fricci\u00f3n.',
  'home.feature3Title': 'Supervisi\u00f3n del cumplimiento',
  'home.feature3Desc': 'Seguimiento automatizado del vencimiento de seguros y documentaci\u00f3n para mantener la conformidad.',
  'home.cta': 'Inicio de sesi\u00f3n de administrador',
  'home.footer': 'DroneTag \u00a9 {year}. Verificaci\u00f3n de operadores y gesti\u00f3n documental.',
  'home.learnMore': 'C\u00f3mo funciona',
  'home.systemDesc': 'DroneTag ayuda a las organizaciones a custodiar y demostrar de forma segura las cualificaciones operativas y las p\u00f3lizas.',

  // ── Dashboard ──
  'dashboard.title': 'Perfiles de operador',
  'dashboard.subtitle': 'Gestione credenciales, p\u00f3lizas y verificaci\u00f3n desde un \u00fanico panel.',
  'dashboard.createNew': 'Registrar operador',
  'dashboard.noProfiles': 'No hay perfiles de operador registrados',
  'dashboard.noProfilesHint': 'Registre primero un perfil de operador para capturar credenciales, publicarlas y gestionar su verificaci\u00f3n.',
  'dashboard.deleteModalTitle': '\u00bfEliminar permanentemente el perfil de operador?',

  // ── Dashboard KPI labels ──
  'dashboard.stats.total': 'Perfiles totales',
  'dashboard.stats.published': 'P\u00fablicos',
  'dashboard.stats.verified': 'Verificados',
  'dashboard.stats.expiring': 'Pr\u00f3ximos a vencer',
  'dashboard.stats.expired': 'Vencidas',
  'dashboard.stats.incomplete': 'Incompletos',

  // ── Admin pages ──
  'admin.createProfileTitle': 'Registrar nuevo operador',
  'admin.editProfileTitle': 'Editar perfil de operador',
  'admin.environment': 'Administraci\u00f3n',

  // ── Form section headers ──
  'form.person': 'Identidad del operador',
  'form.person.desc': 'Datos de identificaci\u00f3n personal del operador certificado de UAS.',
  'form.organization': 'Organizaci\u00f3n',
  'form.organization.desc': 'Afiliaci\u00f3n empresarial e informaci\u00f3n de la organizaci\u00f3n emisora.',
  'form.insurance': 'Cobertura del seguro',
  'form.insurance.desc': 'Detalles de la p\u00f3liza de responsabilidad civil y documentaci\u00f3n asociada.',
  'form.drone': 'Dron registrado',
  'form.drone.desc': 'Identificaci\u00f3n y datos del sistema a\u00e9reo no tripulado (UAS) registrado.',
  'form.documents': 'Documentos adicionales',
  'form.verification': 'Verificaci\u00f3n y auditor\u00eda',
  'form.verification.desc': 'Estado de verificaci\u00f3n e historial de revisi\u00f3n trazable.',
  'form.assets': 'Medios y documentos',
  'form.assets.desc': 'Fotograf\u00edas, logotipos y c\u00f3digos de verificaci\u00f3n (p. ej., QR) para el perfil p\u00fablico.',
  'form.statusAndAccess': 'Publicaci\u00f3n y control de acceso',
  'form.statusAndAccess.desc': 'Ciclo de vida del perfil, visibilidad y autorizaci\u00f3n para verificaci\u00f3n p\u00fablica.',
  'form.adminSection': 'Notas internas',
  'form.adminSection.desc': 'Anotaciones administrativas no visibles en la p\u00e1gina p\u00fablica.',

  // ── Verification links section ──
  'form.verificationLinks': 'Verificaci\u00f3n y enlaces de acceso',
  'form.verificationLinks.desc': 'URL p\u00fablica, c\u00f3digo QR y referencia NFC para la verificaci\u00f3n externa de este perfil de operador.',
  'links.publicUrlTitle': 'URL de p\u00e1gina p\u00fablica',
  'links.qrTitle': 'C\u00f3digo QR',
  'links.nfcTitle': 'Etiqueta NFC',

  // ── Form card headers ──
  'form.publicDataTitle': 'Datos del operador',
  'form.publicDataSubtitle': 'Estos campos se muestran en la p\u00e1gina de perfil p\u00fablica.',
  'form.mediaTitle': 'Medios y c\u00f3digos de verificaci\u00f3n',
  'form.mediaSubtitle': 'Recursos visuales y c\u00f3digos para la verificaci\u00f3n externa del perfil.',
  'form.adminTitle': 'Administraci\u00f3n',
  'form.adminSubtitle': 'Ajustes y notas internas no expuestos al p\u00fablico.',

  // ── Public profile section headers ──
  'profile.organization': 'Organizaci\u00f3n',
  'profile.orgDetails': 'Datos de la organizaci\u00f3n',
  'profile.insurance': 'Cobertura del seguro',
  'profile.qrCode': 'Verificaci\u00f3n QR',
  'profile.droneInfo': 'Dron registrado',
  'profile.notFound': 'Perfil no encontrado',
  'profile.notPublished': 'Perfil no disponible',
  'public.operatorProfile': 'Perfil de Operador',
  'public.verifiedOperator': 'Operador Verificado',
  'public.identity': 'Identidad del Operador',
  'public.operatorCode': 'C\u00f3digo de Operador',
  'public.licenseNumber': 'N.\u00ba Licencia',
  'public.droneInformation': 'Informaci\u00f3n del Dron',
  'public.insuranceCoverage': 'Cobertura de Seguro',
  'public.policyDetails': 'Detalles de P\u00f3liza',
  'public.policyDocument': 'Documento de P\u00f3liza',
  'public.qrVerification': 'C\u00f3digo QR de Verificaci\u00f3n',
  'public.verificationRecord': 'Registro de Verificaci\u00f3n',
  'public.profileReference': 'Referencia del Perfil',
  'public.poweredBy': 'Powered by DroneTag',
};

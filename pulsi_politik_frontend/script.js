// pulsi_politik_frontend/script.js
console.log("SCRIPT.JS: Top of file reached, script is loading (v_PMO_FROM_BACKEND).");

document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT.JS: DOMContentLoaded event fired (v_PMO_FROM_BACKEND). Startup initiated.");
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        console.log("SCRIPT.JS: ChartDataLabels plugin registered with Chart.js.");
    } else {
        console.error("SCRIPT.JS: CRITICAL - Chart or ChartDataLabels is not defined. Plugin NOT registered.");
    }

    // MODIFIED API_BASE_URL for deployment
    // This will make API calls relative to the current host, e.g.,
    // if page is on https://pulsipublicv1.onrender.com, API calls will go to https://pulsipublicv1.onrender.com/api/...
    // if page is on http://127.0.0.1:5000 (served by Flask), API calls will go to http://127.0.0.1:5000/api/...
    const API_BASE_URL = '/api'; // <<<< KEY CHANGE HERE

    const languageSelectorButton = document.getElementById('languageSelector');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentLanguageSpan = languageSelectorButton?.querySelector('span');
    const pillarTabs = document.querySelectorAll('.tab-item');
    let chartContainer = document.getElementById('chart-container');
    if (!chartContainer) { console.error("SCRIPT.JS: CRITICAL - chart-container NOT FOUND!"); }
    const currentViewTitle = document.getElementById('currentView');
    const ministryDetailsSection = document.getElementById('ministryDetails');
    const selectedMinistryNameTitle = document.getElementById('selectedMinistryName');
    const kpiElements = {
        avgTransparencyValue: document.getElementById('kpiAvgTransparencyValue'),
        avgTransparencyChange: document.getElementById('kpiAvgTransparencyChange'),
        participationScoreValue: document.getElementById('kpiParticipationScoreValue'),
        participationScoreChange: document.getElementById('kpiParticipationScoreChange'),
        efficiencyRatingValue: document.getElementById('kpiEfficiencyRatingValue'),
        efficiencyRatingChange: document.getElementById('kpiEfficiencyRatingChange'),
        overallOutcomeValue: document.getElementById('kpiOverallOutcomeValue'),
        overallOutcomeChange: document.getElementById('kpiOverallOutcomeChange')
    };
    const detailTransparencyScore = document.getElementById('detailTransparency');
    const detailTransparencyChange = document.getElementById('detailTransparencyChange');
    const detailRequests = document.getElementById('detailRequests');
    const detailRequestsProcessed = document.getElementById('detailRequestsProcessed');
    const detailResponseTime = document.getElementById('detailResponseTime');
    const detailResponseTimeChange = document.getElementById('detailResponseTimeChange');
    const recentActivitiesBody = document.getElementById('recentActivitiesBody');
    const perfBreakdownElements = {};
    for (let i = 1; i <= 5; i++) {
        perfBreakdownElements[`label${i}`] = document.getElementById(`perfBreakdownLabel${i}`);
        perfBreakdownElements[`value${i}`] = document.getElementById(`perfBreakdownValue${i}`);
        perfBreakdownElements[`bar${i}`] = document.getElementById(`perfBreakdownBar${i}`);
    }
    let currentPillar = 'Transparency'; let currentLang = 'en'; let allMinistriesData = [];
    let apiDataCache = { dashboard: {}, details: {} };
    let currentNotificationTimeout = null; let currentSortGlobal = 'score-desc'; let ministryBarChart = null;
    
    const translations = {
        en: { /* ... Your full English translations ... */ days: "days", headerTitle: "Public Pulse", headerSubtitle: "Kosovo Civic Monitor", languageEN: "English (EN)", languageSQ: "Albanian (SQ)", languageSR: "Serbian (SR)", userMenuProfile: "Profile", userMenuSettings: "Settings", userMenuSignOut: "Sign out", sidebarMainNavigation: "MAIN NAVIGATION", sidebarDashboard: "Dashboard", sidebarReports: "Reports", sidebarInstitutions: "Institutions", sidebarDocuments: "Documents", sidebarEvents: "Events", sidebarAnalytics: "ANALYTICS", sidebarTrends: "Trends", sidebarRegionalData: "Regional Data", sidebarExportData: "Export Data", breadcrumbDashboard: "Dashboard", breadcrumbPublicPulse: "Public Pulse", pageTitle: "Public Pulse Dashboard", pageSubtitle: "Monitoring transparency and performance of Kosovo institutions", kpiAvgTransparency: "Average Transparency", kpiParticipationScore: "Participation Score", kpiEfficiencyRating: "Efficiency Rating", kpiOverallOutcome: "Overall Outcome", kpiChangeSinceLastQuarter: "since last quarter", filtersTitle: "Interactive Filters", filtersReset: "Reset Filters", filtersExport: "Export", filtersExportPDF: "Export as PDF", filtersExportExcel: "Export as Excel", filtersExportCSV: "Export as CSV", filtersExportImage: "Export as Image", filtersTimePeriod: "Time Period", filtersCompareWith: "Compare With", filtersMinistryType: "Ministry Type", filtersScoreRange: "Score Range", filtersSearchMinistry: "Search Ministry", filtersSearchPlaceholder: "Type to search...", filtersApply: "Apply Filters", filtersShowComparison: "Show comparison", tabTransparency: "Transparency", tabParticipation: "Participation", tabEfficiency: "Efficiency", tabOutcome: "Outcome", viewTitleSuffix: "Scores", legendHigh: "High (>70)", legendMedium: "Medium (40-70)", legendLow: "Low (<40)", legendSortBy: "Sort by", sortHighestScore: "Highest Score", sortLowestScore: "Lowest Score", sortNameAZ: "Name (A-Z)", sortNameZA: "Name (Z-A)", detailsTitle: "Ministry Details", detailsTransparencyScore: "Transparency Score", detailsInfoRequests: "Information Requests", infoRequestsProcessed: "processed", detailsResponseTime: "Response Time", daysUnit: "days", detailsChangeSinceLastPeriod: "since last period", detailsPerfBreakdown: "Performance Breakdown", perfBreakdownWebsiteTransparency: "Website Transparency", perfBreakdownDocAccessibility: "Document Accessibility", perfBreakdownReqResponsiveness: "Request Responsiveness", perfBreakdownInfoCompleteness: "Information Completeness", perfBreakdownPublicEngagement: "Public Engagement", perfBreakdownDefaultLabel1: "Website Transparency", perfBreakdownDefaultLabel2: "Document Accessibility", perfBreakdownDefaultLabel3: "Request Responsiveness", perfBreakdownDefaultLabel4: "Information Completeness", perfBreakdownDefaultLabel5: "Public Engagement", detailsRecentActivities: "Recent Activities", tableHeaderDate: "Date", tableHeaderActivity: "Activity", tableHeaderStatus: "Status", tableStatusCompleted: "Completed", tableStatusInProgress: "In Progress", tableNoRecentActivities: "No recent activities to display.", tableNoDataToDisplay: "No data to display for the current filters.", notificationLangSwitchPrefix: "Language switched to", notificationFiltersApplied: "Filters applied", notificationFiltersReset: "Filters have been reset.", notificationComparisonEnabled: "Comparison view enabled", notificationComparisonDisabled: "Comparison view disabled", notificationExportingPrefix: "Exporting data as", notificationSortedByPrefix: "Sorted by", tooltipClickForDetails: "Click for details", tooltipScoreSuffix: "Score", categoryLabel: "Category", ministerLabel: "Minister", tooltipKeyMembers: "Key Members", optionNoComparison: "No Comparison", optionAllMinistries: "All Ministries", loadingData: "Loading data...", errorFetchingData: "Error fetching data. Please try again.", noChangeData: "- No change data", footerAboutTitle: "About Public Pulse", footerAboutText: "Monitoring transparency and performance of Kosovo institutions to foster accountability and civic engagement. Our mission is to provide citizens with reliable data.", footerQuickLinksTitle: "Quick Links", footerContactUs: "Contact Us", footerPrivacyPolicy: "Privacy Policy", footerContactInfoTitle: "Contact Info", footerAddress: "Civic Tech Hub, Prishtina, Kosovo", footerFollowUsTitle: "Follow Us", footerCopyright: "Public Pulse Kosovo. All Rights Reserved.", categoryEconomic: "Economic", categoryGovernance: "Governance", categorySocial: "Social", categoryInfrastructure: "Infrastructure",
            "activityPrefixPublicEvent": "Public Event: ", "activityPrefixReportRelease": "Report Release: ", "activityPrefixNewInitiative": "New Initiative: ", "activityPrefixConsultationDocument": "Consultation Document: ",
            "pmoName": "Office of the Prime Minister", "primeMinisterLabel": "Prime Minister",
            "periodQ2_2023": "Q2 2023", "periodQ1_2023": "Q1 2023", "periodQ4_2022": "Q4 2022", "periodQ3_2022": "Q3 2022", "periodAnnual_2022": "Annual 2022",
            "periodQ1_2023_compare": "Q1 2023", "periodQ4_2022_compare": "Q4 2022", "periodQ2_2022_yoy": "Q2 2022 (YoY)", "periodAnnual_2022_compare": "Annual 2022"
        },
        sq: { /* ... Your full Albanian translations ... */ days: "ditë", headerTitle: "Pulsi Publik", headerSubtitle: "Monitori Qytetar i Kosovës", languageEN: "Anglisht (EN)", languageSQ: "Shqip (SQ)", languageSR: "Serbisht (SR)", userMenuProfile: "Profili", userMenuSettings: "Cilësimet", userMenuSignOut: "Dilni", sidebarMainNavigation: "NAVIGIMI KRYESOR", sidebarDashboard: "Paneli", sidebarReports: "Raportet", sidebarInstitutions: "Institucionet", sidebarDocuments: "Dokumentet", sidebarEvents: "Ngjarjet", sidebarAnalytics: "ANALITIKA", sidebarTrends: "Trendet", sidebarRegionalData: "Të Dhënat Rajonale", sidebarExportData: "Eksporto të Dhënat", breadcrumbDashboard: "Paneli", breadcrumbPublicPulse: "Pulsi Publik", pageTitle: "Paneli Pulsi Publik", pageSubtitle: "Monitorimi i transparencës dhe performancës së institucioneve të Kosovës", kpiAvgTransparency: "Transparenca Mesatare", kpiParticipationScore: "Pikët e Pjesëmarrjes", kpiEfficiencyRating: "Vlerësimi i Efikasitetit", kpiOverallOutcome: "Rezultati i Përgjithshëm", kpiChangeSinceLastQuarter: "nga tremujori i kaluar", filtersTitle: "Filtra Interaktivë", filtersReset: "Rivendos Filtrat", filtersExport: "Eksporto", filtersExportPDF: "Eksporto si PDF", filtersExportExcel: "Eksporto si Excel", filtersExportCSV: "Eksporto si CSV", filtersExportImage: "Eksporto si Imazh", filtersTimePeriod: "Periudha Kohore", filtersCompareWith: "Krahaso Me", filtersMinistryType: "Lloji i Ministrisë", filtersScoreRange: "Gama e Pikëve", filtersSearchMinistry: "Kërko Ministrinë", filtersSearchPlaceholder: "Shkruaj për të kërkuar...", filtersApply: "Apliko Filtrat", filtersShowComparison: "Shfaq krahasimin", tabTransparency: "Transparenca", tabParticipation: "Pjesëmarrja", tabEfficiency: "Efikasiteti", tabOutcome: "Rezultati", viewTitleSuffix: " Rezultatet", legendHigh: "E Lartë (>70)", legendMedium: "Mesatare (40-70)", legendLow: "E Ulët (<40)", legendSortBy: "Rendit sipas", sortHighestScore: "Pikët më të Larta", sortLowestScore: "Pikët më të Ulëta", sortNameAZ: "Emri (A-Z)", sortNameZA: "Emri (Z-A)", detailsTitle: "Detajet e Ministrisë", detailsTransparencyScore: "Pikët e Transparencës", detailsInfoRequests: "Kërkesat për Informacion", infoRequestsProcessed: "të procesuara", detailsResponseTime: "Koha e Përgjigjes", daysUnit: "ditë", detailsChangeSinceLastPeriod: "nga periudha e kaluar", detailsPerfBreakdown: "Ndarja e Performancës", perfBreakdownWebsiteTransparency: "Transparenca e Uebfaqes", perfBreakdownDocAccessibility: "Aksesueshmëria e Dokumenteve", perfBreakdownReqResponsiveness: "Përgjegjshmëria ndaj Kërkesave", perfBreakdownInfoCompleteness: "Plotësia e Informacionit", perfBreakdownPublicEngagement: "Angazhimi Publik", perfBreakdownDefaultLabel1: "Transparenca e Uebfaqes", perfBreakdownDefaultLabel2: "Aksesueshmëria e Dokumenteve", perfBreakdownDefaultLabel3: "Përgjegjshmëria ndaj Kërkesave", perfBreakdownDefaultLabel4: "Plotësia e Informacionit", perfBreakdownDefaultLabel5: "Angazhimi Publik", detailsRecentActivities: "Aktivitetet e Fundit", tableHeaderDate: "Data", tableHeaderActivity: "Aktiviteti", tableHeaderStatus: "Statusi", tableStatusCompleted: "E Përfunduar", tableStatusInProgress: "Në Progres", tableNoRecentActivities: "Nuk ka aktivitete të fundit për të shfaqur.", tableNoDataToDisplay: "Nuk ka të dhëna për të shfaqur për filtrat aktualë.", notificationLangSwitchPrefix: "Gjuha u ndryshua në", notificationFiltersApplied: "Filtrat u aplikuan", notificationFiltersReset: "Filtrat janë rivendosur.", notificationComparisonEnabled: "Pamja e krahasimit u aktivizua", notificationComparisonDisabled: "Pamja e krahasimit u çaktivizua", notificationExportingPrefix: "Duke eksportuar të dhënat si", notificationSortedByPrefix: "Renditur sipas", tooltipClickForDetails: "Kliko për detaje", tooltipScoreSuffix: "Pikët", categoryLabel: "Kategoria", ministerLabel: "Ministri", tooltipKeyMembers: "Anëtarët Kryesorë", optionNoComparison: "Pa Krahasim", optionAllMinistries: "Të gjitha Ministritë", loadingData: "Duke ngarkuar të dhënat...", errorFetchingData: "Gabim gjatë marrjes së të dhënave. Ju lutemi provoni përsëri.", noChangeData: "- Nuk ka të dhëna për ndryshim", footerAboutTitle: "Rreth Pulsit Publik", footerAboutText: "Monitorimi i transparencës dhe performancës së institucioneve të Kosovës për të nxitur llogaridhënien dhe angazhimin qytetar. Misioni ynë është të ofrojmë qytetarëve të dhëna të besueshme.", footerQuickLinksTitle: "Linqe të Shpejta", footerContactUs: "Na Kontaktoni", footerPrivacyPolicy: "Politika e Privatësisë", footerContactInfoTitle: "Informacion Kontakti", footerAddress: "Qendra e Teknologjisë Qytetare, Prishtinë, Kosovë", footerFollowUsTitle: "Na Ndiqni", footerCopyright: "Pulsi Publik Kosovë. Të gjitha të drejtat e rezervuara.", categoryEconomic: "Ekonomike", categoryGovernance: "Qeverisjes", categorySocial: "Sociale", categoryInfrastructure: "Infrastrukturës",
            "activityPrefixPublicEvent": "Ngjarje Publike: ", "activityPrefixReportRelease": "Publikim Raporti: ", "activityPrefixNewInitiative": "Nismë e Re: ", "activityPrefixConsultationDocument": "Dokument Konsultimi: ",
            "pmoName": "Zyra e Kryeministrit", "primeMinisterLabel": "Kryeministri",
            "periodQ2_2023": "T2 2023", "periodQ1_2023": "T1 2023", "periodQ4_2022": "T4 2022", "periodQ3_2022": "T3 2022", "periodAnnual_2022": "Vjetor 2022",
            "periodQ1_2023_compare": "T1 2023", "periodQ4_2022_compare": "T4 2022", "periodQ2_2022_yoy": "T2 2022 (VnM)", "periodAnnual_2022_compare": "Vjetor 2022"
        },
        sr: { /* ... Your full Serbian translations ... */ days: "dana", headerTitle: "Javni Puls", headerSubtitle: "Građanski Monitor Kosova", languageEN: "Engleski (EN)", languageSQ: "Albanski (SQ)", languageSR: "Srpski (SR)", userMenuProfile: "Profil", userMenuSettings: "Podešavanja", userMenuSignOut: "Odjavi se", sidebarMainNavigation: "GLAVNA NAVIGACIJA", sidebarDashboard: "Kontrolna tabla", sidebarReports: "Izveštaji", sidebarInstitutions: "Institucije", sidebarDocuments: "Dokumenti", sidebarEvents: "Događaji", sidebarAnalytics: "ANALITIKA", sidebarTrends: "Trendovi", sidebarRegionalData: "Regionalni Podaci", sidebarExportData: "Izvezi Podatke", breadcrumbDashboard: "Kontrolna tabla", breadcrumbPublicPulse: "Javni Puls", pageTitle: "Kontrolna tabla Javni Puls", pageSubtitle: "Praćenje transparentnosti i učinka kosovskih institucija", kpiAvgTransparency: "Prosečna Transparentnost", kpiParticipationScore: "Ocena Učešća", kpiEfficiencyRating: "Ocena Efikasnosti", kpiOverallOutcome: "Ukupni Ishod", kpiChangeSinceLastQuarter: "od prošlog kvartala", filtersTitle: "Interaktivni Filteri", filtersReset: "Resetuj Filtere", filtersExport: "Izvezi", filtersExportPDF: "Izvezi kao PDF", filtersExportExcel: "Izvezi kao Excel", filtersExportCSV: "Izvezi kao CSV", filtersExportImage: "Izvezi kao Sliku", filtersTimePeriod: "Vremenski Period", filtersCompareWith: "Uporedi Sa", filtersMinistryType: "Tip Ministarstva", filtersScoreRange: "Raspon Ocena", filtersSearchMinistry: "Pretraži Ministarstvo", filtersSearchPlaceholder: "Kucaj za pretragu...", filtersApply: "Primeni Filtere", filtersShowComparison: "Prikaži poređenje", tabTransparency: "Transparentnost", tabParticipation: "Učešće", tabEfficiency: "Efikasnost", tabOutcome: "Ishod", viewTitleSuffix: " Rezultati", legendHigh: "Visoko (>70)", legendMedium: "Srednje (40-70)", legendLow: "Nisko (<40)", legendSortBy: "Sortiraj po", sortHighestScore: "Najviša Ocena", sortLowestScore: "Najniža Ocena", sortNameAZ: "Naziv (A-Z)", sortNameZA: "Naziv (Z-A)", detailsTitle: "Detalji Ministarstva", detailsTransparencyScore: "Ocena Transparentnosti", detailsInfoRequests: "Zahtevi za Informacije", infoRequestsProcessed: "obrađeno", detailsResponseTime: "Vreme Odgovora", daysUnit: "dana", detailsChangeSinceLastPeriod: "od prethodnog perioda", detailsPerfBreakdown: "Analiza Performansi", perfBreakdownWebsiteTransparency: "Transparentnost Veb Sajta", perfBreakdownDocAccessibility: "Dostupnost Dokumenata", perfBreakdownReqResponsiveness: "Odaziv na Zahteve", perfBreakdownInfoCompleteness: "Potpunost Informacija", perfBreakdownPublicEngagement: "Javno Angažovanje", perfBreakdownDefaultLabel1: "Transparentnost Veb Sajta", perfBreakdownDefaultLabel2: "Dostupnost Dokumenata", perfBreakdownDefaultLabel3: "Odaziv na Zahteve", perfBreakdownDefaultLabel4: "Potpunost Informacija", perfBreakdownDefaultLabel5: "Javno Angažovanje", detailsRecentActivities: "Nedavne Aktivnosti", tableHeaderDate: "Datum", tableHeaderActivity: "Aktivnost", tableHeaderStatus: "Status", tableStatusCompleted: "Završeno", tableStatusInProgress: "U Toku", tableNoRecentActivities: "Nema nedavnih aktivnosti za prikaz.", tableNoDataToDisplay: "Nema podataka za prikaz za trenutne filtere.", notificationLangSwitchPrefix: "Jezik promenjen na", notificationFiltersApplied: "Filteri primenjeni", notificationFiltersReset: "Filteri su resetovani.", notificationComparisonEnabled: "Prikaz poređenja omogućen", notificationComparisonDisabled: "Prikaz poređenja onemogućen", notificationExportingPrefix: "Izvoz podataka kao", notificationSortedByPrefix: "Sortirano po", tooltipClickForDetails: "Klikni za detalje", tooltipScoreSuffix: "Ocena", categoryLabel: "Kategorija", ministerLabel: "Ministar", tooltipKeyMembers: "Ključni Članovi", optionNoComparison: "Bez Poređenja", optionAllMinistries: "Sva Ministarstva", loadingData: "Učitavanje podataka...", errorFetchingData: "Greška pri dohvatanju podataka. Molimo pokušajte ponovo.", noChangeData: "- Nema podataka o promeni", footerAboutTitle: "O Javnom Pulsu", footerAboutText: "Praćenje transparentnosti i učinka kosovskih institucija radi podsticanja odgovornosti i građanskog angažovanja. Naša misija je da građanima pružimo pouzdane podatke.", footerQuickLinksTitle: "Brzi Linkovi", footerContactUs: "Kontaktirajte Nas", footerPrivacyPolicy: "Politika Privatnosti", footerContactInfoTitle: "Kontakt Informacije", footerAddress: "Hab za Građansku Tehniku, Priština, Kosovo", footerFollowUsTitle: "Pratite Nas", footerCopyright: "Javni Puls Kosovo. Sva prava zadržana.", categoryEconomic: "Ekonomske", categoryGovernance: "Upravljanja", categorySocial: "Socijalne", categoryInfrastructure: "Infrastrukturne",
            "activityPrefixPublicEvent": "Javni Događaj: ", "activityPrefixReportRelease": "Objavljivanje Izveštaja: ", "activityPrefixNewInitiative": "Nova Inicijativa: ", "activityPrefixConsultationDocument": "Konsultacioni Dokument: ",
            "pmoName": "Kancelarija Premijera", "primeMinisterLabel": "Premijer",
            "periodQ2_2023": "Q2 2023", "periodQ1_2023": "Q1 2023", "periodQ4_2022": "Q4 2022", "periodQ3_2022": "Q3 2022", "periodAnnual_2022": "Godišnji 2022",
            "periodQ1_2023_compare": "Q1 2023", "periodQ4_2022_compare": "Q4 2022", "periodQ2_2022_yoy": "Q2 2022 (GnG)", "periodAnnual_2022_compare": "Godišnji 2022"
        }
    };

    function getTranslation(key, lang = currentLang, fallbackLang = 'en') { return translations[lang]?.[key] || translations[fallbackLang]?.[key] || key; }
    function capitalizeFirstLetter(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
    function debounce(func, delay) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }
    
    function updateAllUIText(lang) {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            const trans = getTranslation(key, lang);
            if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
                el.placeholder = trans;
            } else if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
                el.value = trans;
            } else {
                el.textContent = trans;
            }
        });
        if (currentLanguageSpan) currentLanguageSpan.textContent = lang.toUpperCase();
        updateDynamicTitles(lang);
        if (typeof populateCompareWithDropdown === "function" && allMinistriesData) {
            populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
        }
    }

    function updateDynamicTitles(lang = currentLang) { if (currentViewTitle) { const pillarName = getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`, lang); currentViewTitle.textContent = `${pillarName} ${getTranslation('viewTitleSuffix', lang)}`; } if (ministryBarChart?.options?.plugins?.tooltip) { ministryBarChart.data.datasets[0].label = `${getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`)} ${getTranslation('tooltipScoreSuffix')}`; ministryBarChart.update('none'); } }
    function updateKPICards(summary) { const map = { avgTransparency: { V: kpiElements.avgTransparencyValue, C: kpiElements.avgTransparencyChange, k: 'avgTransparency' }, participationScore: { V: kpiElements.participationScoreValue, C: kpiElements.participationScoreChange, k: 'participationScore' }, efficiencyRating: { V: kpiElements.efficiencyRatingValue, C: kpiElements.efficiencyRatingChange, k: 'efficiencyRating' }, overallOutcome: { V: kpiElements.overallOutcomeValue, C: kpiElements.overallOutcomeChange, k: 'overallOutcome' } }; for (const key in map) { const el = map[key]; if (el.V) { const data = summary?.[el.k]; el.V.textContent = (data?.value !== null && data?.value !== undefined) ? `${data.value.toFixed(1)}%` : 'N/A'; if (el.C) { el.C.innerHTML = ''; let iClass = 'fas fa-minus text-gray-500', tCol = 'text-gray-500', txt = getTranslation('noChangeData'); if (data?.change !== null && data?.change !== undefined) { const val = parseFloat(data.change); if (val > 0) { iClass = 'fas fa-arrow-up text-green-500'; tCol = 'text-green-500'; } else if (val < 0) { iClass = 'fas fa-arrow-down text-red-500'; tCol = 'text-red-500'; } txt = `${Math.abs(val).toFixed(1)}% ${getTranslation('kpiChangeSinceLastQuarter')}`; } const i = document.createElement('i'); i.className = `${iClass} mr-1`; el.C.appendChild(i); const s = document.createElement('span'); s.className = tCol; s.textContent = txt; el.C.appendChild(s); } } } }

    function populateMinistryDetails(detailsData) {
        console.log("SCRIPT.JS: populateMinistryDetails called with data:", detailsData);
        if (!ministryDetailsSection) { console.error("SCRIPT.JS: CRITICAL - ministryDetailsSection is NULL!"); return; }
        if (detailsData?.kpis) { console.log("SCRIPT.JS: DEBUG - Details KPIs object received:", JSON.stringify(detailsData.kpis, null, 2)); }

        if (!detailsData) {
            ministryDetailsSection.classList.add('hidden');
            if(selectedMinistryNameTitle) selectedMinistryNameTitle.textContent = getTranslation('detailsTitle');
            if(detailTransparencyScore) detailTransparencyScore.textContent = 'N/A';
            if(detailTransparencyChange) { detailTransparencyChange.textContent = getTranslation('noChangeData'); detailTransparencyChange.className = 'text-xs text-gray-500'; }
            if(detailRequests) detailRequests.textContent = 'N/A';
            if(detailRequestsProcessed) detailRequestsProcessed.innerHTML = 'N/A';
            if(detailResponseTime) detailResponseTime.innerHTML = 'N/A';
            if(detailResponseTimeChange) { detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500'; }
            if (perfBreakdownElements) { for (let i = 1; i <= 5; i++) { if (perfBreakdownElements[`label${i}`]) { perfBreakdownElements[`label${i}`].textContent = getTranslation(`perfBreakdownDefaultLabel${i}`); if(perfBreakdownElements[`value${i}`]) perfBreakdownElements[`value${i}`].textContent = `0%`; if(perfBreakdownElements[`bar${i}`]) perfBreakdownElements[`bar${i}`].style.width = `0%`; } } }
            if (recentActivitiesBody) recentActivitiesBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${getTranslation('tableNoRecentActivities')}</td></tr>`;
            return;
        }

        const { profile, kpis, performanceBreakdown, activities } = detailsData;

        if (selectedMinistryNameTitle && profile) {
            selectedMinistryNameTitle.textContent = profile.name || getTranslation('detailsTitle');
            if (ministryDetailsSection && profile.id !== undefined) ministryDetailsSection.dataset.currentMinistryId = profile.id;
        }

        if (kpis) {
            if (detailTransparencyScore) {
                if (kpis.transparencyScore?.value !== null && kpis.transparencyScore?.value !== undefined) {
                    detailTransparencyScore.textContent = `${parseFloat(kpis.transparencyScore.value).toFixed(1)}%`;
                    if (detailTransparencyChange) {
                        if (kpis.transparencyScore?.change !== null && kpis.transparencyScore?.change !== undefined) {
                            const chg = parseFloat(kpis.transparencyScore.change);
                            const pfx = chg === 0 ? '' : (chg > 0 ? '↑ +' : '↓ ');
                            detailTransparencyChange.textContent = `${pfx}${Math.abs(chg).toFixed(1)}% ${getTranslation('detailsChangeSinceLastPeriod')}`;
                            detailTransparencyChange.className = chg === 0 ? 'text-xs text-gray-500' : (chg > 0 ? 'text-xs text-green-500' : 'text-xs text-red-500');
                        } else { detailTransparencyChange.textContent = getTranslation('noChangeData'); detailTransparencyChange.className = 'text-xs text-gray-500'; }
                    }
                } else {
                    detailTransparencyScore.textContent = 'N/A';
                    if (detailTransparencyChange) { detailTransparencyChange.textContent = getTranslation('noChangeData'); detailTransparencyChange.className = 'text-xs text-gray-500';}
                }
            }
            if (detailRequests && detailRequestsProcessed) {
                if (kpis.infoRequests && kpis.infoRequests.received !== null && kpis.infoRequests.received !== undefined) {
                    const ir = kpis.infoRequests; const receivedNum = parseFloat(ir.received);
                    detailRequests.textContent = !isNaN(receivedNum) ? receivedNum.toFixed(0) : 'N/A';
                    if (ir.processed !== null && ir.processed !== undefined) {
                        const processedNum = parseFloat(ir.processed); let subText = 'N/A';
                        if (!isNaN(receivedNum) && !isNaN(processedNum)) {
                            let percentageProcessedStr = '';
                            if (typeof ir.percentage_processed === 'number' && !isNaN(parseFloat(ir.percentage_processed))) {
                                percentageProcessedStr = ` (${parseFloat(ir.percentage_processed).toFixed(1)}%)`;
                            } else if (receivedNum > 0) { const percentage = (processedNum / receivedNum) * 100; percentageProcessedStr = ` (${percentage.toFixed(1)}%)`;
                            } else if (processedNum === 0 && receivedNum === 0) { percentageProcessedStr = ` (0.0%)`;
                            } else { percentageProcessedStr = ` (N/A%)`; }
                            const icon = `<svg class="w-4 h-4 text-green-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`;
                            subText = icon + `${processedNum.toFixed(0)} ${getTranslation('infoRequestsProcessed')}${percentageProcessedStr}`;
                        } detailRequestsProcessed.innerHTML = subText;
                    } else { detailRequestsProcessed.innerHTML = 'N/A'; }
                } else { detailRequests.textContent = 'N/A'; detailRequestsProcessed.innerHTML = 'N/A'; }
            } else { if(detailRequests) detailRequests.textContent = 'N/A'; if(detailRequestsProcessed) detailRequestsProcessed.innerHTML = 'N/A'; }
            if (detailResponseTime && detailResponseTimeChange) {
                if (kpis.responseTime && kpis.responseTime.value !== null && kpis.responseTime.value !== undefined) {
                    const rt = kpis.responseTime; const valueNum = parseFloat(rt.value);
                    const unit = getTranslation(rt.unit || 'daysUnit') || (rt.unit || getTranslation('days', 'en'));
                    detailResponseTime.innerHTML = !isNaN(valueNum) ? `${valueNum.toFixed(1)} <span class="text-base font-normal text-gray-500">${unit}</span>` : 'N/A';
                    if (rt.change !== null && rt.change !== undefined) {
                        const changeNum = parseFloat(rt.change);
                        if (!isNaN(changeNum)) {
                            const pfx = changeNum === 0 ? '' : (changeNum > 0 ? '↑ +' : '↓ ');
                            detailResponseTimeChange.textContent = `${pfx}${Math.abs(changeNum).toFixed(1)} ${unit} ${getTranslation('detailsChangeSinceLastPeriod')}`;
                            detailResponseTimeChange.className = changeNum === 0 ? 'text-xs text-gray-500' : (changeNum > 0 ? 'text-xs text-red-500' : 'text-xs text-green-500');
                        } else { detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500'; }
                    } else { detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500'; }
                } else { detailResponseTime.innerHTML = 'N/A'; detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500'; }
            } else { if(detailResponseTime) detailResponseTime.innerHTML = 'N/A'; if(detailResponseTimeChange) { detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500'; } }
        }  else {
            if(detailTransparencyScore) detailTransparencyScore.textContent = 'N/A'; if(detailTransparencyChange) { detailTransparencyChange.textContent = getTranslation('noChangeData'); detailTransparencyChange.className = 'text-xs text-gray-500';}
            if(detailRequests) detailRequests.textContent = 'N/A'; if(detailRequestsProcessed) detailRequestsProcessed.innerHTML = 'N/A';
            if(detailResponseTime) detailResponseTime.innerHTML = 'N/A'; if(detailResponseTimeChange) { detailResponseTimeChange.textContent = getTranslation('noChangeData'); detailResponseTimeChange.className = 'text-xs text-gray-500';}
        }

        if (perfBreakdownElements && performanceBreakdown && Array.isArray(performanceBreakdown)) {
            for (let i = 0; i < 5; i++) {
                const item = performanceBreakdown[i];
                if (perfBreakdownElements[`label${i+1}`]) {
                    if (item?.labelKey) {
                        perfBreakdownElements[`label${i+1}`].textContent = getTranslation(item.labelKey);
                        if(perfBreakdownElements[`value${i+1}`]) perfBreakdownElements[`value${i+1}`].textContent = `${(item.value !== null && item.value !== undefined) ? parseFloat(item.value).toFixed(0) : 0}%`;
                        if(perfBreakdownElements[`bar${i+1}`]) perfBreakdownElements[`bar${i+1}`].style.width = `${(item.value !== null && item.value !== undefined) ? parseFloat(item.value).toFixed(0) : 0}%`;
                    } else {
                        perfBreakdownElements[`label${i+1}`].textContent = getTranslation(`perfBreakdownDefaultLabel${i+1}`);
                        if(perfBreakdownElements[`value${i+1}`]) perfBreakdownElements[`value${i+1}`].textContent = `0%`;
                        if(perfBreakdownElements[`bar${i+1}`]) perfBreakdownElements[`bar${i+1}`].style.width = `0%`;
                    }
                }
            }
        }

        const acts = detailsData.activities || detailsData.recentActivities;
        if (recentActivitiesBody) {
            recentActivitiesBody.innerHTML = '';
            if (acts && Array.isArray(acts) && acts.length > 0) {
                acts.forEach(act => {
                    const row = recentActivitiesBody.insertRow();
                    const dateText = (act && act.activity_date && String(act.activity_date).trim() !== "") ? act.activity_date : 'N/A';
                    row.insertCell().textContent = dateText;

                    let originalTitle = (act && act.title && String(act.title).trim() !== "") ? act.title : 'N/A';
                    let titleText = originalTitle; 
                    const knownPrefixes = [
                        { dbKey: "Public Event:", i18nKey: "activityPrefixPublicEvent" },
                        { dbKey: "Report Release:", i18nKey: "activityPrefixReportRelease" },
                        { dbKey: "New Initiative:", i18nKey: "activityPrefixNewInitiative" },
                        { dbKey: "Consultation Document:", i18nKey: "activityPrefixConsultationDocument" },
                        { dbKey: "National Directive:", i18nKey: "activityPrefixNationalDirective" }, 
                        { dbKey: "Cabinet Meeting Summary:", i18nKey: "activityPrefixCabinetMeeting" }, 
                        { dbKey: "Press Conference:", i18nKey: "activityPrefixPressConference" } 
                    ];
                    for (const p of knownPrefixes) {
                        if (originalTitle.startsWith(p.dbKey)) {
                            let translatedPrefix = getTranslation(p.i18nKey); 
                            let restOfTitle = originalTitle.substring(p.dbKey.length);
                            if (!translatedPrefix.endsWith(' ')) { translatedPrefix += ' '; }
                            if (restOfTitle.startsWith(' ')) { restOfTitle = restOfTitle.substring(1); }
                            titleText = translatedPrefix + restOfTitle;
                            break; 
                        }
                    }
                    row.insertCell().textContent = titleText;

                    const statusCell = row.insertCell();
                    const statusSpan = document.createElement('span');
                    let statusText = (act && act.status && String(act.status).trim() !== "") ? act.status : getTranslation('tableStatusCompleted'); 
                    let statusClasses = 'bg-green-100 text-green-800';
                    if (statusText.toLowerCase() === getTranslation('tableStatusInProgress', currentLang).toLowerCase()) {
                        statusClasses = 'bg-yellow-100 text-yellow-800';
                    }
                    statusSpan.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}`;
                    statusSpan.textContent = statusText; 
                    statusCell.appendChild(statusSpan);
                });
            } else {
                const row = recentActivitiesBody.insertRow(); const cell = row.insertCell(); cell.colSpan = 3;
                cell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center';
                cell.textContent = getTranslation('tableNoRecentActivities');
            }
        }
        if(ministryDetailsSection) ministryDetailsSection.classList.remove('hidden');
    }

    function showLoadingIndicator(isLoading) { if (isLoading) { if (chartContainer) { const canvas = chartContainer.querySelector('canvas#ministryScoreChart'); if (!canvas) chartContainer.innerHTML = `<p class="text-center p-4">${getTranslation('loadingData')}</p>`; } } }
    function showNotification(msgKey, isKey = true) { const msg = isKey ? getTranslation(msgKey) : msgKey; const banner = document.getElementById('notificationBanner'); const notifMsg = document.getElementById('notificationMessage'); if (banner && notifMsg) { notifMsg.textContent = msg; banner.classList.remove('hidden'); if (currentNotificationTimeout) clearTimeout(currentNotificationTimeout); currentNotificationTimeout = setTimeout(() => banner.classList.add('hidden'), 3000); } }

    function renderChart(data) {
        if (!chartContainer) return;
        chartContainer.innerHTML = '';
        if (!data || !data.length) {
            chartContainer.innerHTML = `<p class="text-center p-4 text-gray-500">${getTranslation('tableNoDataToDisplay')}</p>`;
            if (ministryBarChart) { ministryBarChart.destroy(); ministryBarChart = null; }
            return;
        }
        const canvas = document.createElement('canvas'); canvas.id = 'ministryScoreChart';
        const numItems = data.length; canvas.height = Math.max(300, (numItems * 30) + 50);
        chartContainer.appendChild(canvas); const ctx = canvas.getContext('2d');
        if (!ctx) { chartContainer.innerHTML = `<p class="text-center text-red-500 p-4">Error creating canvas.</p>`; if (ministryBarChart) { ministryBarChart.destroy(); ministryBarChart = null; } return; }
        const labels = data.map(m => m.name); const scores = data.map(m => m.score);
        console.log("SCRIPT.JS: Scores array for chart:", scores);
        const HIGH_SCORE_THRESHOLD = 70; const MEDIUM_SCORE_THRESHOLD = 40;
        const COLOR_HIGH_BG = 'rgba(75,192,192,0.7)'; const COLOR_HIGH_BD = 'rgba(75,192,192,1)';
        const COLOR_MEDIUM_BG = 'rgba(255,206,86,0.7)'; const COLOR_MEDIUM_BD = 'rgba(255,206,86,1)';
        const COLOR_LOW_RED_BG = 'rgba(255, 99, 132, 0.7)'; const COLOR_LOW_RED_BD = 'rgba(255, 99, 132, 1)';
        const COLOR_NA_BG = 'rgba(200,200,200,0.7)'; const COLOR_NA_BD = 'rgba(200,200,200,1)';
        const bgColors = scores.map(s => { if (s === null || s === undefined || isNaN(parseFloat(s))) return COLOR_NA_BG; if (s >= HIGH_SCORE_THRESHOLD) return COLOR_HIGH_BG; if (s >= MEDIUM_SCORE_THRESHOLD) return COLOR_MEDIUM_BG; return COLOR_LOW_RED_BG; });
        const bdColors = scores.map(s => { if (s === null || s === undefined || isNaN(parseFloat(s))) return COLOR_NA_BD; if (s >= HIGH_SCORE_THRESHOLD) return COLOR_HIGH_BD; if (s >= MEDIUM_SCORE_THRESHOLD) return COLOR_MEDIUM_BD; return COLOR_LOW_RED_BD; });
        if (ministryBarChart) ministryBarChart.destroy();
        try {
            ministryBarChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: `${getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`)} ${getTranslation('tooltipScoreSuffix')}`, data: scores, backgroundColor: bgColors, borderColor: bdColors, borderWidth: 1 }] },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    scales: {x: {beginAtZero: true,max: 100,title: { display: true, text: getTranslation('tooltipScoreSuffix') }},y: {ticks: { autoSkip: false, font: { size: 10 } }}},
                    onClick: (evt, elems) => {
                        console.log("SCRIPT.JS: Chart bar click event:", evt); console.log("SCRIPT.JS: Chart bar click elements:", elems);
                        if (elems && elems.length > 0) {
                            const clickedElement = elems[0]; const itemIndex = clickedElement.index; const item = data[itemIndex]; 
                            console.log("SCRIPT.JS: Chart bar clicked for item:", item);
                            if (item && typeof item.id !== 'undefined') {
                                console.log("SCRIPT.JS: Item ID found:", item.id); console.log("SCRIPT.JS: Checking ministryDetailsSection in onClick. Is it defined?", !!ministryDetailsSection);
                                if (ministryDetailsSection) { ministryDetailsSection.classList.remove('hidden'); ministryDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); console.log("SCRIPT.JS: Ministry details section shown and scrolled into view.");
                                } else { console.warn("SCRIPT.JS: ministryDetailsSection is not defined in onClick, cannot show/scroll."); }
                                const period = document.getElementById('timePeriod')?.value || 'q2-2023';
                                loadAndRenderMinistryDetails(item.id, period);
                            } else { console.warn("SCRIPT.JS: Chart bar clicked, but item or item.id is undefined. Item:", item); }
                        } else { console.log("SCRIPT.JS: Chart click detected, but no specific bar element was identified."); }
                    },
                    plugins: {
                        legend: {display: false},
                        tooltip: { enabled: true, callbacks: {
                                title: (items) => data[items[0].dataIndex].name || '',
                                label: (ctx) => `${ctx.dataset.label || ''}: ${ctx.parsed.x?.toFixed(1) ?? 'N/A'}`,
                                afterBody: (items) => { const m = data[items[0].dataIndex]; let dets = []; if (m?.category_key) dets.push(`${getTranslation('categoryLabel')||'Category'}: ${getTranslation(`category${capitalizeFirstLetter(m.category_key)}`)||capitalizeFirstLetter(m.category_key)}`); if (m?.minister_name) dets.push(`${getTranslation('ministerLabel')||'Minister'}: ${m.minister_name}`); if (m?.cabinet_members?.length) { dets.push(''); dets.push(`${getTranslation('tooltipKeyMembers')||'Key Members'}:`); m.cabinet_members.forEach(mem => { if (mem?.trim()) dets.push(`- ${mem}`); });} dets.push(''); dets.push(`(${getTranslation('tooltipClickForDetails')})`); return dets;}
                            }
                        },
                        datalabels: { 
                            anchor: 'end', align: 'right', offset: 4,
                            color: function(context) { const score = context.dataset.data[context.dataIndex]; if (score === null || score === undefined || isNaN(parseFloat(score))) return '#666666'; if (score >= HIGH_SCORE_THRESHOLD) return '#333333'; if (score >= MEDIUM_SCORE_THRESHOLD) return '#333333'; return '#FFFFFF'; },
                            font: {weight: 'bold',size: 10,},
                            formatter: function(value) {return (value !== null && value !== undefined && !isNaN(parseFloat(value))) ? parseFloat(value).toFixed(1) : 'N/A';}
                        }
                    }
                }
            });
        } catch (e) { console.error("SCRIPT.JS: Chart instantiation ERROR:", e); chartContainer.innerHTML = `<p class="text-center tc-r-500 p-4">Chart error: ${e.message}</p>`;}
    }

    function applyFiltersAndSort() {
        let fDataFull = [...allMinistriesData]; 
        let pmoItem = null;
        const PMO_ID = 0;

        const pmoIndexInFull = fDataFull.findIndex(m => m.id === PMO_ID);
        if (pmoIndexInFull > -1) {
            pmoItem = fDataFull.splice(pmoIndexInFull, 1)[0];
        }

        let fData = [...fDataFull]; 

        const sTerm = document.getElementById('searchMinistryInput')?.value.toLowerCase() || '';
        if (sTerm) { fData = fData.filter(m => (m.name || '').toLowerCase().includes(sTerm)); }

        const mType = document.getElementById('ministryTypeFilter')?.value || 'all';
        if (mType !== 'all') { fData = fData.filter(m => m.category_key === mType); }
        
        const compareWithValue = document.getElementById('compareWithFilter')?.value;
        if (compareWithValue && compareWithValue !== 'no-comparison' && compareWithValue !== 'all') {
            const compareToId = parseInt(compareWithValue);
            if (!isNaN(compareToId)) {
                console.log("SCRIPT.JS: 'Compare With' filter active for ID:", compareToId, "- Implement actual comparison data filtering or fetching.");
            }
        }

        const minScoreVal = document.getElementById('minScoreFilter')?.value;
        const maxScoreVal = document.getElementById('maxScoreFilter')?.value;
        const minS = (minScoreVal !== "" && !isNaN(parseFloat(minScoreVal))) ? parseFloat(minScoreVal) : 0;
        const maxS = (maxScoreVal !== "" && !isNaN(parseFloat(maxScoreVal))) ? parseFloat(maxScoreVal) : 100;
        
        fData = fData.filter(m => {
            const s = m.score;
            if (s === null || s === undefined || isNaN(parseFloat(s))) return false; 
            return parseFloat(s) >= minS && parseFloat(s) <= maxS;
        });

        switch (currentSortGlobal) {
            case 'score-desc': fData.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)); break;
            case 'score-asc': fData.sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity)); break;
            case 'name-asc': fData.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
            case 'name-desc': fData.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
            default: fData.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        }

        if (pmoItem) { 
            let pmoShouldBeVisible = true;
            if (sTerm && !(pmoItem.name || '').toLowerCase().includes(sTerm)) {
                pmoShouldBeVisible = false;
            }
            const pmoScore = pmoItem.score;
            if (pmoScore === null || pmoScore === undefined || isNaN(parseFloat(pmoScore)) || !(parseFloat(pmoScore) >= minS && parseFloat(pmoScore) <= maxS) ) {
                if (!(minS === 0 && maxS === 100 && (pmoScore !== null && pmoScore !== undefined && !isNaN(parseFloat(pmoScore))))) {
                    pmoShouldBeVisible = false;
                }
            }
            if (mType !== 'all' && pmoItem.category_key !== mType) {
                pmoShouldBeVisible = false;
            }

            if(pmoShouldBeVisible) {
                fData.unshift(pmoItem);
            }
        }
        
        renderChart(fData);
        console.log("SCRIPT.JS: Filters and sort applied. Chart updated. PMO handled.");
    }
    
    function populateCompareWithDropdown(ministries, selectedValue) {
        const compareWithSel = document.getElementById('compareWithFilter');
        if (!compareWithSel) return;

        const currentSelection = selectedValue || compareWithSel.value; 
        
        let optionsHtml = `<option value="no-comparison" data-i18n-key="optionNoComparison">${getTranslation('optionNoComparison')}</option>`;
        
        compareWithSel.innerHTML = optionsHtml;
                                             
        compareWithSel.querySelectorAll('option[data-i18n-key]').forEach(opt => {
            const key = opt.getAttribute('data-i18n-key');
            opt.textContent = getTranslation(key);
        });
        
        if (currentSelection) { 
            compareWithSel.value = currentSelection;
        }
    }

    async function fetchDashboardData(pillar, lang, period) { 
        showLoadingIndicator(true); 
        if(ministryDetailsSection) ministryDetailsSection.classList.add('hidden'); 
        const cacheKey = `${pillar}-${lang}-${period}`; 
        
        if(apiDataCache.dashboard[cacheKey]){ 
            console.log("SCRIPT.JS: Using cached dashboard data for key:", cacheKey);
            updateKPICards(apiDataCache.dashboard[cacheKey].kpi_summary); 
            allMinistriesData = apiDataCache.dashboard[cacheKey].ministries || []; 
            populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            applyFiltersAndSort(); 
            showLoadingIndicator(false); 
            return; 
        } 
        console.log("SCRIPT.JS: Fetching NEW dashboard data for key:", cacheKey);
        try { 
            const url = `${API_BASE_URL}/dashboard_data?pillar=${pillar}&lang=${lang}&period=${period}`; 
            console.log("SCRIPT.JS: Fetching dashboard data from URL:", url);
            const resp = await fetch(url); 
            if(!resp.ok){ const errTxt = await resp.text(); throw new Error(`HTTP error! ${resp.status}, ${errTxt}`); } 
            const data = await resp.json(); 
            if(!data||typeof data.kpi_summary==='undefined'||typeof data.ministries==='undefined'){ 
                console.warn("SCRIPT.JS: Fetched dashboard data, but structure is unexpected or empty.", data);
                updateKPICards(null); 
                allMinistriesData=[]; 
            } else { 
                apiDataCache.dashboard[cacheKey]=data; 
                updateKPICards(data.kpi_summary); 
                allMinistriesData=data.ministries||[]; 
            } 
            populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            applyFiltersAndSort(); 
        } catch(e){ 
            console.error('SCRIPT.JS: Dashboard fetch error:', e); 
            if(chartContainer) chartContainer.innerHTML = `<p class="text-red-500 text-center p-4">${getTranslation('errorFetchingData')}</p>`; 
            updateKPICards(null); 
            allMinistriesData=[]; 
            populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            applyFiltersAndSort(); 
        } finally { 
            showLoadingIndicator(false); 
        } 
    }
    async function loadAndRenderMinistryDetails(id, period) {
        console.log(`SCRIPT.JS: loadAndRenderMinistryDetails called for id: ${id}, period: ${period}`); 
        showLoadingIndicator(true); 
        const cacheKey = `${id}-${currentLang}-${period}`; 
        if(apiDataCache.details[cacheKey]){ 
            console.log("SCRIPT.JS: Found ministry details in cache. Populating for key:", cacheKey);
            populateMinistryDetails(apiDataCache.details[cacheKey]); 
            showLoadingIndicator(false); return; 
        } 
        console.log("SCRIPT.JS: Fetching NEW ministry details for key:", cacheKey);
        try { 
            const url = `${API_BASE_URL}/ministry_details/${id}?lang=${currentLang}&period=${period}`; 
            console.log("SCRIPT.JS: Fetching ministry details from URL:", url);
            const resp = await fetch(url); 
            if(!resp.ok){ 
                const errTxt = await resp.text(); 
                console.error(`SCRIPT.JS: HTTP error fetching ministry details! Status: ${resp.status}, Text: ${errTxt}`); 
                populateMinistryDetails(null); 
                throw new Error(`HTTP error! ${resp.status}, ${errTxt}`); 
            } 
            const data = await resp.json(); 
            console.log("SCRIPT.JS: Successfully fetched ministry details:", data); 
            if(!data){ 
                console.warn("SCRIPT.JS: Fetched ministry details, but data is null/empty. Clearing details."); 
                populateMinistryDetails(null); 
            } else { 
                apiDataCache.details[cacheKey]=data; 
                populateMinistryDetails(data); 
            } 
        } catch(e){ 
            console.error('SCRIPT.JS: Ministry details fetch/processing error:', e); 
            if(selectedMinistryNameTitle)selectedMinistryNameTitle.textContent=getTranslation('errorFetchingData'); 
            populateMinistryDetails(null); 
        } finally { 
            showLoadingIndicator(false); 
        }
    }
    function setLanguage(lang) { 
        if(lang !== currentLang){ 
            currentLang=lang; 
            updateAllUIText(lang); 
            
            showNotification(`${getTranslation('notificationLangSwitchPrefix')} ${getTranslation(`language${lang.toUpperCase()}`)}`); 
            const period = document.getElementById('timePeriod')?.value || 'q2-2023'; 
            fetchDashboardData(currentPillar,currentLang,period); 
                                                              
            if(ministryDetailsSection && !ministryDetailsSection.classList.contains('hidden')){ 
                const mId = ministryDetailsSection.dataset.currentMinistryId; 
                if(mId !== undefined && mId !== null) loadAndRenderMinistryDetails(parseInt(mId), period);
            } 
        } 
    }
    
    function setupEventListeners() {
        if (languageSelectorButton && languageDropdown) {
            languageSelectorButton.addEventListener('click', (e) => { e.stopPropagation(); languageDropdown.classList.toggle('hidden'); });
            languageDropdown.addEventListener('click', (e) => { const opt = e.target.closest('a[data-lang]'); if (opt) { e.preventDefault(); setLanguage(opt.dataset.lang); languageDropdown.classList.add('hidden'); } });
        }
        document.addEventListener('click', (e) => {
            if (languageDropdown && !languageDropdown.classList.contains('hidden') && languageSelectorButton && !languageSelectorButton.contains(e.target) && !languageDropdown.contains(e.target)) languageDropdown.classList.add('hidden');
            const sortDd = document.getElementById('sortDropdown'); const sortBtn = document.getElementById('sortButton');
            if (sortDd && !sortDd.classList.contains('hidden') && sortBtn && !sortBtn.contains(e.target) && !sortDd.contains(e.target)) sortDd.classList.add('hidden');
        });
        pillarTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault(); const pillar = tab.dataset.tab;
                if (pillar && pillar !== currentPillar) {
                    currentPillar = pillar;
                    pillarTabs.forEach(t => t.classList.remove('tab-active','border-blue-600','text-blue-600'));
                    pillarTabs.forEach(t => t.classList.add('text-gray-500','hover:text-gray-700','hover:border-gray-300'));
                    tab.classList.add('tab-active','border-blue-600','text-blue-600');
                    tab.classList.remove('text-gray-500','hover:text-gray-700','hover:border-gray-300');
                    updateDynamicTitles();
                    const period = document.getElementById('timePeriod')?.value||'q2-2023';
                    fetchDashboardData(currentPillar,currentLang,period);
                }
            });
        });
        const applyBtn = document.getElementById('applyFiltersButton');
        if(applyBtn) {
            applyBtn.addEventListener('click', () => {
                console.log("SCRIPT.JS: Apply Filters button clicked.");
                applyFiltersAndSort();
                showNotification('notificationFiltersApplied',true);
            });
        }

        const periodSel = document.getElementById('timePeriod');
        if(periodSel) {
            periodSel.addEventListener('change', () => {
                console.log("SCRIPT.JS: Time Period filter changed.");
                const periodValue=periodSel.value;
                fetchDashboardData(currentPillar,currentLang,periodValue);
                if(ministryDetailsSection && !ministryDetailsSection.classList.contains('hidden')){
                    const mId=ministryDetailsSection.dataset.currentMinistryId;
                    if(mId !== undefined && mId !== null) loadAndRenderMinistryDetails(parseInt(mId), periodValue);
                }
            });
        }

        const searchIn = document.getElementById('searchMinistryInput');
        if(searchIn) {
            searchIn.addEventListener('input', debounce(() => {
                console.log("SCRIPT.JS: Search input changed.");
                applyFiltersAndSort();
            }, 300));
        }

        const ministryTypeSel = document.getElementById('ministryTypeFilter');
        if (ministryTypeSel) {
            ministryTypeSel.addEventListener('change', () => {
                console.log("SCRIPT.JS: Ministry Type filter changed to:", ministryTypeSel.value);
                applyFiltersAndSort();
            });
        }
 
        const compareWithSel = document.getElementById('compareWithFilter'); 
        if (compareWithSel) {
            compareWithSel.addEventListener('change', () => {
                console.log("SCRIPT.JS: Compare With filter changed to:", compareWithSel.value);
                applyFiltersAndSort(); 
            });
        }

        const minScoreIn = document.getElementById('minScoreFilter');
        const maxScoreIn = document.getElementById('maxScoreFilter');
        const handleScoreRangeChange = debounce(() => {
            console.log("SCRIPT.JS: Score Range filter changed (min:", minScoreIn?.value, ", max:", maxScoreIn?.value,")");
            applyFiltersAndSort();
        }, 500); 
        if (minScoreIn) { minScoreIn.addEventListener('input', handleScoreRangeChange); minScoreIn.addEventListener('change', handleScoreRangeChange); }
        if (maxScoreIn) { maxScoreIn.addEventListener('input', handleScoreRangeChange); maxScoreIn.addEventListener('change', handleScoreRangeChange); }

        const sortBtn = document.getElementById('sortButton');
        const sortDd = document.getElementById('sortDropdown');
        if(sortBtn && sortDd){
            sortBtn.addEventListener('click', (e) => { e.stopPropagation(); sortDd.classList.toggle('hidden'); });
            sortDd.addEventListener('click', (e) => {
                const opt = e.target.closest('.sortOption[data-sort]');
                if(opt){
                    e.preventDefault(); const sortVal = opt.dataset.sort;
                    if(sortVal){
                        currentSortGlobal = sortVal;
                        console.log("SCRIPT.JS: Sort option changed to:", currentSortGlobal);
                        applyFiltersAndSort();
                        sortDd.classList.add('hidden');
                        const parts = currentSortGlobal.split('-');
                        const key = `sort${capitalizeFirstLetter(parts[0])}${capitalizeFirstLetter(parts[1]||'')}`;
                        showNotification(`${getTranslation('notificationSortedByPrefix')} ${getTranslation(key)}`);
                    }
                }
            });
        }
        const closeBtn = document.getElementById('closeMinistryDetailsButton');
        if(closeBtn && ministryDetailsSection) {
            closeBtn.addEventListener('click', () => {
                ministryDetailsSection.classList.add('hidden');
                ministryDetailsSection.removeAttribute('data-current-ministry-id');
                if(chartContainer) chartContainer.scrollIntoView({behavior:'smooth',block:'nearest'});
            });
        }
    }
    
    // Initial Page Load Sequence
    updateAllUIText(currentLang); 
    const initialPeriod = document.getElementById('timePeriod')?.value || 'q2-2023'; 
    pillarTabs.forEach(tab => { if(tab.dataset.tab===currentPillar){ tab.classList.add('tab-active','border-blue-600','text-blue-600'); tab.classList.remove('text-gray-500','hover:text-gray-700','hover:border-gray-300'); } }); 
    updateDynamicTitles(); 
    fetchDashboardData(currentPillar, currentLang, initialPeriod)
        .then(() => {
            setupEventListeners(); 
            console.log("SCRIPT.JS DOMInit: Page initialization sequence complete.");
        })
        .catch(error => {
            console.error("SCRIPT.JS DOMInit: Error during initial data fetch:", error);
            setupEventListeners(); 
        });
    const yearSpan = document.getElementById('currentYear'); 
    if(yearSpan) yearSpan.textContent = new Date().getFullYear(); 
    
}); // End of DOMContentLoaded

if (!Element.prototype.matches) { Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector; }
if (!Element.prototype.closest) { Element.prototype.closest = function(s) { var el = this; do { if (Element.prototype.matches.call(el, s)) return el; el = el.parentElement || el.parentNode; } while (el !== null && el.nodeType === 1); return null; }; }
console.log("SCRIPT.JS: End of file reached. Script fully parsed (v_PMO_FROM_BACKEND).");
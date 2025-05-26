// pulsi_politik_frontend/script.js
// START: Initial Script Load Logging
console.log("MAIN_SCRIPT.JS: Top of file reached, script is loading.");
// END: Initial Script Load Logging

// START: DOMContentLoaded Event Listener
document.addEventListener('DOMContentLoaded', () => {
    // START: DOMContentLoaded Startup Logging
    console.log("SCRIPT.JS: DOMContentLoaded event fired. Startup initiated.");
    // END: DOMContentLoaded Startup Logging

    // START: Page Identification Logic
    const getCurrentPageName = () => {
        const pathArray = window.location.pathname.split('/');
        const lastSegment = pathArray[pathArray.length - 1];
        const pageName = (lastSegment === '' || window.location.pathname.endsWith('/')) ? 'index.html' : lastSegment;
        return pageName;
    };
    const currentPageName = getCurrentPageName();
    const isDashboardPage = currentPageName === 'index.html';
    console.log(`SCRIPT.JS: Page ID: currentPage='${currentPageName}', isDashboard=${isDashboardPage}`);
    // END: Page Identification Logic

    // START: Global Variables & Constants
    const API_BASE_URL = '/api';
    let currentPillar = 'Transparency';
    let currentLang = 'en'; // Default language
    let allMinistriesData = [];
    let apiDataCache = { dashboard: {}, details: {} };
    let currentNotificationTimeout = null;
    let currentSortGlobal = 'score-desc';
    let ministryBarChart = null;
    let kosovoMapInstance = null;
    // END: Global Variables & Constants

    // START: DOM Element References
    const languageSelectorButton = document.getElementById('languageSelector');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentLanguageSpan = languageSelectorButton?.querySelector('span'); // This is the span we are targeting
    const pillarTabs = isDashboardPage ? document.querySelectorAll('.tab-item') : null;
    let chartContainer = isDashboardPage ? document.getElementById('chart-container') : null;
    const currentViewTitle = isDashboardPage ? document.getElementById('currentView') : null;
    const ministryDetailsSection = isDashboardPage ? document.getElementById('ministryDetails') : null;
    const selectedMinistryNameTitle = isDashboardPage ? document.getElementById('selectedMinistryName') : null;
    const kpiElements = {};
    const detailElements = {};
    const perfBreakdownElements = {};

    if (isDashboardPage) {
        Object.assign(kpiElements, {
            avgTransparencyValue: document.getElementById('kpiAvgTransparencyValue'),
            avgTransparencyChange: document.getElementById('kpiAvgTransparencyChange'),
            participationScoreValue: document.getElementById('kpiParticipationScoreValue'),
            participationScoreChange: document.getElementById('kpiParticipationScoreChange'),
            efficiencyRatingValue: document.getElementById('kpiEfficiencyRatingValue'),
            efficiencyRatingChange: document.getElementById('kpiEfficiencyRatingChange'),
            overallOutcomeValue: document.getElementById('kpiOverallOutcomeValue'),
            overallOutcomeChange: document.getElementById('kpiOverallOutcomeChange')
        });
        Object.assign(detailElements, {
            transparencyScore: document.getElementById('detailTransparency'),
            transparencyChange: document.getElementById('detailTransparencyChange'),
            requests: document.getElementById('detailRequests'),
            requestsProcessed: document.getElementById('detailRequestsProcessed'),
            responseTime: document.getElementById('detailResponseTime'),
            responseTimeChange: document.getElementById('detailResponseTimeChange'),
            recentActivitiesBody: document.getElementById('recentActivitiesBody')
        });
        for (let i = 1; i <= 5; i++) {
            perfBreakdownElements[`label${i}`] = document.getElementById(`perfBreakdownLabel${i}`);
            perfBreakdownElements[`value${i}`] = document.getElementById(`perfBreakdownValue${i}`);
            perfBreakdownElements[`bar${i}`] = document.getElementById(`perfBreakdownBar${i}`);
        }
    }
    // END: DOM Element References

    // START: Translations Object
    const translations = {
    en: {
        // Common UI
        days: "days",
        headerTitle: "Public Pulse",
        headerSubtitle: "Kosovo Civic Monitor",
        languageEN: "English (EN)",
        languageSQ: "Albanian (SQ)",
        languageSR: "Serbian (SR)",
        currentLangIndicator: "EN", // ADDED
        userMenuProfile: "Profile",
        userMenuSettings: "Settings",
        userMenuSignOut: "Sign out",
        sidebarMainNavigation: "MAIN NAVIGATION",
        sidebarDashboard: "Dashboard",
        sidebarDocuments: "Documents",
        sidebarEvents: "Events",
        sidebarAnalytics: "ANALYTICS",
        sidebarLocalGovernment: "Local Government",
        sidebarExportData: "Export Data",
        breadcrumbDashboard: "Dashboard",
        breadcrumbPublicPulse: "Public Pulse",
        breadcrumbDocuments: "Documents",
        breadcrumbEvents: "Events",
        breadcrumbLocalGovernment: "Local Government",
        breadcrumbExportData: "Export Data",
        breadcrumbAboutUs: "About Us",

        // Page Titles & Subtitles
        pageTitle: "Public Pulse Dashboard",
        pageSubtitle: "Monitoring transparency and performance of Kosovo institutions",
        pageTitleDocuments: "Document Repository",
        pageSubtitleDocuments: "Access official publications, reports, and legislative documents.",
        pageTitleEvents: "Upcoming Events & Workshops",
        pageSubtitleEvents: "Discover public consultations, workshops, and civic engagement opportunities.",
        pageTitleLocalGovernment: "Local Government Performance",
        pageSubtitleLocalGovernment: "Visualize transparency and performance metrics across Kosovo's municipalities.",
        pageTitleExportData: "Data Export Center",
        pageSubtitleExportData: "Download raw data for your research and analysis needs.",
        pageTitleAboutUs: "About Public Pulse",
        pageSubtitleAboutUs: "Strengthening democratic accountability across Kosovo through meticulous analysis of transparency and public service delivery.",

        // Dashboard Specific
        kpiAvgTransparency: "Average Transparency",
        kpiParticipationScore: "Participation Score",
        kpiEfficiencyRating: "Efficiency Rating",
        kpiOverallOutcome: "Overall Outcome",
        kpiChangeSinceLastQuarter: "since last quarter",
        filtersTitle: "Interactive Filters",
        filtersReset: "Reset Filters",
        filtersExport: "Export",
        filtersExportPDF: "Export as PDF",
        filtersExportExcel: "Export as Excel",
        filtersExportCSV: "Export as CSV",
        filtersExportImage: "Export as Image",
        filtersTimePeriod: "Time Period",
        filtersCompareWith: "Compare With",
        filtersMinistryType: "Ministry Type",
        filtersScoreRange: "Score Range",
        filtersSearchMinistry: "Search Ministry",
        filtersSearchPlaceholder: "Type to search...",
        filtersApply: "Apply Filters",
        filtersShowComparison: "Show comparison",
        tabTransparency: "Transparency",
        tabParticipation: "Participation",
        tabEfficiency: "Efficiency",
        tabOutcome: "Outcome",
        viewTitleSuffix: "Scores",
        legendHigh: "High (>70)",
        legendMedium: "Medium (40-70)",
        legendLow: "Low (<40)",
        legendSortBy: "Sort by",
        sortHighestScore: "Highest Score",
        sortLowestScore: "Lowest Score",
        sortNameAZ: "Name (A-Z)",
        sortNameZA: "Name (Z-A)",
        detailsTitle: "Ministry Details",
        detailsTransparencyScore: "Transparency Score",
        detailsInfoRequests: "Information Requests",
        infoRequestsProcessed: "processed",
        detailsResponseTime: "Response Time",
        daysUnit: "days",
        detailsChangeSinceLastPeriod: "since last period",
        detailsPerfBreakdown: "Performance Breakdown",
        perfBreakdownWebsiteTransparency: "Website Transparency",
        perfBreakdownDocAccessibility: "Document Accessibility",
        perfBreakdownReqResponsiveness: "Request Responsiveness",
        perfBreakdownInfoCompleteness: "Information Completeness",
        perfBreakdownPublicEngagement: "Public Engagement",
        perfBreakdownDefaultLabel1: "Website Transparency",
        perfBreakdownDefaultLabel2: "Document Accessibility",
        perfBreakdownDefaultLabel3: "Request Responsiveness",
        perfBreakdownDefaultLabel4: "Information Completeness",
        perfBreakdownDefaultLabel5: "Public Engagement",
        detailsRecentActivities: "Recent Activities",
        tableHeaderDate: "Date",
        tableHeaderActivity: "Activity",
        tableHeaderStatus: "Status",
        tableStatusCompleted: "Completed",
        tableStatusInProgress: "In Progress",
        tableNoRecentActivities: "No recent activities to display.",
        tableNoDataToDisplay: "No data to display for the current filters.",
        notificationLangSwitchPrefix: "Language switched to",
        notificationFiltersApplied: "Filters applied",
        notificationFiltersReset: "Filters have been reset.",
        notificationComparisonEnabled: "Comparison view enabled",
        notificationComparisonDisabled: "Comparison view disabled",
        notificationExportingPrefix: "Exporting data as",
        notificationSortedByPrefix: "Sorted by",
        tooltipClickForDetails: "Click for details",
        tooltipScoreSuffix: "Score",
        categoryLabel: "Category",
        ministerLabel: "Minister",
        tooltipKeyMembers: "Key Members",
        optionNoComparison: "No Comparison",
        optionAllMinistries: "All Ministries",
        loadingData: "Loading data...",
        errorFetchingData: "Error fetching data. Please try again.",
        noChangeData: "- No change data",

        // Footer
        footerAboutTitleNew: "About Public Pulse",
        footerAboutTextNew: "As an independent, non-partisan watchdog, Public Pulse is committed to strengthening democratic accountability across Kosovo. We meticulously analyze the transparency and effectiveness of public service delivery, providing citizens with the clear, evidence-based insights essential for holding power accountable. For Kosovo to thrive, every citizen must have the tools to engage, question, and drive progress.",
        footerContactInfoTitle: "Contact Info",
        footerFollowUsTitle: "Follow Us",
        footerCopyrightNew: "Public Pulse Kosovo. All Rights Reserved.",
        footerLearnMoreAboutUs: "Learn more about us",
        footerExploreTitle: "Explore",
        footerContactPage: "Contact Us",
        footerNewsletterTitle: "Stay Updated",
        footerNewsletterText: "Subscribe to our newsletter to get the latest updates and reports directly in your inbox.",
        footerEmailLabel: "Email address",
        footerEmailPlaceholder: "Enter your email",
        footerSubscribeButton: "Subscribe",
        footerPrivacyPolicyLink: "Privacy Policy",
        footerTermsLink: "Terms of Use",
        footerAboutTextShort: "An independent, non-partisan watchdog strengthening democratic accountability across Kosovo by analyzing transparency and public service delivery.",

        // Keys specific to About.html content
        footerAboutPillarsIntro: "Our Core Pillars",
        aboutPillarsSubtext: "Our independent, evidence-driven assessments are anchored in four fundamental pillars, designed to empower Kosovo's citizens:",
        contactUsButton: "Contact Us for More Information",
        footerPillarTransparencyTitle: "Transparency: Exposing the Workings of Governance",
        footerPillarTransparencyDesc: "In Kosovo's journey towards robust democracy, true transparency is non-negotiable. Our independent scrutiny examines how openly and comprehensively public service bodies share information critical to the public—from proactive data releases and budget clarity to their responsiveness to citizens' right to know. This pillar illuminates decision-making, building the essential public trust needed for informed, sovereign civic action.",
        footerPillarParticipationTitle: "Participation Index: Ensuring Every Voice Shapes Kosovo's Future",
        footerPillarParticipationDesc: "A vibrant democracy in Kosovo depends on genuine citizen participation. This index objectively assesses the commitment and effectiveness of public bodies in creating meaningful avenues for citizens to influence policy and governance. We evaluate not just the existence of consultative mechanisms, but their real-world impact, championing a Kosovo where active citizenship is both a right and a shared responsibility for progress.",
        footerPillarEfficiencyTitle: "Efficiency Rating: Public Resources, Public Benefit",
        footerPillarEfficiencyDesc: "Kosovo's citizens deserve public services that are effective and deliver tangible value. Our independent Efficiency Rating scrutinizes how well public service bodies manage resources and execute their mandates to provide timely, impactful services. We focus on concrete operational performance, ensuring that public expenditure and effort translate directly into improved quality of life and progress for all communities in Kosovo.",
        footerPillarOutcomeTitle: "Overall Performance Index: Charting Kosovo's Path to Better Governance",
        footerPillarOutcomeDesc: "This comprehensive, citizen-focused index integrates our independent findings across Transparency, Participation, and Efficiency. It offers an evidence-based benchmark of how effectively public service bodies are serving the people of Kosovo. More than just a score, it’s a tool for progress—identifying strengths, pinpointing areas for urgent improvement, and empowering citizens, civil society, and institutions to collaboratively build a more accountable and responsive future for Kosovo.",

        // Other
        categoryEconomic: "Economic",
        categoryGovernance: "Governance",
        categorySocial: "Social",
        categoryInfrastructure: "Infrastructure",
        categoryGeneral: "General",
        activityPrefixPublicEvent: "Public Event: ",
        activityPrefixReportRelease: "Report Release: ",
        activityPrefixNewInitiative: "New Initiative: ",
        activityPrefixConsultationDocument: "Consultation Document: ",
        pmoName: "Office of the Prime Minister",
        primeMinisterLabel: "Prime Minister",
        periodQ2_2023: "Q2 2023",
        periodQ1_2023: "Q1 2023",
        periodQ4_2022: "Q4 2022",
        periodQ3_2022: "Q3 2022",
        periodAnnual_2022: "Annual 2022",
        periodQ1_2023_compare: "Q1 2023",
        periodQ4_2022_compare: "Q4 2022",
        periodQ2_2022_yoy: "Q2 2022 (YoY)",
        periodAnnual_2022_compare: "Annual 2022",

        // Mock pages
        mockPageUnderConstructionTitle: "Page Under Construction",
        mockPageContentComingSoon: "Content for this page is coming soon!",
        mockPageExportDataContent: "Content for the Export Data page is coming soon! You'll be able to download datasets in various formats.",

        // Documents page
        docSearchLabel: "Search Documents",
        docSearchPlaceholder: "Enter keywords...",
        docCategoryLabel: "Category",
        docCategoryAll: "All Categories",
        docCategoryReports: "Annual Reports",
        docCategoryLegislative: "Legislative Acts",
        docCategoryPolicy: "Policy Briefs",
        docCategoryResearch: "Research Papers",
        docYearLabel: "Year",
        docYearAll: "All Years",
        docApplyFiltersButton: "Apply Filters",
        docTitle1: "Annual Transparency Report 2023",
        docDesc1: "A comprehensive overview of institutional transparency throughout Kosovo in 2023, highlighting key findings and recommendations.",
        docDate1: "Feb 15, 2024",
        docFileInfo1: "PDF, 3.2 MB",
        docDownloadButton: "Download",
        docTitle2: "Draft Law on Public Information Access",
        docDesc2: "The proposed legislative text for enhancing public access to information, open for public consultation.",
        docDate2: "Jan 20, 2024",
        docFileInfo2: "DOCX, 1.1 MB",
        docTitle3: "Policy Brief: Digital Governance",
        docDesc3: "Analysis and recommendations for advancing digital governance practices in public institutions.",
        docDate3: "Dec 05, 2023",
        docFileInfo3: "PDF, 780 KB",
        paginationPrevious: "Previous",
        paginationNext: "Next",

        // Events page
        eventSearchLabel: "Search Events",
        eventSearchPlaceholder: "Event name or keyword...",
        eventTypeLabel: "Event Type",
        eventTypeAll: "All Types",
        eventTypeWorkshop: "Workshop",
        eventTypeConference: "Conference",
        eventTypeConsultation: "Public Consultation",
        eventTypeWebinar: "Webinar",
        eventDateLabel: "Date",
        eventApplyFiltersButton: "Apply Filters",
        eventTitle1: "Workshop on Digital Literacy for CSOs",
        eventDesc1: "Join us for an interactive workshop designed to enhance the digital skills of civil society organizations in Kosovo.",
        eventDateInfo1: "Date: October 28, 2024",
        eventTimeInfo1: "Time: 10:00 - 14:00",
        eventLocationInfo1: "Location: Innovation Centre Kosovo, Prishtina",
        eventLearnMoreButton: "Learn More & Register",
        eventTitle2: "Conference on Open Government Data",
        eventDesc2: "A national conference bringing together policymakers, CSOs, and tech enthusiasts to discuss the future of open data in Kosovo.",
        eventDateInfo2: "Date: November 12-13, 2024",
        eventTimeInfo2: "Time: Full Day",
        eventLocationInfo2: "Location: Emerald Hotel, Prishtina",

        // Map Specific
        mapLegendTitle: "Map Legend & Info",
        mapLegendHighPerf: "High Performance",
        mapLegendMedPerf: "Medium Performance",
        mapLegendLowPerf: "Low Performance",
        mapLegendDefault: "Default / No Data",
        mapSelectedMunicipality: "Selected Municipality:",
        mapClickPrompt: "Click on a marker to see details.",
        mapPopulation: "Population",
        mapPerformance: "Performance",
        mapPerformanceHigh: "High",
        mapPerformanceMedium: "Medium",
        mapPerformanceLow: "Low",
        mapScore: "Score",
        mapViewDetails: "View More Details",
        mapDataTableTitle: "Regional Data Overview",
        mapDataTableDesc: "A table summarizing key indicators for all municipalities could be displayed here. For now, this is a placeholder.",
        mapMayorLabel: "Mayor",
        mapCabinetMembersLabel: "Cabinet Members",
        dataNotAvailable: "N/A",

        notificationBannerText: "Notification:",
        mobileMenuToggle: "Toggle navigation",
        ariaLabelMainNav: "Main navigation",
        ariaLabelLangMenu: "Language selection",
        ariaLabelUserMenu: "User account menu",
        ariaLabelCloseDetails: "Close ministry details",
        chartAccessibilityLabel: "Ministry performance chart",
        chartAccessibilityDesc: "Bar chart showing ministry scores. Use arrow keys to navigate between items.",
        dataTableSummary: "Showing {start} to {end} of {total} entries",
        paginationPage: "Page",
        loadingChartData: "Loading visualization...",
        mapAccessibilityLabel: "Kosovo municipalities map",
        mapAccessibilityDesc: "Interactive map showing municipality performance. Click markers for details.",
        errorMinistryDetails: "Failed to load ministry details",
        validationSearchMinistry: "Enter at least 3 characters",
        validationInvalidEmail: "Please enter a valid email address",
        cookieConsentMessage: "We use cookies to ensure the best experience.",
        cookieConsentAccept: "Accept",
        cookieConsentLearnMore: "Learn more"
    },
    sq: { // Albanian
        // Common UI
        days: "ditë",
        headerTitle: "Pulsi Publik",
        headerSubtitle: "Monitoruesi Qytetar i Kosovës",
        languageEN: "Anglisht (EN)",
        languageSQ: "Shqip (SQ)",
        languageSR: "Serbisht (SR)",
        currentLangIndicator: "SQ", // ADDED
        userMenuProfile: "Profili",
        userMenuSettings: "Cilësimet",
        userMenuSignOut: "Dilni",
        sidebarMainNavigation: "NAVIGIMI KRYESOR",
        sidebarDashboard: "Paneli",
        sidebarDocuments: "Dokumentet",
        sidebarEvents: "Ngjarjet",
        sidebarAnalytics: "ANALITIKA",
        sidebarLocalGovernment: "Qeverisja Lokale",
        sidebarExportData: "Eksporto të Dhënat",
        breadcrumbDashboard: "Paneli",
        breadcrumbPublicPulse: "Pulsi Publik",
        breadcrumbDocuments: "Dokumentet",
        breadcrumbEvents: "Ngjarjet",
        breadcrumbLocalGovernment: "Qeverisja Lokale",
        breadcrumbExportData: "Eksporto të Dhënat",
        breadcrumbAboutUs: "Rreth Nesh",

        // Page Titles & Subtitles
        pageTitle: "Paneli i Pulsit Publik",
        pageSubtitle: "Monitorimi i transparencës dhe performancës së institucioneve të Kosovës",
        pageTitleDocuments: "Depoja e Dokumenteve",
        pageSubtitleDocuments: "Qasuni në publikime zyrtare, raporte dhe dokumente legjislative.",
        pageTitleEvents: "Ngjarjet & Punëtoritë e Ardhshme",
        pageSubtitleEvents: "Zbuloni konsultime publike, punëtori dhe mundësi për angazhim qytetar.",
        pageTitleLocalGovernment: "Performanca e Qeverisjes Lokale",
        pageSubtitleLocalGovernment: "Vizualizoni metrikët e transparencës dhe performancës nëpër komunat e Kosovës.",
        pageTitleExportData: "Qendra e Eksportit të të Dhënave",
        pageSubtitleExportData: "Shkarkoni të dhënat e papërpunuara për nevojat tuaja kërkimore dhe analitike.",
        pageTitleAboutUs: "Rreth Pulsit Publik",
        pageSubtitleAboutUs: "Forcimi i llogaridhënies demokratike në mbarë Kosovën përmes analizës së përpiktë të transparencës dhe ofrimit të shërbimeve publike.",

        // Dashboard Specific
        kpiAvgTransparency: "Transparenca Mesatare",
        kpiParticipationScore: "Pikët e Pjesëmarrjes",
        kpiEfficiencyRating: "Vlerësimi i Efiçiencës",
        kpiOverallOutcome: "Rezultati i Përgjithshëm",
        kpiChangeSinceLastQuarter: "që nga tremujori i fundit",
        filtersTitle: "Filtrat Interaktivë",
        filtersReset: "Rivendos Filtrat",
        filtersExport: "Eksporto",
        filtersExportPDF: "Eksporto si PDF",
        filtersExportExcel: "Eksporto si Excel",
        filtersExportCSV: "Eksporto si CSV",
        filtersExportImage: "Eksporto si Imazh",
        filtersTimePeriod: "Periudha Kohore",
        filtersCompareWith: "Krahaso me",
        filtersMinistryType: "Lloji i Ministrisë",
        filtersScoreRange: "Diapazoni i Pikëve",
        filtersSearchMinistry: "Kërko Ministrinë",
        filtersSearchPlaceholder: "Shkruani për të kërkuar...",
        filtersApply: "Apliko Filtrat",
        filtersShowComparison: "Shfaq krahasimin",
        tabTransparency: "Transparenca",
        tabParticipation: "Pjesëmarrja",
        tabEfficiency: "Efiçienca",
        tabOutcome: "Rezultati",
        viewTitleSuffix: "Pikët",
        legendHigh: "Lartë (>70)",
        legendMedium: "Mesatare (40-70)",
        legendLow: "Ulët (<40)",
        legendSortBy: "Rendit sipas",
        sortHighestScore: "Pikët më të Larta",
        sortLowestScore: "Pikët më të Ulëta",
        sortNameAZ: "Emri (A-Z)",
        sortNameZA: "Emri (Z-A)",
        detailsTitle: "Detajet e Ministrisë",
        detailsTransparencyScore: "Pikët e Transparencës",
        detailsInfoRequests: "Kërkesat për Informacion",
        infoRequestsProcessed: "të procesuara",
        detailsResponseTime: "Koha e Përgjigjes",
        daysUnit: "ditë",
        detailsChangeSinceLastPeriod: "që nga periudha e fundit",
        detailsPerfBreakdown: "Analiza e Performancës",
        perfBreakdownWebsiteTransparency: "Transparenca e Ueb-faqes",
        perfBreakdownDocAccessibility: "Qasshmëria e Dokumenteve",
        perfBreakdownReqResponsiveness: "Reagueshmëria ndaj Kërkesave",
        perfBreakdownInfoCompleteness: "Plotësia e Informacionit",
        perfBreakdownPublicEngagement: "Angazhimi Publik",
        perfBreakdownDefaultLabel1: "Transparenca e Ueb-faqes",
        perfBreakdownDefaultLabel2: "Qasshmëria e Dokumenteve",
        perfBreakdownDefaultLabel3: "Reagueshmëria ndaj Kërkesave",
        perfBreakdownDefaultLabel4: "Plotësia e Informacionit",
        perfBreakdownDefaultLabel5: "Angazhimi Publik",
        detailsRecentActivities: "Aktivitetet e Fundit",
        tableHeaderDate: "Data",
        tableHeaderActivity: "Aktiviteti",
        tableHeaderStatus: "Statusi",
        tableStatusCompleted: "Përfunduar",
        tableStatusInProgress: "Në Proces",
        tableNoRecentActivities: "Nuk ka aktivitete të fundit për të shfaqur.",
        tableNoDataToDisplay: "Nuk ka të dhëna për të shfaqur me filtrat aktualë.",
        notificationLangSwitchPrefix: "Gjuha u ndërrua në",
        notificationFiltersApplied: "Filtrat u aplikuan",
        notificationFiltersReset: "Filtrat janë rivendosur.",
        notificationComparisonEnabled: "Pamja e krahasimit u aktivizua",
        notificationComparisonDisabled: "Pamja e krahasimit u çaktivizua",
        notificationExportingPrefix: "Eksportimi i të dhënave si",
        notificationSortedByPrefix: "Renditur sipas",
        tooltipClickForDetails: "Klikoni për detaje",
        tooltipScoreSuffix: "Pikët",
        categoryLabel: "Kategoria",
        ministerLabel: "Ministri",
        tooltipKeyMembers: "Anëtarët Kyç",
        optionNoComparison: "Pa Krahasim",
        optionAllMinistries: "Të Gjitha Ministritë",
        loadingData: "Duke ngarkuar të dhënat...",
        errorFetchingData: "Gabim gjatë marrjes së të dhënave. Ju lutemi provoni përsëri.",
        noChangeData: "- Nuk ka të dhëna për ndryshim",

        // Footer
        footerAboutTitleNew: "Rreth Pulsit Publik",
        footerAboutTextNew: "Si një vëzhgues i pavarur dhe jopartiak, Pulsi Publik është i përkushtuar për forcimin e llogaridhënies demokratike në të gjithë Kosovën. Ne analizojmë me përpikëri transparencën dhe efektivitetin e ofrimit të shërbimeve publike, duke u ofruar qytetarëve njohuri të qarta, të bazuara në dëshmi, thelbësore për mbajtjen e pushtetit të përgjegjshëm. Që Kosova të lulëzojë, çdo qytetar duhet të ketë mjetet për t'u angazhuar, për të pyetur dhe për të nxitur progresin.",
        footerContactInfoTitle: "Informacioni i Kontaktit",
        footerFollowUsTitle: "Na Ndiqni",
        footerCopyrightNew: "Pulsi Publik Kosovë. Të gjitha të drejtat e rezervuara.",
        footerLearnMoreAboutUs: "Mëso më shumë rreth nesh",
        footerExploreTitle: "Eksploro",
        footerContactPage: "Na Kontaktoni",
        footerNewsletterTitle: "Qëndroni të Informuar",
        footerNewsletterText: "Regjistrohuni në buletinin tonë për të marrë përditësimet dhe raportet më të fundit direkt në emailin tuaj.",
        footerEmailLabel: "Adresa e emailit",
        footerEmailPlaceholder: "Shkruani emailin tuaj",
        footerSubscribeButton: "Regjistrohu",
        footerPrivacyPolicyLink: "Politika e Privatësisë",
        footerTermsLink: "Kushtet e Përdorimit",
        footerAboutTextShort: "Një vëzhgues i pavarur, jopartiak që forcon llogaridhënien demokratike në mbarë Kosovën duke analizuar transparencën dhe ofrimin e shërbimeve publike.",

        // About.html specific
        footerAboutPillarsIntro: "Shtylla Jonë Kryesore",
        aboutPillarsSubtext: "Vlerësimet tona të pavarura, të bazuara në dëshmi, ankorohen në katër shtylla themelore, të dizajnuara për të fuqizuar qytetarët e Kosovës:",
        contactUsButton: "Na Kontaktoni për Më Shumë Informacion",
        footerPillarTransparencyTitle: "Transparenca: Ekspozimi i Punës së Qeverisjes",
        footerPillarTransparencyDesc: "Në rrugëtimin e Kosovës drejt një demokracie të fortë, transparenca e vërtetë është e panegociueshme. Vëzhgimi ynë i pavarur shqyrton sa hapur dhe gjithëpërfshirës organet e shërbimit publik ndajnë informacion kritik për publikun - nga publikimet proaktive të të dhënave dhe qartësia buxhetore deri te reagueshmëria e tyre ndaj të drejtës së qytetarëve për të ditur. Kjo shtyllë ndriçon procesin e vendimmarrjes, duke ndërtuar besimin thelbësor publik të nevojshëm për veprim qytetar të informuar dhe sovran.",
        footerPillarParticipationTitle: "Indeksi i Pjesëmarrjes: Sigurimi që çdo Zë Të Formësojë të Ardhmen e Kosovës",
        footerPillarParticipationDesc: "Një demokraci e gjallë në Kosovë varet nga pjesëmarrja e vërtetë qytetare. Ky indeks vlerëson objektivisht angazhimin dhe efektivitetin e organeve publike në krijimin e rrugëve kuptimplotë për qytetarët për të ndikuar në politikën dhe qeverisjen. Ne vlerësojmë jo vetëm ekzistencën e mekanizmave konsultativë, por edhe ndikimin e tyre në botën reale, duke përkrahur një Kosovë ku qytetaria aktive është si një e drejtë, ashtu edhe një përgjegjësi e përbashkët për progres.",
        footerPillarEfficiencyTitle: "Vlerësimi i Efiçiencës: Burimet Publike, Përfitimi Publik",
        footerPillarEfficiencyDesc: "Qytetarët e Kosovës meritojnë shërbime publike që janë efektive dhe ofrojnë vlerë të prekshme. Vlerësimi ynë i pavarur i Efiçiencës shqyrton sa mirë organet e shërbimit publik menaxhojnë burimet dhe ekzekutojnë mandatet e tyre për të ofruar shërbime në kohë dhe me ndikim. Ne përqendrohemi në performancën konkrete operacionale, duke siguruar që shpenzimet dhe përpjekjet publike të përkthehen drejtpërdrejt në përmirësimin e cilësisë së jetës dhe progresin për të gjitha komunitetet në Kosovë.",
        footerPillarOutcomeTitle: "Indeksi i Performancës së Përgjithshme: Hartëzimi i Rrugës së Kosovës drejt Qeverisjes më të Mirë",
        footerPillarOutcomeDesc: "Ky indeks gjithëpërfshirës, i fokusuar te qytetari, integron gjetjet tona të pavarura në Transparencë, Pjesëmarrje dhe Efiçiencë. Ai ofron një pikë referimi të bazuar në dëshmi se sa efektivisht organet e shërbimit publik u shërbejnë njerëzve të Kosovës. Më shumë se thjesht një pikë, është një mjet për progres - identifikimin e pikave të forta, përcaktimin e fushave për përmirësim urgjent dhe fuqizimin e qytetarëve, shoqërisë civile dhe institucioneve për të ndërtuar bashkërisht një të ardhme më të llogaridhënëse dhe reaguese për Kosovën.",

        // Other
        categoryEconomic: "Ekonomike",
        categoryGovernance: "Qeverisjes",
        categorySocial: "Sociale",
        categoryInfrastructure: "Infrastrukturës",
        categoryGeneral: "Të Përgjithshme",
        activityPrefixPublicEvent: "Ngjarje Publike: ",
        activityPrefixReportRelease: "Publikim Raporti: ",
        activityPrefixNewInitiative: "Nismë e Re: ",
        activityPrefixConsultationDocument: "Dokument Konsultimi: ",
        pmoName: "Zyra e Kryeministrit",
        primeMinisterLabel: "Kryeministri",
        periodQ2_2023: "TM2 2023",
        periodQ1_2023: "TM1 2023",
        periodQ4_2022: "TM4 2022",
        periodQ3_2022: "TM3 2022",
        periodAnnual_2022: "Vjetor 2022",
        periodQ1_2023_compare: "TM1 2023",
        periodQ4_2022_compare: "TM4 2022",
        periodQ2_2022_yoy: "TM2 2022 (VnM)",
        periodAnnual_2022_compare: "Vjetor 2022",

        // Mock pages
        mockPageUnderConstructionTitle: "Faqja në Ndërtim",
        mockPageContentComingSoon: "Përmbajtja për këtë faqe do të vijë së shpejti!",
        mockPageExportDataContent: "Përmbajtja për faqen e Eksportit të të Dhënave do të vijë së shpejti! Do të keni mundësi të shkarkoni grupe të dhënash në formate të ndryshme.",

        // Documents page
        docSearchLabel: "Kërko Dokumente",
        docSearchPlaceholder: "Shkruani fjalë kyçe...",
        docCategoryLabel: "Kategoria",
        docCategoryAll: "Të Gjitha Kategoritë",
        docCategoryReports: "Raporte Vjetore",
        docCategoryLegislative: "Akte Ligjore",
        docCategoryPolicy: "Udhëzime Politike",
        docCategoryResearch: "Punime Kërkimore",
        docYearLabel: "Viti",
        docYearAll: "Të Gjithë Vitet",
        docApplyFiltersButton: "Apliko Filtrat",
        docTitle1: "Raporti Vjetor i Transparencës 2023",
        docDesc1: "Një përmbledhje gjithëpërfshirëse e transparencës institucionale në mbarë Kosovën në vitin 2023, duke theksuar gjetjet kryesore dhe rekomandimet.",
        docDate1: "15 Shkurt 2024",
        docFileInfo1: "PDF, 3.2 MB",
        docDownloadButton: "Shkarko",
        docTitle2: "Projektligji për Qasjen në Informacionin Publik",
        docDesc2: "Teksti i propozuar legjislativ për përmirësimin e qasjes publike në informacion, i hapur për konsultim publik.",
        docDate2: "20 Janar 2024",
        docFileInfo2: "DOCX, 1.1 MB",
        docTitle3: "Udhëzim Politik: Qeverisja Dixhitale",
        docDesc3: "Analizë dhe rekomandime për avancimin e praktikave të qeverisjes dixhitale në institucionet publike.",
        docDate3: "05 Dhjetor 2023",
        docFileInfo3: "PDF, 780 KB",
        paginationPrevious: "Mëparshme",
        paginationNext: "Tjetra",

        // Events page
        eventSearchLabel: "Kërko Ngjarje",
        eventSearchPlaceholder: "Emri i ngjarjes ose fjalë kyçe...",
        eventTypeLabel: "Lloji i Ngjarjes",
        eventTypeAll: "Të Gjitha Llojet",
        eventTypeWorkshop: "Punëtori",
        eventTypeConference: "Konferencë",
        eventTypeConsultation: "Konsultim Publik",
        eventTypeWebinar: "Uebinar",
        eventDateLabel: "Data",
        eventApplyFiltersButton: "Apliko Filtrat",
        eventTitle1: "Punëtori mbi Shkrim-leximin Dixhital për OJQ-të",
        eventDesc1: "Bashkohuni me ne në një punëtori interaktive të dizajnuar për të përmirësuar aftësitë dixhitale të organizatave të shoqërisë civile në Kosovë.",
        eventDateInfo1: "Data: 28 Tetor 2024",
        eventTimeInfo1: "Koha: 10:00 - 14:00",
        eventLocationInfo1: "Vendi: Qendra e Inovacionit Kosovë, Prishtinë",
        eventLearnMoreButton: "Mëso Më Shumë & Regjistrohu",
        eventTitle2: "Konferencë mbi të Dhënat e Hapura Qeveritare",
        eventDesc2: "Një konferencë kombëtare që bashkon politikëbërësit, OJQ-të dhe entuziastët e teknologjisë për të diskutuar të ardhmen e të dhënave të hapura në Kosovë.",
        eventDateInfo2: "Data: 12-13 Nëntor 2024",
        eventTimeInfo2: "Koha: Ditë e Plotë",
        eventLocationInfo2: "Vendi: Hotel Emerald, Prishtinë",

        // Map Specific
        mapLegendTitle: "Legjenda e Hartës & Info",
        mapLegendHighPerf: "Performancë e Lartë",
        mapLegendMedPerf: "Performancë Mesatare",
        mapLegendLowPerf: "Performancë e Ulët",
        mapLegendDefault: "Parazgjedhur / Pa të Dhëna",
        mapSelectedMunicipality: "Komuna e Zgjedhur:",
        mapClickPrompt: "Klikoni mbi një shënues për të parë detajet.",
        mapPopulation: "Popullsia",
        mapPerformance: "Performanca",
        mapPerformanceHigh: "E Lartë",
        mapPerformanceMedium: "Mesatare",
        mapPerformanceLow: "E Ulët",
        mapScore: "Pikët",
        mapViewDetails: "Shiko Më Shumë Detaje",
        mapDataTableTitle: "Përmbledhje e të Dhënave Rajonale",
        mapDataTableDesc: "Një tabelë që përmbledh treguesit kryesorë për të gjitha komunat mund të shfaqej këtu. Për tani, ky është një vendmbajtës.",
        mapMayorLabel: "Kryetari",
        mapCabinetMembersLabel: "Anëtarët e Kabinetit",
        dataNotAvailable: "E padisponueshme",

        notificationBannerText: "Njoftim:",
        mobileMenuToggle: "Hap/Mbyll navigimin",
        ariaLabelMainNav: "Navigimi kryesor",
        ariaLabelLangMenu: "Përzgjedhja e gjuhës",
        ariaLabelUserMenu: "Menuja e llogarisë së përdoruesit",
        ariaLabelCloseDetails: "Mbyll detajet e ministrisë",
        chartAccessibilityLabel: "Grafiku i performancës së ministrisë",
        chartAccessibilityDesc: "Grafik me shirita që tregon rezultatet e ministrisë. Përdorni tastet e shigjetave për të lëvizur ndërmjet elementeve.",
        dataTableSummary: "Duke shfaqur {start} deri në {end} nga {total} regjistrime",
        paginationPage: "Faqja",
        loadingChartData: "Duke ngarkuar vizualizimin...",
        mapAccessibilityLabel: "Harta e komunave të Kosovës",
        mapAccessibilityDesc: "Hartë interaktive që tregon performancën e komunave. Klikoni mbi shënuesit për detaje.",
        errorMinistryDetails: "Dështoi ngarkimi i detajeve të ministrisë",
        validationSearchMinistry: "Shkruani të paktën 3 karaktere",
        validationInvalidEmail: "Ju lutemi shkruani një adresë emaili të vlefshme",
        cookieConsentMessage: "Ne përdorim cookies për të siguruar përvojën më të mirë.",
        cookieConsentAccept: "Prano",
        cookieConsentLearnMore: "Mëso më shumë"
    },
    sr: { // Serbian (Latin script)
        // Common UI
        days: "dana",
        headerTitle: "Javni Puls",
        headerSubtitle: "Građanski Monitor Kosova",
        languageEN: "Engleski (EN)",
        languageSQ: "Albanski (SQ)",
        languageSR: "Srpski (SR)",
        currentLangIndicator: "SR", // ADDED
        userMenuProfile: "Profil",
        userMenuSettings: "Podešavanja",
        userMenuSignOut: "Odjavite se",
        sidebarMainNavigation: "GLAVNA NAVIGACIJA",
        sidebarDashboard: "Kontrolna tabla",
        sidebarDocuments: "Dokumenti",
        sidebarEvents: "Događaji",
        sidebarAnalytics: "ANALITIKA",
        sidebarLocalGovernment: "Lokalna Samouprava",
        sidebarExportData: "Izvezi Podatke",
        breadcrumbDashboard: "Kontrolna tabla",
        breadcrumbPublicPulse: "Javni Puls",
        breadcrumbDocuments: "Dokumenti",
        breadcrumbEvents: "Događaji",
        breadcrumbLocalGovernment: "Lokalna Samouprava",
        breadcrumbExportData: "Izvezi Podatke",
        breadcrumbAboutUs: "O Nama",

        // Page Titles & Subtitles
        pageTitle: "Kontrolna tabla Javnog Pulsa",
        pageSubtitle: "Praćenje transparentnosti i performansi institucija Kosova",
        pageTitleDocuments: "Repozitorijum Dokumenata",
        pageSubtitleDocuments: "Pristup zvaničnim publikacijama, izveštajima i zakonodavnim dokumentima.",
        pageTitleEvents: "Predstojeći Događaji i Radionice",
        pageSubtitleEvents: "Otkrijte javne konsultacije, radionice i mogućnosti građanskog angažovanja.",
        pageTitleLocalGovernment: "Performanse Lokalne Samouprave",
        pageSubtitleLocalGovernment: "Vizualizujte metrike transparentnosti i performansi širom opština Kosova.",
        pageTitleExportData: "Centar za Izvoz Podataka",
        pageSubtitleExportData: "Preuzmite sirove podatke za vaše potrebe istraživanja i analize.",
        pageTitleAboutUs: "O Javnom Pulsu",
        pageSubtitleAboutUs: "Jačanje demokratske odgovornosti širom Kosova kroz pedantnu analizu transparentnosti i pružanja javnih usluga.",

        // Dashboard Specific
        kpiAvgTransparency: "Prosečna Transparentnost",
        kpiParticipationScore: "Ocena Učešća",
        kpiEfficiencyRating: "Ocena Efikasnosti",
        kpiOverallOutcome: "Ukupni Rezultat",
        kpiChangeSinceLastQuarter: "od prošlog tromesečja",
        filtersTitle: "Interaktivni Filteri",
        filtersReset: "Resetuj Filtere",
        filtersExport: "Izvezi",
        filtersExportPDF: "Izvezi kao PDF",
        filtersExportExcel: "Izvezi kao Excel",
        filtersExportCSV: "Izvezi kao CSV",
        filtersExportImage: "Izvezi kao Slika",
        filtersTimePeriod: "Vremenski Period",
        filtersCompareWith: "Uporedi sa",
        filtersMinistryType: "Vrsta Ministarstva",
        filtersScoreRange: "Opseg Ocena",
        filtersSearchMinistry: "Pretraži Ministarstvo",
        filtersSearchPlaceholder: "Unesite za pretragu...",
        filtersApply: "Primeni Filtere",
        filtersShowComparison: "Prikaži poređenje",
        tabTransparency: "Transparentnost",
        tabParticipation: "Učešće",
        tabEfficiency: "Efikasnost",
        tabOutcome: "Rezultat",
        viewTitleSuffix: "Ocene",
        legendHigh: "Visoko (>70)",
        legendMedium: "Srednje (40-70)",
        legendLow: "Nisko (<40)",
        legendSortBy: "Sortiraj po",
        sortHighestScore: "Najviša Ocena",
        sortLowestScore: "Najniža Ocena",
        sortNameAZ: "Naziv (A-Z)",
        sortNameZA: "Naziv (Z-A)",
        detailsTitle: "Detalji Ministarstva",
        detailsTransparencyScore: "Ocena Transparentnosti",
        detailsInfoRequests: "Zahtevi za Informacije",
        infoRequestsProcessed: "obrađeno",
        detailsResponseTime: "Vreme Odgovora",
        daysUnit: "dana",
        detailsChangeSinceLastPeriod: "od prošlog perioda",
        detailsPerfBreakdown: "Analiza Performansi",
        perfBreakdownWebsiteTransparency: "Transparentnost Vebsajta",
        perfBreakdownDocAccessibility: "Pristupačnost Dokumenata",
        perfBreakdownReqResponsiveness: "Odgovornost na Zahteve",
        perfBreakdownInfoCompleteness: "Potpunost Informacija",
        perfBreakdownPublicEngagement: "Javno Angažovanje",
        perfBreakdownDefaultLabel1: "Transparentnost Vebsajta",
        perfBreakdownDefaultLabel2: "Pristupačnost Dokumenata",
        perfBreakdownDefaultLabel3: "Odgovornost na Zahteve",
        perfBreakdownDefaultLabel4: "Potpunost Informacija",
        perfBreakdownDefaultLabel5: "Javno Angažovanje",
        detailsRecentActivities: "Nedavne Aktivnosti",
        tableHeaderDate: "Datum",
        tableHeaderActivity: "Aktivnost",
        tableHeaderStatus: "Status",
        tableStatusCompleted: "Završeno",
        tableStatusInProgress: "U toku",
        tableNoRecentActivities: "Nema nedavnih aktivnosti za prikaz.",
        tableNoDataToDisplay: "Nema podataka za prikaz sa trenutnim filterima.",
        notificationLangSwitchPrefix: "Jezik promenjen na",
        notificationFiltersApplied: "Filteri primenjeni",
        notificationFiltersReset: "Filteri su resetovani.",
        notificationComparisonEnabled: "Poređenje omogućeno",
        notificationComparisonDisabled: "Poređenje onemogućeno",
        notificationExportingPrefix: "Izvoz podataka kao",
        notificationSortedByPrefix: "Sortirano po",
        tooltipClickForDetails: "Kliknite za detalje",
        tooltipScoreSuffix: "Ocena",
        categoryLabel: "Kategorija",
        ministerLabel: "Ministar",
        tooltipKeyMembers: "Ključni Članovi",
        optionNoComparison: "Bez Poređenja",
        optionAllMinistries: "Sva Ministarstva",
        loadingData: "Učitavanje podataka...",
        errorFetchingData: "Greška pri preuzimanju podataka. Molimo pokušajte ponovo.",
        noChangeData: "- Nema podataka o promenama",

        // Footer
        footerAboutTitleNew: "O Javnom Pulsu",
        footerAboutTextNew: "Kao nezavisni, nestranački nadzornik, Javni Puls je posvećen jačanju demokratske odgovornosti širom Kosova. Pedantno analiziramo transparentnost i efikasnost pružanja javnih usluga, pružajući građanima jasne, na dokazima zasnovane uvide koji su ključni za pozivanje na odgovornost vlasti. Da bi Kosovo napredovalo, svaki građanin mora imati alate za angažovanje, postavljanje pitanja i pokretanje napretka.",
        footerContactInfoTitle: "Kontakt Info",
        footerFollowUsTitle: "Pratite Nas",
        footerCopyrightNew: "Javni Puls Kosovo. Sva prava zadržana.",
        footerLearnMoreAboutUs: "Saznajte više o nama",
        footerExploreTitle: "Istražite",
        footerContactPage: "Kontaktirajte Nas",
        footerNewsletterTitle: "Ostanite Ažurirani",
        footerNewsletterText: "Pretplatite se na naš bilten da biste dobijali najnovija ažuriranja i izveštaje direktno u vaše prijemno sanduče.",
        footerEmailLabel: "Email adresa",
        footerEmailPlaceholder: "Unesite vašu email adresu",
        footerSubscribeButton: "Pretplati se",
        footerPrivacyPolicyLink: "Politika Privatnosti",
        footerTermsLink: "Uslovi Korišćenja",
        footerAboutTextShort: "Nezavisni, nestranački nadzornik koji jača demokratsku odgovornost širom Kosova analizirajući transparentnost i pružanje javnih usluga.",

        // About.html specific
        footerAboutPillarsIntro: "Naši Osnovni Stubovi",
        aboutPillarsSubtext: "Naše nezavisne procene zasnovane na dokazima usidrene su u četiri fundamentalna stuba, osmišljena da osnaže građane Kosova:",
        contactUsButton: "Kontaktirajte Nas za Više Informacija",
        footerPillarTransparencyTitle: "Transparentnost: Otkrivanje Rada Uprave",
        footerPillarTransparencyDesc: "Na putu Kosova ka snažnoj demokratiji, istinska transparentnost je neophodna. Naš nezavisni nadzor ispituje koliko otvoreno i sveobuhvatno tela javnih službi dele informacije ključne za javnost – od proaktivnog objavljivanja podataka i jasnoće budžeta do njihove odgovornosti na pravo građana da znaju. Ovaj stub osvetljava donošenje odluka, gradeći suštinsko poverenje javnosti potrebno za informisano, suvereno građansko delovanje.",
        footerPillarParticipationTitle: "Indeks Učešća: Osiguravanje da Svaki Glas Oblikuje Budućnost Kosova",
        footerPillarParticipationDesc: "Živahna demokratija na Kosovu zavisi od istinskog učešća građana. Ovaj indeks objektivno procenjuje posvećenost i efikasnost javnih tela u stvaranju značajnih načina da građani utiču na politiku i upravljanje. Mi ne ocenjujemo samo postojanje konsultativnih mehanizama, već njihov stvarni uticaj, zalažući se za Kosovo gde je aktivno građanstvo i pravo i zajednička odgovornost za napredak.",
        footerPillarEfficiencyTitle: "Ocena Efikasnosti: Javni Resursi, Javna Korist",
        footerPillarEfficiencyDesc: "Građani Kosova zaslužuju javne usluge koje su efikasne i donose opipljivu vrednost. Naša nezavisna Ocena Efikasnosti ispituje koliko dobro tela javnih službi upravljaju resursima i izvršavaju svoje mandate kako bi pružila pravovremene, uticajne usluge. Fokusiramo se na konkretne operativne performanse, osiguravajući da se javni rashodi i napori direktno pretoče u poboljšani kvalitet života i napredak za sve zajednice na Kosovu.",
        footerPillarOutcomeTitle: "Indeks Ukupnih Performansi: Mapiranje Puta Kosova ka Boljem Upravljanju",
        footerPillarOutcomeDesc: "Ovaj sveobuhvatni indeks, usmeren na građane, integriše naše nezavisne nalaze o Transparentnosti, Učešću i Efikasnosti. On nudi merilo zasnovano na dokazima o tome koliko efikasno tela javnih službi služe narodu Kosova. Više od same ocene, to je alat za napredak – identifikovanje prednosti, ukazivanje na oblasti za hitno poboljšanje i osnaživanje građana, civilnog društva i institucija da zajedno grade odgovorniju i reaktivniju budućnost za Kosovo.",

        // Other
        categoryEconomic: "Ekonomska",
        categoryGovernance: "Upravljanja",
        categorySocial: "Socijalna",
        categoryInfrastructure: "Infrastrukture",
        categoryGeneral: "Opšta",
        activityPrefixPublicEvent: "Javni Događaj: ",
        activityPrefixReportRelease: "Objavljivanje Izveštaja: ",
        activityPrefixNewInitiative: "Nova Inicijativa: ",
        activityPrefixConsultationDocument: "Konsultacioni Dokument: ",
        pmoName: "Kancelarija Premijera",
        primeMinisterLabel: "Premijer",
        periodQ2_2023: "K2 2023",
        periodQ1_2023: "K1 2023",
        periodQ4_2022: "K4 2022",
        periodQ3_2022: "K3 2022",
        periodAnnual_2022: "Godišnji 2022",
        periodQ1_2023_compare: "K1 2023",
        periodQ4_2022_compare: "K4 2022",
        periodQ2_2022_yoy: "K2 2022 (MgM)",
        periodAnnual_2022_compare: "Godišnji 2022",

        // Mock pages
        mockPageUnderConstructionTitle: "Stranica u Izradi",
        mockPageContentComingSoon: "Sadržaj za ovu stranicu uskoro stiže!",
        mockPageExportDataContent: "Sadržaj za stranicu Izvoz Podataka uskoro stiže! Moći ćete da preuzimate skupove podataka u različitim formatima.",

        // Documents page
        docSearchLabel: "Pretraži Dokumente",
        docSearchPlaceholder: "Unesite ključne reči...",
        docCategoryLabel: "Kategorija",
        docCategoryAll: "Sve Kategorije",
        docCategoryReports: "Godišnji Izveštaji",
        docCategoryLegislative: "Zakonodavni Akti",
        docCategoryPolicy: "Sažeci Politika",
        docCategoryResearch: "Istraživački Radovi",
        docYearLabel: "Godina",
        docYearAll: "Sve Godine",
        docApplyFiltersButton: "Primeni Filtere",
        docTitle1: "Godišnji Izveštaj o Transparentnosti 2023",
        docDesc1: "Sveobuhvatan pregled institucionalne transparentnosti širom Kosova u 2023. godini, sa ključnim nalazima i preporukama.",
        docDate1: "15. Feb 2024",
        docFileInfo1: "PDF, 3.2 MB",
        docDownloadButton: "Preuzmi",
        docTitle2: "Nacrt Zakona o Pristupu Javnim Informacijama",
        docDesc2: "Predloženi zakonodavni tekst za unapređenje javnog pristupa informacijama, otvoren za javnu raspravu.",
        docDate2: "20. Jan 2024",
        docFileInfo2: "DOCX, 1.1 MB",
        docTitle3: "Sažetak Politike: Digitalno Upravljanje",
        docDesc3: "Analiza i preporuke za unapređenje praksi digitalnog upravljanja u javnim institucijama.",
        docDate3: "05. Dec 2023",
        docFileInfo3: "PDF, 780 KB",
        paginationPrevious: "Prethodna",
        paginationNext: "Sledeća",

        // Events page
        eventSearchLabel: "Pretraži Događaje",
        eventSearchPlaceholder: "Naziv događaja ili ključna reč...",
        eventTypeLabel: "Vrsta Događaja",
        eventTypeAll: "Sve Vrste",
        eventTypeWorkshop: "Radionica",
        eventTypeConference: "Konferencija",
        eventTypeConsultation: "Javna Konsultacija",
        eventTypeWebinar: "Vebinar",
        eventDateLabel: "Datum",
        eventApplyFiltersButton: "Primeni Filtere",
        eventTitle1: "Radionica o Digitalnoj Pismenosti za OCD",
        eventDesc1: "Pridružite nam se na interaktivnoj radionici osmišljenoj da unapredi digitalne veštine organizacija civilnog društva na Kosovu.",
        eventDateInfo1: "Datum: 28. Oktobar 2024.",
        eventTimeInfo1: "Vreme: 10:00 - 14:00",
        eventLocationInfo1: "Mesto: Inovacioni Centar Kosovo, Priština",
        eventLearnMoreButton: "Saznajte Više i Registrujte se",
        eventTitle2: "Konferencija o Otvorenim Vladinim Podacima",
        eventDesc2: "Nacionalna konferencija koja okuplja kreatore politika, OCD i tehnološke entuzijaste kako bi razgovarali o budućnosti otvorenih podataka na Kosovu.",
        eventDateInfo2: "Datum: 12-13. Novembar 2024.",
        eventTimeInfo2: "Vreme: Ceo Dan",
        eventLocationInfo2: "Mesto: Hotel Emerald, Priština",

        // Map Specific
        mapLegendTitle: "Legenda Mape i Info",
        mapLegendHighPerf: "Visoke Performanse",
        mapLegendMedPerf: "Srednje Performanse",
        mapLegendLowPerf: "Niske Performanse",
        mapLegendDefault: "Podrazumevano / Nema Podataka",
        mapSelectedMunicipality: "Izabrana Opština:",
        mapClickPrompt: "Kliknite na marker da vidite detalje.",
        mapPopulation: "Populacija",
        mapPerformance: "Performanse",
        mapPerformanceHigh: "Visoke",
        mapPerformanceMedium: "Srednje",
        mapPerformanceLow: "Niske",
        mapScore: "Ocena",
        mapViewDetails: "Pogledaj Više Detalja",
        mapDataTableTitle: "Pregled Regionalnih Podataka",
        mapDataTableDesc: "Ovde bi mogla biti prikazana tabela koja sumira ključne indikatore za sve opštine. Za sada, ovo je rezervno mesto.",
        mapMayorLabel: "Gradonačelnik",
        mapCabinetMembersLabel: "Članovi Kabineta",
        dataNotAvailable: "Nije dostupno",

        notificationBannerText: "Obaveštenje:",
        mobileMenuToggle: "Otvori/Zatvori navigaciju",
        ariaLabelMainNav: "Glavna navigacija",
        ariaLabelLangMenu: "Izbor jezika",
        ariaLabelUserMenu: "Meni korisničkog naloga",
        ariaLabelCloseDetails: "Zatvori detalje ministarstva",
        chartAccessibilityLabel: "Grafikon učinka ministarstva",
        chartAccessibilityDesc: "Stubičasti grafikon koji prikazuje rezultate ministarstva. Koristite tastere sa strelicama za kretanje između stavki.",
        dataTableSummary: "Prikazano {start} do {end} od {total} unosa",
        paginationPage: "Stranica",
        loadingChartData: "Učitavanje vizuelizacije...",
        mapAccessibilityLabel: "Mapa opština Kosova",
        mapAccessibilityDesc: "Interaktivna mapa koja prikazuje učinak opština. Kliknite na markere za detalje.",
        errorMinistryDetails: "Učitavanje detalja ministarstva nije uspelo",
        validationSearchMinistry: "Unesite najmanje 3 karaktera",
        validationInvalidEmail: "Molimo unesite važeću email adresu",
        cookieConsentMessage: "Koristimo kolačiće kako bismo osigurali najbolje iskustvo.",
        cookieConsentAccept: "Prihvati",
        cookieConsentLearnMore: "Saznajte više"
    }
    };
    // END: Translations Object

    // START: CORE HELPER FUNCTIONS (Defined Early)
    function getTranslation(key, lang = currentLang, fallbackLangOrText = 'en') {
        let text = translations[lang]?.[key];
        if (text === undefined) { text = translations['en']?.[key]; }
        if (text === undefined) { text = (fallbackLangOrText !== 'en' && typeof fallbackLangOrText === 'string') ? fallbackLangOrText : key; }
        return text;
    }

    function capitalizeFirstLetter(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

    function debounce(func, delay) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }

    function showNotification(msgKey, isKey = true) {
        const msg = isKey ? getTranslation(msgKey) : msgKey;
        const banner = document.getElementById('notificationBanner');
        const notifMsg = document.getElementById('notificationMessage');
        if (banner && notifMsg) {
            notifMsg.innerHTML = msg;
            banner.classList.remove('hidden');
            if (currentNotificationTimeout) clearTimeout(currentNotificationTimeout);
            currentNotificationTimeout = setTimeout(() => banner.classList.add('hidden'), 3000);
        }
    }

    function showLoadingIndicator(isLoading) {
        if (isDashboardPage && chartContainer) {
            if (isLoading) {
                const canvas = chartContainer.querySelector('canvas#ministryScoreChart');
                if (!canvas || !chartContainer.textContent.includes(getTranslation('loadingData'))) {
                    chartContainer.innerHTML = `<p class="text-center p-4">${getTranslation('loadingData')}</p>`;
                }
            }
        }
    }
    // END: CORE HELPER FUNCTIONS

    // START: UI UPDATE FUNCTIONS
    function initializeSidebarActiveState() {
        const sidebarItems = document.querySelectorAll('#sidebar .sidebar-item');
        sidebarItems.forEach(item => {
            item.classList.remove('sidebar-active');
            const linkHref = item.getAttribute('href');
            if (linkHref) {
                const linkFilename = linkHref.split('/').pop();
                if (linkFilename === currentPageName) {
                    item.classList.add('sidebar-active');
                }
            }
        });
    }

    function updateAllUIText(lang) {
        document.querySelectorAll('[data-translate]').forEach(el => { // Changed from data-i18n-key to data-translate
            const key = el.getAttribute('data-translate');
            let trans = getTranslation(key, lang);
            if (el.tagName === 'TITLE') { document.title = trans; }
            else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || el.type === 'month' || el.type === 'number')) {
                if (el.hasAttribute('data-translate-placeholder')) { // Check for specific placeholder key
                    el.placeholder = getTranslation(el.getAttribute('data-translate-placeholder'), lang);
                } else {
                     el.placeholder = trans; // Fallback or if the main key is for placeholder
                }
            }
            else if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) { el.value = trans; }
            else if (el.tagName === 'TEXTAREA') { el.placeholder = trans; }
            else { el.innerHTML = trans; }
        });

        // Update ARIA labels if they have a data-translate-aria-label attribute
        document.querySelectorAll('[data-translate-aria-label]').forEach(el => {
            const key = el.getAttribute('data-translate-aria-label');
            el.setAttribute('aria-label', getTranslation(key, lang));
        });


        if (currentLanguageSpan) {
             // Special handling for the language indicator span
            if (currentLanguageSpan.hasAttribute('data-translate') && currentLanguageSpan.getAttribute('data-translate') === 'currentLangIndicator') {
                currentLanguageSpan.textContent = getTranslation(`language${lang.toUpperCase()}`).match(/([A-Z]{2})/)?.[0] || lang.toUpperCase();
            } else {
                currentLanguageSpan.textContent = lang.toUpperCase();
            }
        }


        if (isDashboardPage && typeof updateDynamicTitles === "function") updateDynamicTitles(lang);
        if (isDashboardPage && typeof populateCompareWithDropdown === "function" && allMinistriesData && allMinistriesData.length > 0) {
             populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
        }
    }

    function updateDynamicTitles(lang = currentLang) {
        if (!isDashboardPage) return;
        if (currentViewTitle) {
            const pillarName = getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`, lang);
            currentViewTitle.textContent = `${pillarName} ${getTranslation('viewTitleSuffix', lang)}`;
        }
        if (ministryBarChart?.options?.plugins?.tooltip) {
            ministryBarChart.data.datasets[0].label = `${getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`, currentLang)} ${getTranslation('tooltipScoreSuffix', currentLang)}`;
            if (ministryBarChart.ctx && ministryBarChart.attached !== false) {
                 ministryBarChart.update('none');
            }
        }
    }
    // END: UI UPDATE FUNCTIONS

    // START: Dashboard Specific Functions
    function updateKPICards(summary) {
        if (!isDashboardPage) return;
        const kpiMap = {
            avgTransparency: { valueEl: kpiElements.avgTransparencyValue, changeEl: kpiElements.avgTransparencyChange, dataKey: 'avgTransparency' },
            participationScore: { valueEl: kpiElements.participationScoreValue, changeEl: kpiElements.participationScoreChange, dataKey: 'participationScore' },
            efficiencyRating: { valueEl: kpiElements.efficiencyRatingValue, changeEl: kpiElements.efficiencyRatingChange, dataKey: 'efficiencyRating' },
            overallOutcome: { valueEl: kpiElements.overallOutcomeValue, changeEl: kpiElements.overallOutcomeChange, dataKey: 'overallOutcome' }
        };
        for (const key in kpiMap) {
            const item = kpiMap[key];
            if (item.valueEl) {
                const data = summary?.[item.dataKey];
                item.valueEl.textContent = (data?.value !== null && data?.value !== undefined && !isNaN(parseFloat(data.value))) ? `${parseFloat(data.value).toFixed(1)}%` : 'N/A';
                if (item.changeEl) {
                    item.changeEl.innerHTML = '';
                    let iconClass = 'fas fa-minus text-gray-500';
                    let textColor = 'text-gray-500';
                    let textContent = getTranslation('noChangeData');
                    if (data?.change !== null && data?.change !== undefined && !isNaN(parseFloat(data.change))) {
                        const changeValue = parseFloat(data.change);
                        if (changeValue > 0) { iconClass = 'fas fa-arrow-up text-green-500'; textColor = 'text-green-500'; }
                        else if (changeValue < 0) { iconClass = 'fas fa-arrow-down text-red-500'; textColor = 'text-red-500'; }
                        textContent = `${Math.abs(changeValue).toFixed(1)}% ${getTranslation('kpiChangeSinceLastQuarter')}`;
                    }
                    const iconElement = document.createElement('i'); iconElement.className = `${iconClass} mr-1`;
                    const textElement = document.createElement('span'); textElement.className = textColor; textElement.innerHTML = textContent;
                    item.changeEl.appendChild(iconElement); item.changeEl.appendChild(textElement);
                }
            } else {
                 console.warn(`SCRIPT.JS: KPI Element for ${key} not found.`);
            }
        }
    }

    function populateMinistryDetails(detailsData) {
        if (!isDashboardPage || !ministryDetailsSection) return;
        if (!detailsData || !detailsData.profile) {
            ministryDetailsSection.classList.add('hidden');
            if(selectedMinistryNameTitle) selectedMinistryNameTitle.innerHTML = getTranslation('detailsTitle');
            if(detailElements.transparencyScore) detailElements.transparencyScore.innerHTML = 'N/A';
            if(detailElements.transparencyChange) { detailElements.transparencyChange.innerHTML = getTranslation('noChangeData'); detailElements.transparencyChange.className = 'text-xs text-gray-500'; }
            if(detailElements.requests) detailElements.requests.innerHTML = 'N/A';
            if(detailElements.requestsProcessed) detailElements.requestsProcessed.innerHTML = 'N/A';
            if(detailElements.responseTime) detailElements.responseTime.innerHTML = 'N/A';
            if(detailElements.responseTimeChange) { detailElements.responseTimeChange.innerHTML = getTranslation('noChangeData'); detailElements.responseTimeChange.className = 'text-xs text-gray-500'; }
            for (let i = 1; i <= 5; i++) {
                if (perfBreakdownElements[`label${i}`]) {
                    perfBreakdownElements[`label${i}`].innerHTML = getTranslation(`perfBreakdownDefaultLabel${i}`);
                    if(perfBreakdownElements[`value${i}`]) perfBreakdownElements[`value${i}`].innerHTML = `0%`;
                    if(perfBreakdownElements[`bar${i}`]) perfBreakdownElements[`bar${i}`].style.width = `0%`;
                }
            }
            if (detailElements.recentActivitiesBody) detailElements.recentActivitiesBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${getTranslation('tableNoRecentActivities')}</td></tr>`;
            return;
        }
        const { profile, kpis, performanceBreakdown, activities } = detailsData;
        if (selectedMinistryNameTitle && profile) {
            selectedMinistryNameTitle.innerHTML = profile.name || getTranslation('detailsTitle');
            if (profile.id !== undefined) ministryDetailsSection.dataset.currentMinistryId = profile.id;
        }
        if (kpis) {
            if (detailElements.transparencyScore && kpis.transparencyScore) {
                detailElements.transparencyScore.innerHTML = (kpis.transparencyScore.value !== null && !isNaN(parseFloat(kpis.transparencyScore.value))) ? `${parseFloat(kpis.transparencyScore.value).toFixed(1)}%` : 'N/A';
                if (detailElements.transparencyChange) {
                    if (kpis.transparencyScore.change !== null && !isNaN(parseFloat(kpis.transparencyScore.change))) {
                        const chg = parseFloat(kpis.transparencyScore.change);
                        const pfx = chg === 0 ? '' : (chg > 0 ? '↑ +' : '↓ ');
                        detailElements.transparencyChange.innerHTML = `${pfx}${Math.abs(chg).toFixed(1)}% ${getTranslation('detailsChangeSinceLastPeriod')}`;
                        detailElements.transparencyChange.className = chg === 0 ? 'text-xs text-gray-500' : (chg > 0 ? 'text-xs text-green-500' : 'text-xs text-red-500');
                    } else { detailElements.transparencyChange.innerHTML = getTranslation('noChangeData'); detailElements.transparencyChange.className = 'text-xs text-gray-500'; }
                }
            }
            if (detailElements.requests && detailElements.requestsProcessed && kpis.infoRequests) {
                detailElements.requests.innerHTML = (kpis.infoRequests.received !== null && !isNaN(parseFloat(kpis.infoRequests.received))) ? parseFloat(kpis.infoRequests.received).toFixed(0) : 'N/A';
                if (kpis.infoRequests.processed !== null && kpis.infoRequests.received !== null) {
                    const receivedNum = parseFloat(kpis.infoRequests.received);
                    const processedNum = parseFloat(kpis.infoRequests.processed);
                    let subText = 'N/A';
                    if (!isNaN(receivedNum) && !isNaN(processedNum)) {
                        let percStr = '';
                        if (typeof kpis.infoRequests.percentage_processed === 'number') { percStr = ` (${parseFloat(kpis.infoRequests.percentage_processed).toFixed(1)}%)`; }
                        else if (receivedNum > 0) { const perc = (processedNum / receivedNum) * 100; percStr = ` (${perc.toFixed(1)}%)`; }
                        else if (processedNum === 0 && receivedNum === 0) { percStr = ` (0.0%)`; }
                        else { percStr = ` (N/A%)`; }
                        const icon = `<svg class="w-4 h-4 text-green-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`;
                        subText = icon + `${processedNum.toFixed(0)} ${getTranslation('infoRequestsProcessed')}${percStr}`;
                    }
                    detailElements.requestsProcessed.innerHTML = subText;
                } else { detailElements.requestsProcessed.innerHTML = 'N/A'; }
            }
            if (detailElements.responseTime && detailElements.responseTimeChange && kpis.responseTime) {
                const unit = getTranslation(kpis.responseTime.unit || 'daysUnit');
                detailElements.responseTime.innerHTML = (kpis.responseTime.value !== null && !isNaN(parseFloat(kpis.responseTime.value))) ? `${parseFloat(kpis.responseTime.value).toFixed(1)} <span class="text-base font-normal text-gray-500">${unit}</span>` : 'N/A';
                if (kpis.responseTime.change !== null && !isNaN(parseFloat(kpis.responseTime.change))) {
                    const changeNum = parseFloat(kpis.responseTime.change);
                    const pfx = changeNum === 0 ? '' : (changeNum > 0 ? '↑ +' : '↓ ');
                    detailElements.responseTimeChange.innerHTML = `${pfx}${Math.abs(changeNum).toFixed(1)} ${unit} ${getTranslation('detailsChangeSinceLastPeriod')}`;
                    detailElements.responseTimeChange.className = changeNum === 0 ? 'text-xs text-gray-500' : (changeNum > 0 ? 'text-xs text-red-500' : 'text-xs text-green-500');
                } else { detailElements.responseTimeChange.innerHTML = getTranslation('noChangeData'); detailElements.responseTimeChange.className = 'text-xs text-gray-500'; }
            }
        }
        if (performanceBreakdown && Array.isArray(performanceBreakdown)) {
            for (let i = 0; i < 5; i++) {
                const item = performanceBreakdown[i];
                if (perfBreakdownElements[`label${i+1}`]) {
                    if (item?.labelKey) {
                        perfBreakdownElements[`label${i+1}`].innerHTML = getTranslation(item.labelKey);
                        const itemValue = (item.value !== null && !isNaN(parseFloat(item.value))) ? parseFloat(item.value).toFixed(0) : 0;
                        if(perfBreakdownElements[`value${i+1}`]) perfBreakdownElements[`value${i+1}`].innerHTML = `${itemValue}%`;
                        if(perfBreakdownElements[`bar${i+1}`]) perfBreakdownElements[`bar${i+1}`].style.width = `${itemValue}%`;
                    } else {
                        perfBreakdownElements[`label${i+1}`].innerHTML = getTranslation(`perfBreakdownDefaultLabel${i+1}`);
                        if(perfBreakdownElements[`value${i+1}`]) perfBreakdownElements[`value${i+1}`].innerHTML = `0%`;
                        if(perfBreakdownElements[`bar${i+1}`]) perfBreakdownElements[`bar${i+1}`].style.width = `0%`;
                    }
                }
            }
        }
        const acts = activities || detailsData.recentActivities;
        if (detailElements.recentActivitiesBody) {
            detailElements.recentActivitiesBody.innerHTML = '';
            if (acts && Array.isArray(acts) && acts.length > 0) {
                acts.forEach(act => {
                    const row = detailElements.recentActivitiesBody.insertRow();
                    row.insertCell().innerHTML = (act && act.activity_date) ? act.activity_date : 'N/A';
                    let originalTitle = (act && act.title) ? act.title : 'N/A';
                    let titleText = originalTitle;
                    const knownPrefixes = [ { key: 'activityPrefixPublicEvent', original: 'Public Event: '}, { key: 'activityPrefixReportRelease', original: 'Report Release: '}, { key: 'activityPrefixNewInitiative', original: 'New Initiative: '}, { key: 'activityPrefixConsultationDocument', original: 'Consultation Document: '} ];
                    for (const prefix of knownPrefixes) { if (originalTitle.startsWith(getTranslation(prefix.key, 'en')) || originalTitle.startsWith(prefix.original)) { const actualPrefix = getTranslation(prefix.key, currentLang); const titleWithoutPrefix = originalTitle.substring( (originalTitle.startsWith(getTranslation(prefix.key, 'en')) ? getTranslation(prefix.key, 'en') : prefix.original).length ); titleText = actualPrefix + titleWithoutPrefix; break; } }
                    row.insertCell().innerHTML = titleText;
                    const statusCell = row.insertCell(); const statusSpan = document.createElement('span');
                    let statusTextKey = (act && act.status && act.status.toLowerCase() === getTranslation('tableStatusInProgress', 'en').toLowerCase()) ? 'tableStatusInProgress' : 'tableStatusCompleted';
                    statusSpan.innerHTML = getTranslation(statusTextKey, currentLang);
                    statusSpan.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusTextKey === 'tableStatusInProgress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`;
                    statusCell.appendChild(statusSpan);
                });
            } else {
                const row = detailElements.recentActivitiesBody.insertRow(); const cell = row.insertCell(); cell.colSpan = 3;
                cell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center';
                cell.innerHTML = getTranslation('tableNoRecentActivities');
            }
        }
        ministryDetailsSection.classList.remove('hidden');
    }

    function renderChart(data) {
        if (!isDashboardPage || !chartContainer) return;
        chartContainer.innerHTML = '';
        if (!data || !data.length) {
            chartContainer.innerHTML = `<p class="text-center p-4 text-gray-500">${getTranslation('tableNoDataToDisplay')}</p>`;
            if (ministryBarChart) { ministryBarChart.destroy(); ministryBarChart = null; }
            return;
        }
        const canvas = document.createElement('canvas'); canvas.id = 'ministryScoreChart';
        const baseHeight = 50; const itemHeight = 30; const maxHeight = 700; const minHeight = 300;
        canvas.height = Math.min(maxHeight, Math.max(minHeight, (data.length * itemHeight) + baseHeight));
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("SCRIPT.JS: renderChart: Failed to get 2D context for canvas!");
            return;
        }

        const labels = data.map(m => m.name);
        const scores = data.map(m => m.score);
        const HIGH_SCORE_THRESHOLD = 70; const MEDIUM_SCORE_THRESHOLD = 40;
        const COLOR_HIGH_BG = 'rgba(75,192,192,0.7)'; const COLOR_HIGH_BD = 'rgba(75,192,192,1)';
        const COLOR_MEDIUM_BG = 'rgba(255,206,86,0.7)'; const COLOR_MEDIUM_BD = 'rgba(255,206,86,1)';
        const COLOR_LOW_RED_BG = 'rgba(255, 99, 132, 0.7)'; const COLOR_LOW_RED_BD = 'rgba(255, 99, 132, 1)';
        const COLOR_NA_BG = 'rgba(200,200,200,0.7)'; const COLOR_NA_BD = 'rgba(200,200,200,1)';
        const bgColors = scores.map(s => { const val = parseFloat(s); if (s === null || s === undefined || isNaN(val)) return COLOR_NA_BG; if (val >= HIGH_SCORE_THRESHOLD) return COLOR_HIGH_BG; if (val >= MEDIUM_SCORE_THRESHOLD) return COLOR_MEDIUM_BG; return COLOR_LOW_RED_BG; });
        const bdColors = scores.map(s => { const val = parseFloat(s); if (s === null || s === undefined || isNaN(val)) return COLOR_NA_BD; if (val >= HIGH_SCORE_THRESHOLD) return COLOR_HIGH_BD; if (val >= MEDIUM_SCORE_THRESHOLD) return COLOR_MEDIUM_BD; return COLOR_LOW_RED_BD; });

        if (ministryBarChart) {
            ministryBarChart.destroy();
            ministryBarChart = null;
        }
        try {
            ministryBarChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: `${getTranslation(`tab${capitalizeFirstLetter(currentPillar)}`, currentLang)} ${getTranslation('tooltipScoreSuffix', currentLang)}`, data: scores, backgroundColor: bgColors, borderColor: bdColors, borderWidth: 1 }] },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    scales: {x: {beginAtZero: true,max: 100,title: { display: true, text: getTranslation('tooltipScoreSuffix') }},y: {ticks: { autoSkip: false, font: { size: 10 } }}},
                    onClick: (evt, elems) => { if (elems && elems.length > 0) { const item = data[elems[0].index]; if (item && typeof item.id !== 'undefined') { if (ministryDetailsSection) { ministryDetailsSection.classList.remove('hidden'); ministryDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } const period = document.getElementById('timePeriod')?.value || 'q2-2023'; if (typeof loadAndRenderMinistryDetails === "function") loadAndRenderMinistryDetails(item.id, period); } } },
                    plugins: { legend: {display: false}, tooltip: { enabled: true, callbacks: { title: (items) => data[items[0].dataIndex].name || '', label: (ctx) => `${ctx.dataset.label || ''}: ${ctx.parsed.x?.toFixed(1) ?? 'N/A'}`, afterBody: (items) => { const m = data[items[0].dataIndex]; let dets = []; if (m?.category_key) dets.push(`${getTranslation('categoryLabel', currentLang)}: ${getTranslation(`category${capitalizeFirstLetter(m.category_key)}`, currentLang, capitalizeFirstLetter(m.category_key))}`); if (m?.minister_name) dets.push(`${getTranslation('ministerLabel', currentLang)}: ${m.minister_name}`); if (m?.cabinet_members?.length) { dets.push(''); dets.push(`${getTranslation('tooltipKeyMembers', currentLang)}:`); m.cabinet_members.forEach(mem => { if (mem?.trim()) dets.push(`- ${mem}`); });} dets.push(''); dets.push(`(${getTranslation('tooltipClickForDetails', currentLang)})`); return dets;} } }, datalabels: { anchor: 'end', align: 'right', offset: 4, color: function(context) { const score = context.dataset.data[context.dataIndex]; const val = parseFloat(score); if (score === null || score === undefined || isNaN(val)) return '#666'; if (val >= HIGH_SCORE_THRESHOLD) return '#333'; if (val >= MEDIUM_SCORE_THRESHOLD) return '#333'; return '#FFF'; }, font: {weight: 'bold',size: 10,}, formatter: function(value) {return (value !== null && value !== undefined && !isNaN(parseFloat(value))) ? parseFloat(value).toFixed(1) : 'N/A';} } }
                }
            });
        } catch (e) { console.error("SCRIPT.JS: Chart instantiation ERROR:", e); }
    }

    function applyFiltersAndSort() {
        if (!isDashboardPage) return;
        if (typeof allMinistriesData === 'undefined' || !allMinistriesData) {
            if (typeof renderChart === "function") renderChart([]); return;
        }
        let fData = [...allMinistriesData];
        let pmoItem = null; const PMO_ID = 0;
        const pmoIndexInFData = fData.findIndex(m => m.id === PMO_ID);
        if (pmoIndexInFData > -1) pmoItem = fData.splice(pmoIndexInFData, 1)[0];
        const searchTerm = document.getElementById('searchMinistryInput')?.value.toLowerCase() || '';
        if (searchTerm) fData = fData.filter(m => (m.name || '').toLowerCase().includes(searchTerm));
        const ministryType = document.getElementById('ministryTypeFilter')?.value || 'all';
        if (ministryType !== 'all') fData = fData.filter(m => m.category_key === ministryType);
        const minScoreInput = document.getElementById('minScoreFilter')?.value;
        const maxScoreInput = document.getElementById('maxScoreFilter')?.value;
        const minScore = (minScoreInput !== "" && !isNaN(parseFloat(minScoreInput))) ? parseFloat(minScoreInput) : 0;
        const maxScore = (maxScoreInput !== "" && !isNaN(parseFloat(maxScoreInput))) ? parseFloat(maxScoreInput) : 100;
        fData = fData.filter(m => { const score = m.score; if (score === null || score === undefined || isNaN(parseFloat(score))) return false; return parseFloat(score) >= minScore && parseFloat(score) <= maxScore; });
        switch (currentSortGlobal) {
            case 'score-desc': fData.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)); break;
            case 'score-asc': fData.sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity)); break;
            case 'name-asc': fData.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
            case 'name-desc': fData.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
            default: fData.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        }
        if (pmoItem) {
            let pmoVisible = true;
            if (searchTerm && !(pmoItem.name || '').toLowerCase().includes(searchTerm)) pmoVisible = false;
            if (ministryType !== 'all' && pmoItem.category_key !== ministryType) pmoVisible = false;
            const pmoScoreVal = pmoItem.score;
            if (pmoScoreVal === null || pmoScoreVal === undefined || isNaN(parseFloat(pmoScoreVal))) { if (!(minScore === 0 && maxScore === 100)) pmoVisible = false; }
            else if (!(parseFloat(pmoScoreVal) >= minScore && parseFloat(pmoScoreVal) <= maxScore)) pmoVisible = false;
            if (pmoVisible) fData.unshift(pmoItem);
        }
        if (typeof renderChart === "function") renderChart(fData);
    }

    function populateCompareWithDropdown(ministries, selectedValue) {
        if (!isDashboardPage) return;
        const compareWithSel = document.getElementById('compareWithFilter');
        if (!compareWithSel) return;
        const currentSelection = selectedValue || compareWithSel.value;
        let optionsHtml = `<option value="none" data-translate="optionNoComparison">${getTranslation('optionNoComparison')}</option>`;
        optionsHtml += `<option value="q1-2023" data-translate="periodQ1_2023_compare">${getTranslation('periodQ1_2023_compare')}</option>`;
        optionsHtml += `<option value="q4-2022" data-translate="periodQ4_2022_compare">${getTranslation('periodQ4_2022_compare')}</option>`;
        optionsHtml += `<option value="q2-2022" data-translate="periodQ2_2022_yoy">${getTranslation('periodQ2_2022_yoy')}</option>`;
        optionsHtml += `<option value="annual-2022" data-translate="periodAnnual_2022_compare">${getTranslation('periodAnnual_2022_compare')}</option>`;
        compareWithSel.innerHTML = optionsHtml;
        if (currentSelection && Array.from(compareWithSel.options).some(opt => opt.value === currentSelection)) {
            compareWithSel.value = currentSelection;
        } else {
            compareWithSel.value = "none";
        }
    }

    async function loadAndRenderMinistryDetails(id, period) {
        if (!isDashboardPage) return;
        showLoadingIndicator(true);
        const cacheKey = `${id}-${currentLang}-${period}`;
        if(apiDataCache.details[cacheKey]){
            populateMinistryDetails(apiDataCache.details[cacheKey]);
            showLoadingIndicator(false); return;
        }
        try {
            const url = `${API_BASE_URL}/ministry_details/${id}?lang=${currentLang}&period=${period}`;
            const resp = await fetch(url);
            if(!resp.ok){ const errTxt = await resp.text(); console.error(`Ministry details fetch HTTP error ${resp.status} for ID ${id}, Period ${period}: ${errTxt}`); populateMinistryDetails(null); throw new Error(`HTTP error! ${resp.status}, ${errTxt}`); }
            const data = await resp.json();
            if(!data){ console.warn(`Ministry details API returned no data for ID ${id}, Period ${period}.`); populateMinistryDetails(null); }
            else { apiDataCache.details[cacheKey]=data; populateMinistryDetails(data); }
        } catch(e){
            console.error('Ministry details fetch/processing error:', e);
            if(selectedMinistryNameTitle)selectedMinistryNameTitle.innerHTML=getTranslation('errorFetchingData');
            populateMinistryDetails(null);
        } finally {
            showLoadingIndicator(false);
        }
    }

    async function fetchDashboardData(pillar, lang, period) {
        if (!isDashboardPage) {
            if(typeof showLoadingIndicator === "function") showLoadingIndicator(false);
            return;
        }
        console.log(`SCRIPT.JS: fetchDashboardData called. Pillar: ${pillar}, Lang: ${lang}, Period: ${period}`);
        if(typeof showLoadingIndicator === "function") showLoadingIndicator(true);
        if(ministryDetailsSection) ministryDetailsSection.classList.add('hidden');
        const dataCacheKey = `allData-${lang}-${period}`;

        if(apiDataCache.dashboard[dataCacheKey]){
            console.log("SCRIPT.JS: Using cached dashboard data for key:", dataCacheKey);
            const cachedData = apiDataCache.dashboard[dataCacheKey];
            allMinistriesData = cachedData.ministries || [];
            if(typeof updateKPICards === "function") updateKPICards(cachedData.kpi_summary);
            if (typeof applyFiltersAndSort === "function") applyFiltersAndSort();
            if (typeof populateCompareWithDropdown === "function" && allMinistriesData) {
                populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            }
            if(typeof showLoadingIndicator === "function") showLoadingIndicator(false);
            return;
        }

        const apiCallPillar = pillar;
        console.log("SCRIPT.JS: Fetching NEW API data for dashboard. API Pillar:", apiCallPillar, "Lang:", lang, "Period:", period);
        try {
            const url = `${API_BASE_URL}/dashboard_data?pillar=${apiCallPillar}&lang=${lang}&period=${period}`;
            const resp = await fetch(url);
            if(!resp.ok){ const errTxt = await resp.text(); console.error("Dashboard API Error:", resp.status, errTxt); throw new Error(`HTTP error! ${resp.status}, ${errTxt}`); }
            const data = await resp.json();

            if(!data||typeof data.kpi_summary==='undefined'||typeof data.ministries==='undefined'){
                console.warn("SCRIPT.JS: Dashboard API data malformed.", data);
                if(typeof updateKPICards === "function") updateKPICards(null);
                allMinistriesData=[];
            } else {
                apiDataCache.dashboard[dataCacheKey]=data;
                allMinistriesData=data.ministries||[];
                if(typeof updateKPICards === "function") updateKPICards(data.kpi_summary);
            }

            if (typeof applyFiltersAndSort === "function") applyFiltersAndSort();
            if (typeof populateCompareWithDropdown === "function" && allMinistriesData) {
                populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            }
        } catch(e){
            console.error('SCRIPT.JS: Dashboard API fetch/processing error:', e);
            if(chartContainer) chartContainer.innerHTML = `<p class="text-red-500 text-center p-4">${getTranslation('errorFetchingData')}</p>`;
            if(typeof updateKPICards === "function") updateKPICards(null);
            allMinistriesData=[];
            if (typeof applyFiltersAndSort === "function") applyFiltersAndSort();
            if (typeof populateCompareWithDropdown === "function" && allMinistriesData) {
                populateCompareWithDropdown(allMinistriesData, document.getElementById('compareWithFilter')?.value);
            }
        } finally {
            if(typeof showLoadingIndicator === "function") showLoadingIndicator(false);
        }
    }
    // END: Dashboard Specific Functions

    // START: initializeKosovoMap Function (for local_government.html - with updated tooltips)
    function initializeKosovoMap() {
        const mapElement = document.getElementById('kosovoMap');
        if (!mapElement) { return; }
        if (typeof L === 'undefined') { console.error("SCRIPT.JS: Leaflet library (L) is not loaded."); return; }
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({ iconRetinaUrl: '/static/leaflet/images/marker-icon-2x.png', iconUrl: '/static/leaflet/images/marker-icon.png', shadowUrl: '/static/leaflet/images/marker-shadow.png', });
        if (kosovoMapInstance) { kosovoMapInstance.remove(); kosovoMapInstance = null; }
        console.log("SCRIPT.JS: Initializing Kosovo Map for Local Government page...");
        const mapCenter = [42.6026, 20.9030];
        kosovoMapInstance = L.map('kosovoMap').setView(mapCenter, 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18, }).addTo(kosovoMapInstance);

        const municipalities = [
            { name: "Prishtinë / Priština", lat: 42.6629, lng: 21.1655, data: { population: "198,897 (2011)", performance: "High", score: 85, mayor: "Përparim Rama", cabinet_members: ["Donjeta Sahatçiu", "Alban Zogaj", "Florian Dushi", "Arbërie Nagavci", "Krenare Sogojeva-Dermaku"] } },
            { name: "Prizren", lat: 42.2153, lng: 20.7414, data: { population: "177,781 (2011)", performance: "Medium", score: 65, mayor: "Shaqir Totaj", cabinet_members: ["Hanefi Muharremi", "Mevlan Krasniqi", "Manushaqe Koci", "Visar Islamaj", "Pacinda Kelmendi"] } },
            { name: "Ferizaj / Uroševac", lat: 42.3708, lng: 21.1461, data: { population: "108,610 (2011)", performance: "High", score: 90, mayor: "Agim Aliu", cabinet_members: ["Cabinet F", "Cabinet G", "Cabinet H"] } },
            { name: "Pejë / Peć", lat: 42.6592, lng: 20.2883, data: { population: "96,450 (2011)", performance: "Low", score: 35, mayor: "Gazmend Muhaxheri", cabinet_members: ["Team X", "Team Y", "Team Z", "Team W"] } },
            { name: "Gjakovë / Đakovica", lat: 42.3792, lng: 20.4294, data: { population: "94,556 (2011)", performance: "Medium", score: 55, mayor: "Ardian Gjini", cabinet_members: ["Person 1", "Person 2", "Person 3"] } },
            { name: "Gjilan / Gnjilane", lat: 42.4628, lng: 21.4694, data: { population: "90,178 (2011)", performance: "High", score: 78, mayor: "Alban Hyseni", cabinet_members: ["Kabineti A", "Kabineti B", "Kabineti C", "Kabineti D"] } },
            { name: "Podujevë / Podujevo", lat: 42.9108, lng: 21.1925, data: { population: "88,499 (2011)", performance: "Medium", score: 60, mayor: "Shpejtim Bulliqi", cabinet_members: ["Anëtar Kabineti 1", "Anëtar Kabineti 2", "Anëtar Kabineti 3", "Anëtar Kabineti 4"] } },
            { name: "Mitrovicë / Mitrovica (South)", lat: 42.8914, lng: 20.8660, data: { population: "71,909 (2011, South only)", performance: "Low", score: 40, mayor: "Bedri Hamza", cabinet_members: ["Član A", "Član B", "Član C"] } },
            { name: "Vushtrri / Vučitrn", lat: 42.8225, lng: 20.9656, data: { population: "69,870 (2011)", performance: "Medium", score: 62, mayor: "Ferit Idrizi", cabinet_members: ["Ekipi 1", "Ekipi 2", "Ekipi 3", "Ekipi 4", "Ekipi 5"] } },
            { name: "Suharekë / Suva Reka", lat: 42.3594, lng: 20.8256, data: { population: "59,722 (2011)", performance: "High", score: 75, mayor: "Bali Muharremaj", cabinet_members: ["A. Name", "B. Surname", "C. Othername"] } },
            { name: "Rahovec / Orahovac", lat: 42.3986, lng: 20.6547, data: { population: "56,208 (2011)", performance: "Medium", score: 50, mayor: "Smajl Latifi", cabinet_members: ["Member Alpha", "Member Beta", "Member Gamma"] } },
            { name: "Drenas / Glogovac", lat: 42.6217, lng: 20.8950, data: { population: "58,531 (2011)", performance: "High", score: 82, mayor: "Ramiz Lladrovci", cabinet_members: ["Personi X", "Personi Y", "Personi Z", "Personi W"] } },
            { name: "Lipjan / Lipljan", lat: 42.5228, lng: 21.1242, data: { population: "57,605 (2011)", performance: "Medium", score: 68, mayor: "Imri Ahmeti", cabinet_members: ["Team Member 1", "Team Member 2", "Team Member 3"] } },
            { name: "Malishevë / Mališevo", lat: 42.4825, lng: 20.7439, data: { population: "54,613 (2011)", performance: "Low", score: 30, mayor: "Ekrem Kastrati", cabinet_members: ["Antari 1", "Antari 2", "Antari 3", "Antari 4", "Antari 5"] } },
            { name: "Kamenicë / Kosovska Kamenica", lat: 42.5772, lng: 21.5806, data: { population: "36,085 (2011)", performance: "Medium", score: 58, mayor: "Kadri Rahimaj", cabinet_members: ["Ime Prezime 1", "Ime Prezime 2", "Ime Prezime 3"] } },
            { name: "Viti / Vitina", lat: 42.3194, lng: 21.3581, data: { population: "46,987 (2011)", performance: "High", score: 77, mayor: "Sokol Haliti", cabinet_members: ["Pjestari A", "Pjestari B", "Pjestari C"] } },
            { name: "Deçan / Dečani", lat: 42.5378, lng: 20.2889, data: { population: "40,019 (2011)", performance: "Medium", score: 61, mayor: "Bashkim Ramosaj", cabinet_members: ["Emri Mbiemri", "Tjetri Mbiemri", "I Treti Mbiemri"] } },
            { name: "Istog / Istok", lat: 42.7803, lng: 20.4853, data: { population: "39,289 (2011)", performance: "Low", score: 42, mayor: "Ilir Ferati", cabinet_members: ["Anëtar Ekipi X", "Anëtar Ekipi Y", "Anëtar Ekipi Z"] } },
            { name: "Klinë / Klina", lat: 42.6211, lng: 20.5764, data: { population: "38,496 (2011)", performance: "Medium", score: 53, mayor: "Zenun Elezaj", cabinet_members: ["Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"] } },
            { name: "Skenderaj / Srbica", lat: 42.7464, lng: 20.7889, data: { population: "50,858 (2011)", performance: "High", score: 80, mayor: "Fadil Nura", cabinet_members: ["Anëtar #1", "Anëtar #2", "Anëtar #3", "Anëtar #4"] } },
            { name: "Dragash / Dragaš", lat: 42.0625, lng: 20.6533, data: { population: "33,997 (2011)", performance: "Medium", score: 66, mayor: "Bexhet Xheladini", cabinet_members: ["John Doe", "Jane Smith", "Peter Jones"] } },
            { name: "Fushë Kosovë / Kosovo Polje", lat: 42.6389, lng: 21.0919, data: { population: "34,827 (2011)", performance: "High", score: 88, mayor: "Burim Berisha", cabinet_members: ["M.P.", "A.B.", "C.D.", "E.F.", "G.H."] } },
            { name: "Kaçanik / Kačanik", lat: 42.2294, lng: 21.2556, data: { population: "33,409 (2011)", performance: "Medium", score: 59, mayor: "Besim Ilazi", cabinet_members: ["Anëtar Z", "Anëtar W", "Anëtar Q", "Anëtar R"] } },
            { name: "Shtime / Štimlje", lat: 42.4317, lng: 21.0389, data: { population: "27,324 (2011)", performance: "High", score: 76, mayor: "Qemajl Aliu", cabinet_members: ["Personi A", "Personi B", "Personi C", "Personi D", "Personi E"] } },
            { name: "Obiliq / Obilić", lat: 42.6908, lng: 21.0733, data: { population: "21,549 (2011)", performance: "Low", score: 38, mayor: "Xhafer Gashi", cabinet_members: ["N.N.", "M.M.", "O.O."] } },
            { name: "Graçanicë / Gračanica", lat: 42.6006, lng: 21.1953, data: { population: "10,675 (2011)", performance: "Medium", score: 63, mayor: "Ljiljana Šubarić", cabinet_members: ["Član Kabineta 1", "Član Kabineta 2", "Član Kabineta 3"] } },
            { name: "Junik", lat: 42.4761, lng: 20.2767, data: { population: "6,084 (2011)", performance: "High", score: 79, mayor: "Ruzhdi Shehu", cabinet_members: ["Person P", "Person Q", "Person R", "Person S"] } },
            { name: "Hani i Elezit / Elez Han", lat: 42.1461, lng: 21.2989, data: { population: "9,403 (2011)", performance: "Medium", score: 57, mayor: "Mehmet Ballazhi", cabinet_members: ["Anëtar Test", "Anëtar Prova", "Anëtar Beta"] } },
            { name: "Mamushë / Mamuša", lat: 42.3153, lng: 20.7264, data: { population: "5,507 (2011)", performance: "Low", score: 45, mayor: "Abdulhadi Krasniç", cabinet_members: ["Üye CC1", "Üye CC2", "Üye CC3", "Üye CC4"] } },
            { name: "Novobërdë / Novo Brdo", lat: 42.6131, lng: 21.4336, data: { population: "6,729 (2011)", performance: "Medium", score: 64, mayor: "Sasha Milosevic", cabinet_members: ["Član DD1", "Član DD2", "Član DD3", "Član DD4", "Član DD5"] } },
            { name: "Partesh / Parteš", lat: 42.4022, lng: 21.4289, data: { population: "1,787 (2011)", performance: "High", score: 81, mayor: "Dragan Petković", cabinet_members: ["Osoba EE1", "Osoba EE2"] } },
            { name: "Ranillug / Ranilug", lat: 42.4914, lng: 21.6161, data: { population: "3,866 (2011)", performance: "Medium", score: 56, mayor: "Katarina Ristić-Ilić", cabinet_members: ["Saradnik FF1", "Saradnik FF2", "Saradnik FF3"] } },
            { name: "Shtërpcë / Štrpce", lat: 42.2375, lng: 21.0258, data: { population: "6,949 (2011)", performance: "Low", score: 33, mayor: "Dalibor Jevtić", cabinet_members: ["Kolega GG1", "Kolega GG2", "Kolega GG3", "Kolega GG4"] } },
            { name: "Zubin Potok", lat: 42.9144, lng: 20.6897, data: { population: "6,616 (est.)", performance: "Medium", score: 52, mayor: "Izmir Zeqiri", cabinet_members: ["Placeholder HH1", "Placeholder HH2", "Placeholder HH3", "Placeholder HH4"] } },
            { name: "Zveçan / Zvečan", lat: 42.9069, lng: 20.8406, data: { population: "7,481 (est.)", performance: "Low", score: 48, mayor: "Ilir Peci", cabinet_members: ["Tim II1", "Tim II2"] } },
            { name: "Leposaviq / Leposavić", lat: 43.1031, lng: 20.8006, data: { population: "13,773 (est.)", performance: "Medium", score: 51, mayor: "Lulzim Hetemi", cabinet_members: ["Anëtar JJ1", "Anëtar JJ2", "Anëtar JJ3", "Anëtar JJ4", "Anëtar JJ5"] } },
            { name: "Mitrovica Veriore / Severna Mitrovica", lat: 42.8972, lng: 20.8642, data: { population: "12,326 (est.)", performance: "Low", score: 36, mayor: "Erden Atiq", cabinet_members: ["Član KK1", "Član KK2", "Član KK3"] } },
            { name: "Kllokot / Klokot", lat: 42.3703, lng: 21.3781, data: { population: "2,556 (2011)", performance: "High", score: 72, mayor: "Vladan Bogdanović", cabinet_members: ["Person LL1", "Person LL2", "Person LL3", "Person LL4"] } }
        ];
        const infoPanel = document.getElementById('municipalityInfoPanel');
        const defaultInfoText = getTranslation('mapClickPrompt');
        if (infoPanel) infoPanel.innerHTML = `<p class="text-gray-500 text-sm italic">${defaultInfoText}</p>`;

        municipalities.forEach(muni => {
            if (typeof muni.lat !== 'number' || typeof muni.lng !== 'number') { console.warn(`SCRIPT.JS: Invalid or missing coords for ${muni.name}. Skipping marker.`); return; }

            let markerColor = 'blue';
            let iconHtml = `<i class="fas fa-map-marker-alt" style="color: white; font-size: 14px;"></i>`;
            if (muni.data && muni.data.performance) {
                switch (muni.data.performance.toLowerCase()) {
                    case 'high': markerColor = 'green'; iconHtml = `<i class="fas fa-check-circle" style="color: white; font-size: 14px;"></i>`; break;
                    case 'medium': markerColor = 'orange'; iconHtml = `<i class="fas fa-exclamation-circle" style="color: white; font-size: 14px;"></i>`; break;
                    case 'low': markerColor = 'red'; iconHtml = `<i class="fas fa-times-circle" style="color: white; font-size: 14px;"></i>`; break;
                }
            } else { console.warn(`SCRIPT.JS: No performance data for ${muni.name}, using default marker.`); }

            const customMarkerIcon = L.divIcon({
                html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">${iconHtml}</div>`,
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28]
            });

            try {
                const marker = L.marker([muni.lat, muni.lng], {icon: customMarkerIcon}).addTo(kosovoMapInstance);

                let tooltipHtml = `<div style="min-width: 180px;">`;
                tooltipHtml += `<div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${muni.name}</div>`;
                const mayorName = (muni.data && muni.data.mayor) ? muni.data.mayor : getTranslation('dataNotAvailable');
                tooltipHtml += `<div><strong style="color: #333;">${getTranslation('mapMayorLabel')}:</strong> ${mayorName}</div>`;
                if (muni.data && muni.data.cabinet_members && muni.data.cabinet_members.length > 0) {
                    tooltipHtml += `<div style="margin-top: 5px;"><strong style="color: #333;">${getTranslation('mapCabinetMembersLabel')}:</strong>`;
                    tooltipHtml += `<ul style="list-style-type: none; padding-left: 0; margin-top: 2px; max-height: 70px; overflow-y: auto;">`;
                    muni.data.cabinet_members.slice(0, 5).forEach(member => {
                        tooltipHtml += `<li style="font-size: 0.9em; color: #555;">- ${member}</li>`;
                    });
                    tooltipHtml += `</ul></div>`;
                }
                tooltipHtml += `</div>`;

                marker.bindTooltip(tooltipHtml, {
                    permanent: false,
                    direction: 'top',
                    opacity: 0.95,
                    offset: L.point(0, -30),
                    className: 'kosovo-map-tooltip'
                });

                marker.on('click', function() {
                    if (infoPanel) {
                        infoPanel.innerHTML = `<h5 class="text-md font-semibold text-gray-800 mb-1">${muni.name}</h5>
                            ${muni.data.mayor ? `<p class="text-sm text-gray-600">${getTranslation('mapMayorLabel')}: ${muni.data.mayor}</p>` : ''}
                            ${muni.data.population ? `<p class="text-sm text-gray-600">${getTranslation('mapPopulation')}: ${muni.data.population}</p>` : ''}
                            ${muni.data.performance ? `<p class="text-sm text-gray-600">${getTranslation('mapPerformance')}: <span style="color:${markerColor}; font-weight:bold;">${getTranslation('mapPerformance' + muni.data.performance, currentLang, muni.data.performance)}</span></p>` : ''}
                            ${muni.data.score !== undefined ? `<p class="text-sm text-gray-600">${getTranslation('mapScore')}: ${muni.data.score}/100</p>` : ''}
                            ${(muni.data.cabinet_members && muni.data.cabinet_members.length > 0) ? `<div class="mt-2"><p class="text-sm font-medium text-gray-700">${getTranslation('mapCabinetMembersLabel')}:</p><ul class="list-disc list-inside text-xs text-gray-600">${muni.data.cabinet_members.map(m => `<li>${m}</li>`).join('')}</ul></div>` : ''}
                            <a href="#" class="text-xs text-blue-600 hover:underline mt-2 inline-block">${getTranslation('mapViewDetails')}</a>`;
                    }
                });
            } catch (markerError) { console.error(`SCRIPT.JS: Error creating/adding marker for ${muni.name}:`, markerError); }
        });
        console.log("SCRIPT.JS: Kosovo Map initialized with markers (tooltips show mayor & cabinet).");
    }
    // END: initializeKosovoMap Function

    // START: CORE LOGIC FUNCTIONS
    function setLanguage(lang) {
        if(lang !== currentLang){
            currentLang = lang;
            localStorage.setItem('preferredLang', lang); // Save preference
            updateAllUIText(lang);
            showNotification(`${getTranslation('notificationLangSwitchPrefix')} ${getTranslation(`language${lang.toUpperCase()}`)}`, false); // Pass false since message is pre-constructed
            if (isDashboardPage) {
                const periodVal = document.getElementById('timePeriod')?.value || 'q2-2023';
                if(typeof fetchDashboardData === "function") fetchDashboardData(currentPillar, currentLang, periodVal);
                if(ministryDetailsSection && !ministryDetailsSection.classList.contains('hidden')){
                    const mId = ministryDetailsSection.dataset.currentMinistryId;
                    if(mId !== undefined && typeof loadAndRenderMinistryDetails === "function") loadAndRenderMinistryDetails(parseInt(mId), periodVal);
                }
            } else if (currentPageName === 'local_government.html') {
                if(typeof initializeKosovoMap === "function") initializeKosovoMap();
            }
        }
    }

    function setupEventListeners() {
        if (languageSelectorButton && languageDropdown) { languageSelectorButton.addEventListener('click', (e) => { e.stopPropagation(); languageDropdown.classList.toggle('hidden'); }); languageDropdown.addEventListener('click', (e) => { const opt = e.target.closest('a[data-lang]'); if (opt) { e.preventDefault(); setLanguage(opt.dataset.lang); languageDropdown.classList.add('hidden'); } }); }
        const userMenuBtn = document.getElementById('userMenu'); const userDropdownEl = document.getElementById('userDropdown'); if (userMenuBtn && userDropdownEl) { userMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); userDropdownEl.classList.toggle('hidden'); }); }
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle'); const sidebar = document.getElementById('sidebar'); const closeSidebarButton = document.getElementById('toggleSidebar'); if (mobileSidebarToggle && sidebar) { mobileSidebarToggle.addEventListener('click', () => { sidebar.classList.toggle('hidden'); sidebar.classList.toggle('block'); }); } if (closeSidebarButton && sidebar) { closeSidebarButton.addEventListener('click', () => { sidebar.classList.add('hidden'); sidebar.classList.remove('block'); }); }

        document.addEventListener('click', (e) => {
            if (languageDropdown && !languageDropdown.classList.contains('hidden') && languageSelectorButton && !languageSelectorButton.contains(e.target) && !languageDropdown.contains(e.target)) languageDropdown.classList.add('hidden');
            if (userDropdownEl && !userDropdownEl.classList.contains('hidden') && userMenuBtn && !userMenuBtn.contains(e.target) && !userDropdownEl.contains(e.target)) userDropdownEl.classList.add('hidden');
            if(isDashboardPage){
                const exportDd = document.getElementById('exportDropdown'); const exportBtn = document.getElementById('exportButton'); if (exportDd && !exportDd.classList.contains('hidden') && exportBtn && !exportBtn.contains(e.target) && !exportDd.contains(e.target)) exportDd.classList.add('hidden');
                const sortDd = document.getElementById('sortDropdown'); const sortBtn = document.getElementById('sortButton'); if (sortDd && !sortDd.classList.contains('hidden') && sortBtn && !sortBtn.contains(e.target) && !sortDd.contains(e.target)) sortDd.classList.add('hidden');
            }
        });

        if (isDashboardPage) {
            const exportBtnEl = document.getElementById('exportButton'); const exportDropdownEl = document.getElementById('exportDropdown'); if (exportBtnEl && exportDropdownEl) { exportBtnEl.addEventListener('click', (e) => { e.stopPropagation(); exportDropdownEl.classList.toggle('hidden'); }); }
            if (pillarTabs) { pillarTabs.forEach(tab => { tab.addEventListener('click', (e) => { e.preventDefault(); const pillar = tab.dataset.tab; if (pillar && pillar !== currentPillar) { currentPillar = pillar; pillarTabs.forEach(t => {t.classList.remove('tab-active','border-blue-600','text-blue-600'); t.classList.add('text-gray-500','hover:text-gray-700','hover:border-gray-300');}); tab.classList.add('tab-active','border-blue-600','text-blue-600'); tab.classList.remove('text-gray-500','hover:text-gray-700','hover:border-gray-300'); if(typeof updateDynamicTitles === "function") updateDynamicTitles(); const period = document.getElementById('timePeriod')?.value||'q2-2023'; if(typeof fetchDashboardData === "function") fetchDashboardData(currentPillar,currentLang,period); } }); }); }
            const applyBtn = document.getElementById('applyFiltersButton'); if(applyBtn) { applyBtn.addEventListener('click', () => { if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); showNotification('notificationFiltersApplied',true); }); }
            const resetFiltersBtn = document.getElementById('resetFiltersButton'); if (resetFiltersBtn) { resetFiltersBtn.addEventListener('click', () => { const timePeriodEl = document.getElementById('timePeriod'); if(timePeriodEl) timePeriodEl.value = 'q2-2023'; const compareWithEl = document.getElementById('compareWithFilter'); if(compareWithEl) compareWithEl.value = 'none'; const ministryTypeEl = document.getElementById('ministryTypeFilter'); if(ministryTypeEl) ministryTypeEl.value = 'all'; const minScoreEl = document.getElementById('minScoreFilter'); if(minScoreEl) minScoreEl.value = 0; const maxScoreEl = document.getElementById('maxScoreFilter'); if(maxScoreEl) maxScoreEl.value = 100; const searchInputEl = document.getElementById('searchMinistryInput'); if(searchInputEl) searchInputEl.value = ''; const showComparisonEl = document.getElementById('showComparisonCheckbox'); if(showComparisonEl) showComparisonEl.checked = false; if (typeof applyFiltersAndSort === "function") applyFiltersAndSort(); showNotification('notificationFiltersReset', true); }); }
            const searchIn = document.getElementById('searchMinistryInput'); if(searchIn) { searchIn.addEventListener('input', debounce(() => { if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); }, 300)); }
            const ministryTypeSel = document.getElementById('ministryTypeFilter'); if (ministryTypeSel) { ministryTypeSel.addEventListener('change', () => { if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); });}
            const compareWithSel = document.getElementById('compareWithFilter'); if (compareWithSel) { compareWithSel.addEventListener('change', () => { if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); }); }
            const minScoreIn = document.getElementById('minScoreFilter'); const maxScoreIn = document.getElementById('maxScoreFilter'); if (minScoreIn && maxScoreIn) { const h = debounce(() => { if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); }, 500); minScoreIn.addEventListener('input', h); minScoreIn.addEventListener('change', h); maxScoreIn.addEventListener('input', h); maxScoreIn.addEventListener('change', h); }
            const sortBtn = document.getElementById('sortButton'); const sortDd = document.getElementById('sortDropdown'); if(sortBtn && sortDd){ sortBtn.addEventListener('click', (e) => { e.stopPropagation(); sortDd.classList.toggle('hidden'); }); sortDd.addEventListener('click', (e) => { const opt = e.target.closest('.sortOption[data-sort]'); if(opt){ e.preventDefault(); const sortVal = opt.dataset.sort; if(sortVal){ currentSortGlobal = sortVal; if(typeof applyFiltersAndSort === "function") applyFiltersAndSort(); sortDd.classList.add('hidden'); const parts = currentSortGlobal.split('-'); const key = `sort${capitalizeFirstLetter(parts[0])}${capitalizeFirstLetter(parts[1]||'')}`; showNotification(`${getTranslation('notificationSortedByPrefix')} ${getTranslation(key)}`); } } }); }
            const closeBtn = document.getElementById('closeMinistryDetailsButton'); if(closeBtn && ministryDetailsSection) { closeBtn.addEventListener('click', () => { ministryDetailsSection.classList.add('hidden'); ministryDetailsSection.removeAttribute('data-current-ministry-id'); if(chartContainer) chartContainer.scrollIntoView({behavior:'smooth',block:'nearest'}); }); }
            const periodSel = document.getElementById('timePeriod'); if (periodSel) { periodSel.addEventListener('change', () => { const periodValue = periodSel.value; if(typeof fetchDashboardData === "function") fetchDashboardData(currentPillar, currentLang, periodValue); if(ministryDetailsSection && !ministryDetailsSection.classList.contains('hidden')){ const mId = ministryDetailsSection.dataset.currentMinistryId; if(mId !== undefined && typeof loadAndRenderMinistryDetails === "function") loadAndRenderMinistryDetails(parseInt(mId), periodValue); } }); }
        }
    }
    // END: CORE LOGIC FUNCTIONS

    // --- SCRIPT INITIALIZATION ---
    const preferredLang = localStorage.getItem('preferredLang');
    if (preferredLang && translations[preferredLang]) {
        currentLang = preferredLang;
    } // else currentLang remains 'en' (default)

    updateAllUIText(currentLang); // This will now use the currentLang (either 'en' or from localStorage)
    initializeSidebarActiveState();

    if(typeof setupEventListeners === "function") {
        setupEventListeners();
    } else {
        console.error("setupEventListeners function is not defined!");
    }

    if (isDashboardPage) {
        if(typeof updateDynamicTitles === "function") updateDynamicTitles();
        const initialPeriod = document.getElementById('timePeriod')?.value || 'q2-2023';
        if(typeof fetchDashboardData === "function") {
            fetchDashboardData(currentPillar, currentLang, initialPeriod)
                .catch(error => {
                    console.error("Dashboard data fetch error during initial load:", error);
                    if (typeof renderChart === "function") renderChart([]);
                    if (typeof updateKPICards === "function") updateKPICards(null);
                });
        } else {
            console.error("fetchDashboardData function is not defined!");
        }
    } else if (currentPageName === 'local_government.html') {
        if (typeof initializeKosovoMap === "function") {
            initializeKosovoMap();
        } else {
            console.error("initializeKosovoMap function is not defined!");
        }
    }

    const yearSpan = document.getElementById('currentYear');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear().toString();
    console.log(`SCRIPT.JS DOMInit: Page (${currentPageName}) initialization sequence complete. Initial lang: ${currentLang}`);
});
// END: DOMContentLoaded Event Listener

// START: Polyfills
if (typeof Element !== 'undefined' && !Element.prototype.matches) { Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector; }
if (typeof Element !== 'undefined' && !Element.prototype.closest) { Element.prototype.closest = function(s) { var el = this; do { if (Element.prototype.matches.call(el, s)) return el; el = el.parentElement || el.parentNode; } while (el !== null && el.nodeType === 1); return null; }; }
// END: Polyfills

// START: Final Script Parse Logging
console.log("MAIN_SCRIPT.JS: End of file reached. Script fully parsed.");
// END: Final Script Parse Logging
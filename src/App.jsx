// =====================================================
// App router — hash-based, lightweight, role-aware
// =====================================================
const App = () => (
  <RoleProvider>
    <AppShell />
  </RoleProvider>
);

const AppShell = () => {
  const [route, setRoute] = React.useState(() => {
    const h = window.location.hash.replace("#", "");
    return h || "home";
  });

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      setRoute(h || "home");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id) => {
    window.location.hash = "#" + id;
    setRoute(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  let page;
  switch (route) {
    case "home": page = <HomePage go={go} />; break;
    case "programs": page = <ProgramsPage go={go} />; break;
    case "classroom": page = <ClassroomPage go={go} />; break;
    case "dashboard": page = <DashboardPage go={go} />; break;
    case "course": page = <CoursePage go={go} />; break;
    case "instructor": page = <InstructorPage go={go} />; break;
    case "admissions": page = <AdmissionsPage go={go} />; break;
    case "credential": page = <CredentialPage go={go} />; break;
    case "search": page = <SearchPage go={go} />; break;
    case "assessment": page = <AssessmentPage go={go} />; break;
    case "community": page = <CommunityPage go={go} />; break;
    case "analytics": page = <AnalyticsPage go={go} />; break;
    case "authoring": page = <AuthoringPage go={go} />; break;
    case "recordings": page = <RecordingsPage go={go} />; break;
    case "login": page = <LoginPage go={go} />; break;
    case "register": page = <RegisterPage go={go} />; break;
    case "forgot": page = <ForgotPage go={go} />; break;
    case "verify-email": page = <VerifyEmailPage go={go} />; break;
    case "2fa-setup": page = <TwoFactorPage go={go} />; break;
    case "onboarding": page = <OnboardingPage go={go} />; break;
    case "settings": page = <SettingsPage go={go} />; break;
    case "calendar": page = <CalendarPage go={go} />; break;
    case "library": page = <LibraryPage go={go} />; break;
    case "help": page = <HelpPage go={go} />; break;
    case "pricing": page = <PricingPage go={go} />; break;
    case "faculty": page = <FacultyPage go={go} />; break;
    case "admin": page = <AdminPage go={go} />; break;
    case "parent": page = <ParentPage go={go} />; break;
    case "officehours": page = <OfficeHoursPage go={go} />; break;
    case "events": page = <EventsPage go={go} />; break;
    case "about": page = <AboutPage go={go} />; break;
    case "schools": page = <SchoolsPage go={go} />; break;
    case "labs": page = <LabsPage go={go} />; break;
    case "virtuallab": page = <VirtualLabPage go={go} />; break;
    case "research": page = <ResearchPage go={go} />; break;
    case "inbox": page = <NotificationsPage go={go} />; break;
    case "messages": page = <MessagesPage go={go} />; break;
    case "bookmarks": page = <BookmarksPage go={go} />; break;
    case "achievements": page = <AchievementsPage go={go} />; break;
    case "submission": page = <SubmissionPage go={go} />; break;
    case "profile": page = <ProfilePage go={go} />; break;
    case "transcript": page = <TranscriptPage go={go} />; break;
    case "degree-audit": page = <DegreeAuditPage go={go} />; break;
    case "registration": page = <RegistrationPage go={go} />; break;
    case "career": page = <CareerPage go={go} />; break;
    case "financial-aid": page = <FinancialAidPage go={go} />; break;
    case "wellness": page = <WellnessPage go={go} />; break;
    case "alumni": page = <AlumniPage go={go} />; break;
    case "hackathons": page = <HackathonsPage go={go} />; break;
    case "honor-code": page = <HonorCodePage go={go} />; break;
    default: page = <HomePage go={go} />;
  }

  return (
    <>
      <ScrollProgress />
      <Nav current={route} go={go} />
      <div key={route} className="page-shell">{page}</div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// App router — hash-based, role-aware, with parameterized routes
// =====================================================
import React from "react";
import { RoleProvider } from "./role";
import { AuthProvider } from "./auth/AuthContext";
import { ErrorBoundary } from "./auth/ErrorBoundary";
import { ThemeProvider, UIRoot } from "./ui";
import { ScrollProgress } from "./motion";
import { Nav } from "./shared";

import HomePage from "./pages/Home";
import AssessmentLivePage from "./pages/AssessmentLive";
import CatalogPage from "./pages/Catalog";
import CourseLivePage from "./pages/CourseLive";
import MyCoursesPage from "./pages/MyCourses";
import ProgressPage from "./pages/Progress";
import TutorPage from "./pages/Tutor";
import ProgramsPage from "./pages/Programs";
import ClassroomPage from "./pages/Classroom";
import DashboardPage from "./pages/Dashboard";
import CoursePage from "./pages/Course";
import InstructorPage from "./pages/Instructor";
import AdmissionsPage from "./pages/Admissions";
import CredentialPage from "./pages/Credential";
import SearchPage from "./pages/Search";
import AssessmentPage from "./pages/Assessment";
import CommunityPage from "./pages/Community";
import AnalyticsPage from "./pages/Analytics";
import AuthoringPage from "./pages/Authoring";
import RecordingsPage from "./pages/Recordings";
import { LoginPage, RegisterPage, ForgotPage, VerifyEmailPage, TwoFactorPage, OnboardingPage } from "./pages/Auth";
import SettingsPage from "./pages/Settings";
import { CalendarPage, LibraryPage, HelpPage, PricingPage, FacultyPage } from "./pages/More";
import { AdminPage, ParentPage, OfficeHoursPage, EventsPage, AboutPage } from "./pages/Roles";
import { SchoolsPage, VirtualLabPage, LabsPage, ResearchPage } from "./pages/University";
import { NotificationsPage, MessagesPage, BookmarksPage, AchievementsPage, SubmissionPage, ProfilePage } from "./pages/Productivity";
import { TranscriptPage, DegreeAuditPage, RegistrationPage, CareerPage, FinancialAidPage, WellnessPage, AlumniPage, HackathonsPage, HonorCodePage } from "./pages/Academic";

const parseRoute = (raw) => {
  const h = (raw || "").replace(/^#/, "");
  if (!h) return { id: "home", param: null };
  const [id, ...rest] = h.split("/");
  return { id: id || "home", param: rest.length ? rest.join("/") : null };
};

const AppShell = () => {
  const [{ id: route, param: routeParam }, setRoute] = React.useState(() =>
    parseRoute(window.location.hash)
  );

  React.useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id, param) => {
    const hash = "#" + id + (param ? "/" + param : "");
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute({ id, param: param || null });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  let page;
  switch (route) {
    case "home": page = <HomePage go={go} />; break;
    case "programs": page = <ProgramsPage go={go} />; break;
    case "catalog": page = <CatalogPage go={go} />; break;
    case "my-courses": page = <MyCoursesPage go={go} />; break;
    case "course-live": page = <CourseLivePage go={go} courseId={routeParam} />; break;
    case "assessment-live": page = <AssessmentLivePage go={go} assessmentId={routeParam} />; break;
    case "progress": page = <ProgressPage go={go} />; break;
    case "tutor": page = <TutorPage go={go} />; break;
    case "classroom": page = <ClassroomPage go={go} />; break;
    case "dashboard": page = <DashboardPage go={go} />; break;
    case "course": page = <CoursePage go={go} courseId={routeParam} />; break;
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
    case "virtuallab": page = <VirtualLabPage go={go} labId={routeParam} />; break;
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
    <UIRoot onNavigate={go}>
      <a href="#main-content" className="skip-link">پرش به محتوای اصلی</a>
      <ScrollProgress />
      <Nav current={route} go={go} />
      <ErrorBoundary key={route + ":" + (routeParam || "")}>
        <main id="main-content" className="page-shell" tabIndex={-1}>{page}</main>
      </ErrorBoundary>
    </UIRoot>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <RoleProvider>
        <AppShell />
      </RoleProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

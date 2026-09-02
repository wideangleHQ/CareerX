# Graph Report - CareerX  (2026-09-02)

## Corpus Check
- 347 files · ~109,519 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2247 nodes · 5587 edges · 135 communities (109 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb6429b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- email.service.ts
- ReportFilterDto
- CurrentUser
- lucide-react
- CardHeader
- types.ts
- query-applications.dto.ts
- app.module.ts
- candidates.controller.ts
- NotificationsService
- auth.module.ts
- notifications.service.ts
- EmailWorker
- react
- OfferDetailView.tsx
- RequirePermissions
- EmployeeSyncService
- OpportunityActionsDropdown.tsx
- AuthContext.tsx
- SUMMARY.md
- cn
- interview-feedback.service.ts
- auth.interfaces.ts
- DepartmentsService
- InterviewSlotsService
- opportunity.schema.ts
- hr-notes.service.ts
- AuditFilterDto
- create-application.dto.ts
- dependencies
- CandidateProfile.tsx
- SlotCalendar.tsx
- compilerOptions
- ApplicationsService
- OpportunitiesService
- RedisService
- OrgProofUpload.tsx
- compilerOptions
- API reference
- Everything just can do
- HrNotesController
- applications.service.ts
- auth.service.ts
- Known gaps and dead code
- Backend
- ApplicationTable.tsx
- files.service.ts
- devDependencies
- auth.controller.ts
- p1_queues_and_crons.md
- PrismaService
- MonitoringController
- Auth and SSO
- The hiring pipeline
- Phase 2 schema changes
- Candidate to employee handoff
- Embedding in PerformX
- DepartmentSyncService
- worker.module.ts
- departments.service.ts
- file-filter.dto.ts
- PerformanceMetricsService
- StructuredLogger
- QueueMetricsService
- supabase-storage.service.ts
- Local setup
- package.json
- .error
- Architecture
- package.json
- PerformxClient
- Data model
- NotificationWorker
- AuthService
- Working rules
- Start here
- Files
- Phase 2 plan and sequencing
- page.tsx
- Email
- PublicRateLimitGuard
- page.tsx
- page.tsx
- Decision log
- @base-ui/react
- OperationsDashboardService
- HealthController
- clsx
- compressorjs
- AppModule
- @radix-ui/react-dropdown-menu
- files.module.ts
- .findAll
- socket.io-client
- tailwind-merge
- page.tsx
- @base-ui/react
- @tanstack/react-query-devtools
- zustand
- shadcn
- @tanstack/react-query
- middleware.ts
- CareerJwtPayload
- exclude
- bullmq
- delete-file.dto.ts
- ApplicationsLayout
- DashboardLayout
- next-env.d.ts
- next.config.mjs

## God Nodes (most connected - your core abstractions)
1. `react` - 100 edges
2. `PrismaService` - 77 edges
3. `CareerJwtPayload` - 76 edges
4. `lucide-react` - 71 edges
5. `cn()` - 63 edges
6. `RequirePermissions` - 63 edges
7. `Button()` - 48 edges
8. `CurrentUser` - 47 edges
9. `RedisService` - 44 edges
10. `ReportFilterDto` - 43 edges

## Surprising Connections (you probably didn't know these)
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  client/components/ui/dropdown-menu.tsx → client/src/lib/utils.ts
- `useRefreshToken()` --calls--> `useAuth()`  [EXTRACTED]
  client/src/features/auth/hooks/useRefreshToken.ts → client/src/context/AuthContext.tsx
- `formatTime()` --calls--> `formatSlotTime()`  [INFERRED]
  client/src/features/candidate-portal/components/InterviewSlotPicker.tsx → client/src/lib/slot-time.ts
- `formatTime()` --calls--> `formatSlotTime()`  [INFERRED]
  client/src/features/hr-dashboard/components/TodayInterviewsTable.tsx → client/src/lib/slot-time.ts
- `formatTime()` --calls--> `formatSlotTime()`  [INFERRED]
  client/src/features/hr-dashboard/components/UpcomingInterviewsWidget.tsx → client/src/lib/slot-time.ts

## Import Cycles
- None detected.

## Communities (135 total, 26 thin omitted)

### Community 0 - "email.service.ts"
Cohesion: 0.07
Nodes (42): EmailAttachmentDto, EmailTemplate, parseApplicationId(), parseAttachments(), parseHeaderSafeString(), parseRecipients(), parseSendEmailDto(), parseTemplate() (+34 more)

### Community 1 - "ReportFilterDto"
Cohesion: 0.05
Nodes (41): class-transformer, class-validator, dotenv, IsNotEmpty, @nestjs/bullmq, @nestjs/common, @nestjs/core, @nestjs/platform-express (+33 more)

### Community 2 - "CurrentUser"
Cohesion: 0.10
Nodes (17): STATUS_TABS, applicationsApi, ApplicationListResponse, ApplicationScope, ApplicationStatus, HrNote, InterviewFeedback, QueryApplicationsParams (+9 more)

### Community 3 - "lucide-react"
Cohesion: 0.06
Nodes (48): class-variance-authority, CandidateDetailPage(), SuccessPage(), BookFormData, bookSchema, Button(), buttonVariants, DialogContent (+40 more)

### Community 4 - "CardHeader"
Cohesion: 0.06
Nodes (58): DashboardPage(), CalendarPage(), metadata, SlotsPage(), NotificationsPage(), ReportsPage(), SettingsPage(), PublicLayout() (+50 more)

### Community 5 - "types.ts"
Cohesion: 0.04
Nodes (59): axiosClient, failedQueue, filesApi, interviewsApi, Notification, NotificationListResponse, notificationsApi, offersApi (+51 more)

### Community 6 - "query-applications.dto.ts"
Cohesion: 0.22
Nodes (14): ApplicationScope, parseDate(), parseExperience(), parseLimit(), parseOptionalString(), parseQueryApplicationsDto(), parseScope(), parseSortBy() (+6 more)

### Community 7 - "app.module.ts"
Cohesion: 0.10
Nodes (35): CareerEventsModule, Global, Module, PerformxModule, Module, ApplicationsModule, Module, AuthModule (+27 more)

### Community 8 - "candidates.controller.ts"
Cohesion: 0.08
Nodes (31): CandidatesController, Body, Controller, Delete, Get, Param, Patch, Post (+23 more)

### Community 9 - "NotificationsService"
Cohesion: 0.08
Nodes (21): CreateNotificationDto, NotificationFilterDto, parseLimit(), parseNotificationFilterDto(), parseOptionalBoolean(), parseOptionalUuid(), parseSortOrder(), SORT_ORDERS (+13 more)

### Community 10 - "auth.module.ts"
Cohesion: 0.19
Nodes (17): CreateFeedbackDto, parseCreateFeedbackDto(), parseOptionalText(), parseRating(), parseDate(), parseFeedbackFilterDto(), parseLimit(), parseOptionalString() (+9 more)

### Community 11 - "notifications.service.ts"
Cohesion: 0.27
Nodes (10): CurrentUser, Permissions(), ReportsController, Body, Controller, Get, Post, Query (+2 more)

### Community 13 - "react"
Cohesion: 0.06
Nodes (44): HRLayout(), OpportunitiesPage(), JobDetailsPage(), mapRawToPublic(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+36 more)

### Community 14 - "OfferDetailView.tsx"
Cohesion: 0.21
Nodes (9): OfferDetailPage(), OffersPage(), OfferDetailView(), OfferFilters(), OfferStats(), OfferTable(), useOffer(), useOffers() (+1 more)

### Community 15 - "RequirePermissions"
Cohesion: 0.16
Nodes (19): RequirePermissions, ApplicationsController, Body, Controller, Delete, Get, Param, Patch (+11 more)

### Community 16 - "EmployeeSyncService"
Cohesion: 0.18
Nodes (5): EmployeeSyncService, Injectable, EmployeeSyncCron, Cron, Injectable

### Community 17 - "OpportunityActionsDropdown.tsx"
Cohesion: 0.17
Nodes (5): DepartmentSyncService, Injectable, DepartmentSyncCron, Cron, Injectable

### Community 18 - "AuthContext.tsx"
Cohesion: 0.10
Nodes (14): metadata, RootLayout(), next, authApi, User, queryClient, AuthContext, AuthContextType (+6 more)

### Community 19 - "SUMMARY.md"
Cohesion: 0.27
Nodes (3): Phase 1 (shipped), Phase 2 (to build), Summary

### Community 20 - "cn"
Cohesion: 0.32
Nodes (5): handleDrop(), handleFileChange(), ResumeUpload(), ResumeUploadProps, validateAndSetFile()

### Community 21 - "interview-feedback.service.ts"
Cohesion: 0.11
Nodes (13): FeedbackFilterDto, InterviewFeedbackController, Body, Controller, Delete, Get, Param, Patch (+5 more)

### Community 22 - "auth.interfaces.ts"
Cohesion: 0.18
Nodes (11): AuthenticatedRequest, AuthenticatedRequest, CareerJwtAuthGuard, Injectable, AuthenticatedRequest, PermissionsGuard, Injectable, parseToggleHiringDto() (+3 more)

### Community 23 - "DepartmentsService"
Cohesion: 0.07
Nodes (20): PerformxClient, PerformxDepartment, PerformxEmployee, PerformxVerifyResponse, Injectable, PerformxCircuitBreaker, DepartmentsController, Body (+12 more)

### Community 24 - "InterviewSlotsService"
Cohesion: 0.07
Nodes (31): BookSlotDto, parseBookSlotDto(), BulkGenerateSlotsDto, parseBulkGenerateSlotsDto(), parseDateFlexible(), parseDaysOfWeek(), parseTimeFlexible(), CreateSlotDto (+23 more)

### Community 25 - "opportunity.schema.ts"
Cohesion: 0.13
Nodes (12): ApplicationForm(), useSubmitApplication(), CandidateApplicationData, candidateApplicationSchema, OpportunityDocumentsSchema, OpportunityInternalSchema, OpportunityPublicSchema, OpportunityWizardData (+4 more)

### Community 26 - "hr-notes.service.ts"
Cohesion: 0.15
Nodes (8): CreateNoteDto, NoteFilterDto, UpdateNoteDto, HrNoteRecord, HrNotesRepository, Injectable, HrNotesService, Injectable

### Community 27 - "AuditFilterDto"
Cohesion: 0.09
Nodes (19): AuditLogsController, Controller, Get, Param, Query, UseGuards, AuditLogsModule, Global (+11 more)

### Community 28 - "create-application.dto.ts"
Cohesion: 0.25
Nodes (14): parseAssignHrDto(), parseCreateApplicationDto(), parseEmail(), parsePhone(), parseRequiredText(), parseUuid(), validationError(), parseCreateNoteDto() (+6 more)

### Community 29 - "dependencies"
Cohesion: 0.13
Nodes (15): axios, dependencies, axios, class-variance-authority, date-fns, @hookform/resolvers, lucide-react, react-hook-form (+7 more)

### Community 30 - "CandidateProfile.tsx"
Cohesion: 0.08
Nodes (39): ApplicationDetailPage(), TabsContent, TabsList, TabsTrigger, react, Application, CandidateFile, ApplicationDetailsSheet() (+31 more)

### Community 31 - "SlotCalendar.tsx"
Cohesion: 0.14
Nodes (21): CardFooter(), Checkbox(), Skeleton(), Table(), TableBody(), TableCaption(), TableCell(), TableFooter() (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.06
Nodes (32): bun, node, src/**/*, compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, emitDecoratorMetadata (+24 more)

### Community 33 - "ApplicationsService"
Cohesion: 0.15
Nodes (7): candidateError(), ApplicationsService, Injectable, ApplicationDetailDto, ApplicationListItemDto, AssignHrDto, CreateApplicationDto

### Community 34 - "OpportunitiesService"
Cohesion: 0.13
Nodes (11): OpportunitiesController, Body, Controller, Delete, Get, Param, Patch, Query (+3 more)

### Community 36 - "OrgProofUpload.tsx"
Cohesion: 0.29
Nodes (7): ALLOWED_EXTENSIONS, ALLOWED_TYPES, handleDrop(), handleFileChange(), OrgProofUpload(), OrgProofUploadProps, validateAndSetFile()

### Community 37 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+19 more)

### Community 38 - "API reference"
Cohesion: 0.11
Nodes (19): API reference, Applications, Audit logs, Auth, Candidates, Dashboard, Departments, Email (+11 more)

### Community 39 - "Everything just can do"
Cohesion: 0.12
Nodes (16): Building, CareerX, Checking, Contributing, Database, Docs, Everything just can do, Layout (+8 more)

### Community 40 - "HrNotesController"
Cohesion: 0.15
Nodes (9): JobListingPage(), LandingPage(), Accordion, AccordionContent, AccordionContext, AccordionItem, AccordionItemContext, AccordionTrigger (+1 more)

### Community 41 - "applications.service.ts"
Cohesion: 0.15
Nodes (13): ApplicationErrorCode, CANDIDATE_MESSAGES, ALLOWED_FILE_EXTENSIONS, ALLOWED_FILE_MIMES, ApplicationUploadFiles, DUPLICATE_ACTIVE_STATUSES, getFileExtension(), safeFileName() (+5 more)

### Community 42 - "auth.service.ts"
Cohesion: 0.17
Nodes (16): AUTH_COOKIES, AUTH_TTL_SECONDS, RefreshResponseDto, RefreshTokenRecord, JwtStrategy, Injectable, PerformxJwtClaims, clearAuthCookies() (+8 more)

### Community 43 - "Known gaps and dead code"
Cohesion: 0.12
Nodes (16): Application code generation can collide, `confidentiality_level` does nothing, Duplicate worker files, Empty CORS_ORIGINS allows every origin, `hr_role_permissions` is seeded by hand, Interview reminder duplication, Known gaps and dead code, Local JWT verification is optional (+8 more)

### Community 44 - "Backend"
Cohesion: 0.14
Nodes (14): Backend, Code conventions, Controllers, DTOs, External calls, Frontend, Git, Logging (+6 more)

### Community 45 - "ApplicationTable.tsx"
Cohesion: 0.23
Nodes (4): HealthService, Injectable, InjectQueue, Cron

### Community 46 - "files.service.ts"
Cohesion: 0.22
Nodes (8): FilesController, Controller, Get, Param, Query, UseGuards, CandidateFileListResponseDto, SignedUrlResponseDto

### Community 47 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+7 more)

### Community 48 - "auth.controller.ts"
Cohesion: 0.16
Nodes (11): AuthController, Controller, Post, Req, Res, ExchangeResponseDto, AuthSuccessResult, base64UrlDecode() (+3 more)

### Community 49 - "p1_queues_and_crons.md"
Cohesion: 0.14
Nodes (13): Application cleanup, Configuration, Crons, Department sync, Employee sync, Expired slots, Health, Interview reminders (+5 more)

### Community 50 - "PrismaService"
Cohesion: 0.05
Nodes (26): PerformxEmployeeItem, InterviewSlotsRepository, Injectable, SlotAssignmentResponse, adapter, PrismaService, Injectable, ApplicationCleanupCron (+18 more)

### Community 51 - "MonitoringController"
Cohesion: 0.19
Nodes (8): MonitoringController, Body, Controller, Get, Param, Post, Query, UseGuards

### Community 52 - "Auth and SSO"
Cohesion: 0.15
Nodes (13): Auth and SSO, Cookies in production, Guards, Public endpoints, Refresh, Step 4: where the token comes from, Step 5: local pre-verification, Step 6: remote verification (+5 more)

### Community 53 - "The hiring pipeline"
Cohesion: 0.15
Nodes (13): Application codes, Applying, Assignment, Feedback, File upload, Interview scheduling, Offers, Opportunities (+5 more)

### Community 54 - "Phase 2 schema changes"
Cohesion: 0.15
Nodes (13): Application code sequence, Candidate email uniqueness, Code changes, Handoff tracking, Hardening, Normalise offers, Phase 2 schema changes, Rate limiting (+5 more)

### Community 55 - "Candidate to employee handoff"
Cohesion: 0.17
Nodes (12): Candidate to employee handoff, Documents, Pre-filled form, Recommendation, Reverse direction: offboarding, Schema, Service-to-service write, The pre-filled flow (+4 more)

### Community 56 - "Embedding in PerformX"
Cohesion: 0.18
Nodes (11): An iframe, Cookies and domains, Embedding in PerformX, Fix the employee sync first, How the tab works, Rebuilding the screens in PerformX, Same-tab navigation, with a way back, Set PERFORMX_JWT_SECRET (+3 more)

### Community 57 - "DepartmentSyncService"
Cohesion: 0.15
Nodes (12): parseUpdateNoteDto(), HrNotesController, Body, Controller, Delete, Get, Param, Patch (+4 more)

### Community 58 - "worker.module.ts"
Cohesion: 0.08
Nodes (21): bullmq, exceljs, bullmq, exceljs, QueuesModule, Module, MonitoringModule, Module (+13 more)

### Community 59 - "departments.service.ts"
Cohesion: 0.23
Nodes (3): QueueMetricsService, Injectable, InjectQueue

### Community 60 - "file-filter.dto.ts"
Cohesion: 0.25
Nodes (9): FILE_TYPES, parseFileFilterDto(), parseLimit(), parseOptionalFileType(), parseOptionalUuid(), FILE_TYPES, parseFileType(), parseUploadFileDto() (+1 more)

### Community 61 - "PerformanceMetricsService"
Cohesion: 0.25
Nodes (6): NotificationsController, Controller, Param, Patch, UseGuards, NotificationDto

### Community 64 - "supabase-storage.service.ts"
Cohesion: 0.08
Nodes (23): FileFilterDto, FileType, FileInternalRecord, FileRecord, FilesRepository, Injectable, CandidateFileDto, FilesService (+15 more)

### Community 65 - "Local setup"
Cohesion: 0.20
Nodes (10): Client, Client environment, Database, Health endpoints, Local setup, Prerequisites, Server, Server environment (+2 more)

### Community 66 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 67 - ".error"
Cohesion: 0.33
Nodes (4): rxjs, rxjs, LoggingInterceptor, Injectable

### Community 68 - "Architecture"
Cohesion: 0.22
Nodes (9): Architecture, Circuit breaker, Client layout, Data ownership, Module layout, Request path, Sessions, The pieces (+1 more)

### Community 69 - "package.json"
Cohesion: 0.06
Nodes (33): @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, author, description, devDependencies, @nestjs/cli (+25 more)

### Community 70 - "PerformxClient"
Cohesion: 0.27
Nodes (5): HealthController, Controller, Get, Res, UseGuards

### Community 71 - "Data model"
Cohesion: 0.25
Nodes (8): Audit, Cached from PerformX, Candidates and applications, Communication logs, Data model, Indexes, Interviews, Opportunities

### Community 73 - "AuthService"
Cohesion: 0.30
Nodes (5): AuthService, Injectable, AUTH_REDIS_KEYS, AuthSuccessResponse, VerifiedPerformxUser

### Community 74 - "Working rules"
Cohesion: 0.29
Nodes (6): Before you commit or push, Document it, graphify, Record the decision, Working rules, Write it the way a person would

### Community 75 - "Start here"
Cohesion: 0.29
Nodes (7): How to read the rest of this book, Phase status, Relationship to PerformX, Stack, Start here, Vocabulary, What it does

### Community 76 - "Files"
Cohesion: 0.15
Nodes (12): Buckets, Email, Endpoints, Environment, Files, Files and email, Monitoring, Sending (+4 more)

### Community 77 - "Phase 2 plan and sequencing"
Cohesion: 0.33
Nodes (6): Open questions, Ordering, Phase 2 plan and sequencing, Risks, Scope, What is not in scope

### Community 78 - "page.tsx"
Cohesion: 0.40
Nodes (3): DepartmentsPage(), metadata, DepartmentHiringToggle()

### Community 80 - "PublicRateLimitGuard"
Cohesion: 0.40
Nodes (3): PublicRateLimitGuard, store, Injectable

### Community 84 - "Decision log"
Cohesion: 0.25
Nodes (8): 2026-08-16 Decisions live in the handbook, not in a separate file, 2026-09-01 Interview reassignment notifies via the existing EventEmitter, 2026-09-01 Interview reassignment via slot_assignments, not interview_slots.hr_id, 2026-09-01 Only the position owner may reassign the interviewer, 2026-09-01 Position creator is default interviewer via hiring_manager_id, 2026-09-02 Allow PENDING applications to book interview slots, 2026-09-02 Displayed interviewer falls back to assigned HR before a slot exists, Decision log

### Community 86 - "OperationsDashboardService"
Cohesion: 0.25
Nodes (3): Injectable, WorkerHealthService, WorkerHeartbeat

### Community 90 - "AppModule"
Cohesion: 0.20
Nodes (7): AppModule, Module, CorrelationMiddleware, Express, Request, Injectable, bootstrap()

### Community 92 - "files.module.ts"
Cohesion: 0.33
Nodes (5): FilesModule, Module, StorageModule, Global, Module

### Community 95 - "tailwind-merge"
Cohesion: 0.50
Nodes (3): QueueConfigModule, Global, Module

### Community 102 - "middleware.ts"
Cohesion: 0.43
Nodes (6): config, HR_ROUTES, isHrRoute(), isPublicRoute(), middleware(), PUBLIC_ROUTES

### Community 103 - "CareerJwtPayload"
Cohesion: 0.17
Nodes (10): CareerJwtPayload, DashboardController, Controller, Get, UseGuards, APPLICATION_STATUSES, DashboardService, StatusTally (+2 more)

### Community 104 - "exclude"
Cohesion: 0.25
Nodes (7): ./tsconfig.json, exclude, extends, dist, node_modules, **/*.spec.ts, test

### Community 134 - "bullmq"
Cohesion: 0.22
Nodes (5): PerformxDepartmentItem, ComponentHealth, HealthStatus, SystemHealth, RedisValue

## Knowledge Gaps
- **430 isolated node(s):** `STATUS_TABS`, `metadata`, `metadata`, `metadata`, `bookSchema` (+425 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CareerJwtPayload` connect `CareerJwtPayload` to `supabase-storage.service.ts`, `AuthService`, `auth.service.ts`, `auth.module.ts`, `NotificationsService`, `notifications.service.ts`, `files.service.ts`, `RequirePermissions`, `AuthContext.tsx`, `interview-feedback.service.ts`, `auth.interfaces.ts`, `InterviewSlotsService`, `DepartmentSyncService`, `hr-notes.service.ts`, `PerformanceMetricsService`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Why does `react` connect `CardHeader` to `page.tsx`, `CurrentUser`, `lucide-react`, `OrgProofUpload.tsx`, `types.ts`, `HrNotesController`, `react`, `page.tsx`, `OfferDetailView.tsx`, `.findAll`, `page.tsx`, `page.tsx`, `AuthContext.tsx`, `cn`, `CandidateProfile.tsx`, `SlotCalendar.tsx`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `STATUS_TABS`, `metadata`, `metadata` to the rest of the system?**
  _430 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `email.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06826506826506827 - nodes in this community are weakly interconnected._
- **Should `ReportFilterDto` be split into smaller, more focused modules?**
  _Cohesion score 0.05242566510172144 - nodes in this community are weakly interconnected._
- **Should `CurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.057811753463927376 - nodes in this community are weakly interconnected._
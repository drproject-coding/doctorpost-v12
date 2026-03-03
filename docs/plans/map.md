# DoctorPost Application Map

## Quick Navigation

### Core Pages
- **Dashboard** - `/app/(protected)/dashboard/page.tsx`
- **Create** - `/app/(protected)/create/page.tsx` - Single post generation
- **Factory** - `/app/(protected)/factory/page.tsx` - Content factory pipeline
- **Campaigns** - `/app/(protected)/campaigns/page.tsx` - Batch content generation
- **Calendar** - `/app/(protected)/calendar/page.tsx` - Content scheduling
- **Knowledge** - `/app/(protected)/knowledge/page.tsx` - Brand knowledge management
- **Learning** - `/app/(protected)/learning/page.tsx` - AI learning system
- **Library** - `/app/(protected)/library/page.tsx` - Content library
- **Analytics** - `/app/(protected)/analytics/page.tsx` - Performance metrics
- **Settings** - `/app/(protected)/settings/page.tsx` - API keys and configuration

### Authentication
- **Login** - `/app/login/page.tsx`
- **Reset Password** - `/app/reset-password/page.tsx`
- **Auth Callback** - `/app/auth/callback/page.tsx`

## Architecture Overview

### AI Services (`/lib/ai/`)
- **Main Service** - `/lib/ai/aiService.ts` - Server-side AI calls
- **Claude** - `/lib/ai/claudeService.ts` - Anthropic Claude integration
- **1ForAll** - `/lib/ai/oneforallService.ts` - 1ForAll AI integration
- **Straico** - `/lib/ai/straicoService.ts` - Straico AI integration
- **Models** - `/lib/ai/modelService.ts` - Model fetching and management

### API Routes (`/app/api/`)
- **AI Proxy** - `/app/api/ai/route.ts` - Server-side AI calls
- **Models** - `/app/api/models/route.ts` - Model fetching
- **Knowledge** - `/app/api/knowledge/[...path]/route.ts` - Knowledge management
- **Pipeline** - `/app/api/pipeline/stream/route.ts` - Content factory streaming
- **Campaigns** - `/app/api/campaign/route.ts` - Campaign management

### Components (`/components/`)
- **Sidebar** - `/components/Sidebar.tsx` - Navigation
- **Header** - `/components/Header.tsx` - App header
- **Post Generator** - `/components/PostGenerator.tsx` - Post creation UI
- **Post Editor** - `/components/PostEditorModal.tsx` - Post editing
- **Schedule Post** - `/components/SchedulePostModal.tsx` - Scheduling UI

### Factory Components (`/components/factory/`)
- **Pipeline Stepper** - `/components/factory/PipelineStepper.tsx` - Step-by-step workflow
- **Topic Proposals** - `/components/factory/TopicProposals.tsx` - Topic selection
- **Research Brief** - `/components/factory/ResearchBrief.tsx` - Research interface
- **Evidence Pack** - `/components/factory/EvidencePack.tsx` - Evidence management
- **Draft Editor** - `/components/factory/DraftEditor.tsx` - Draft editing
- **Scorecard** - `/components/factory/Scorecard.tsx` - Content scoring
- **Formatted Output** - `/components/factory/FormattedOutput.tsx` - Final output
- **Post Review** - `/components/factory/PostReview.tsx` - Review interface

### Knowledge Components (`/components/knowledge/`)
- **Document Editor** - `/components/knowledge/DocumentEditor.tsx` - Edit brand documents
- **Import Flow** - `/components/knowledge/ImportFlow.tsx` - Import documents
- **Extract Flow** - `/components/knowledge/ExtractFlow.tsx` - Extract templates
- **Version History** - `/components/knowledge/VersionHistory.tsx` - Document versions

### Learning Components (`/components/learning/`)
- **Signal Counts** - `/components/learning/SignalCounts.tsx` - Learning metrics
- **Pattern List** - `/components/learning/PatternList.tsx` - Pattern detection
- **Rule Proposal** - `/components/learning/RuleProposal.tsx` - Rule suggestions
- **Feedback History** - `/components/learning/FeedbackHistory.tsx` - Audit log

## Data Types (`/lib/types.ts`)

### Core Types
- **BrandProfile** - User brand configuration
- **ScheduledPost** - Post scheduling data
- **AnalyticsData** - Performance metrics
- **PostGenerationParameters** - Generation settings
- **TonePrompt** - Tone configuration

### AI Types
- **AiProviderType** - "claude" | "1forall" | "straico"
- **AiModel** - Model configuration
- **AiRequest** - AI request structure
- **AiResponse** - AI response structure
- **AiSettings** - User AI settings

## Agent System (`/lib/agents/`)

### Core Agents
- **Strategist** - Topic planning and strategy
- **Researcher** - Evidence gathering
- **Writer** - Content generation
- **Scorer** - Content evaluation
- **Formatter** - Output formatting
- **Learner** - Pattern learning

### Agent Infrastructure
- **Types** - `/lib/agents/types.ts` - Agent configurations
- **Orchestrator** - `/lib/agents/orchestrator.ts` - Pipeline coordination
- **Prompt Builder** - `/lib/agents/promptBuilder.ts` - Prompt generation
- **Structured Output** - `/lib/agents/structuredOutput.ts` - Output parsing

## Key Files for Common Tasks

### Adding New AI Provider
1. Update `/lib/types.ts` - Add provider type
2. Create service in `/lib/ai/` - New service file
3. Update `/lib/ai/aiService.ts` - Add provider support
4. Update `/app/api/ai/route.ts` - Add server route
5. Update `/app/api/models/route.ts` - Add model fetching

### Creating New Component
1. Add to `/components/` - Component file
2. Update `/components/Sidebar.tsx` - Add navigation if needed
3. Create page in `/app/(protected)/` - New page if required

### Adding New Agent
1. Update `/lib/agents/types.ts` - Add agent config
2. Create agent file in `/lib/agents/` - Agent implementation
3. Update `/lib/agents/orchestrator.ts` - Add to pipeline

### Modifying Brand Knowledge
1. Update `/lib/knowledge/types.ts` - Data structures
2. Update `/lib/knowledge/api.ts` - API endpoints
3. Update `/components/knowledge/` - UI components

## Navigation Flow

1. **Authentication** → Protected Layout
2. **Sidebar Navigation** → Specific Page
3. **Page Components** → Feature-specific UI
4. **API Calls** → Server-side processing
5. **State Management** → Context updates

## Development Notes

- All AI calls go through server-side routes for security
- Brand knowledge is versioned and stored in database
- Content factory uses streaming for real-time updates
- Learning system captures user feedback for improvement
- Campaign system supports batch content generation

## Frontend vs Backend

### Frontend (Client-Side)
**Technology Stack:**
- **Framework:** Next.js 16.1.6 with React 18.2.0
- **Styling:** Tailwind CSS with custom Bruddle design system
- **Icons:** Lucide React
- **UI Components:** Custom Bruddle React library

**Key Frontend Files:**
- **Pages:** `/app/(protected)/` - All protected routes
- **Components:** `/components/` - Reusable UI components
- **Styles:** `/styles/bruddle/` - Custom design system
- **Client Logic:** `/lib/` - Frontend utilities and types

**Frontend Responsibilities:**
- User interface and interactions
- Form handling and validation
- Real-time updates via Server-Sent Events (SSE)
- State management and context
- Client-side routing and navigation

### Backend (Server-Side)
**Technology Stack:**
- **Runtime:** Node.js with Next.js API routes
- **Database:** NCB (Next.js Content Base) - server-side data layer
- **AI Integration:** Multiple AI providers (Claude, 1ForAll, Straico)

**Key Backend Files:**
- **API Routes:** `/app/api/` - Server-side endpoints
- **Services:** `/lib/ai/` - AI provider integrations
- **Agents:** `/lib/agents/` - Content generation pipeline
- **Knowledge:** `/lib/knowledge/` - Brand knowledge management

**Backend Responsibilities:**
- AI model calls and prompt management
- Database operations and data validation
- Authentication and authorization
- File uploads and document processing
- Server-side rendering and API responses

### Data Flow
1. **Client Request** → Frontend component
2. **API Call** → Next.js API route (`/app/api/`)
3. **Server Processing** → Backend service logic
4. **Database Operations** → NCB data layer
5. **AI Processing** → Agent system or AI services
6. **Response** → JSON data back to frontend
7. **UI Update** → Component re-rendering

## Dependencies

### Core Dependencies
- **Next.js** (^16.1.6) - Full-stack React framework
- **React** (^18.2.0) - UI library
- **React DOM** (^18.2.0) - DOM renderer
- **TypeScript** (^5.9.3) - Type safety

### Styling & UI
- **Tailwind CSS** (^3.3.3) - Utility-first CSS framework
- **Lucide React** (^0.263.1) - Icon library
- **@bruddle/react** - Custom design system components

### Development Tools
- **ESLint** (^8.45.0) - Code linting
- **TypeScript ESLint** (^6.21.0) - TypeScript linting
- **PostCSS** (^8.4.27) - CSS processing
- **Autoprefixer** (^10.4.14) - CSS vendor prefixes
- **TSX** (^4.21.0) - Fast TypeScript execution

### AI Provider Dependencies
- **Built-in:** No external AI SDKs (custom HTTP clients)
- **API Keys:** Managed via environment variables
- **Streaming:** Native Fetch API with ReadableStream

## Deployment & Infrastructure

### Vercel Deployment
**Configuration:**
- **Runtime:** Node.js 18+ (Next.js 16 compatible)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Output Directory:** Default (root)

**Environment Variables Required:**
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Authentication secret
- `NCB_API_KEY` - NCB database access
- `NCB_PROJECT_ID` - NCB project identifier
- `CLAUDE_API_KEY` - Anthropic Claude API key
- `STRAICO_API_KEY` - Straico API key
- `ONEFORALL_API_KEY` - 1ForAll API key

**Deployment Features:**
- **Serverless Functions** - API routes deployed as serverless functions
- **Edge Runtime** - Fast response times with edge caching
- **Automatic SSL** - HTTPS enabled by default
- **Custom Domains** - Support for custom domain configuration
- **Environment Management** - Separate environments for staging/production

### Database: NCB (Next.js Content Base)
**Architecture:**
- **Server-Side Only** - Database access restricted to server-side code
- **API Proxy** - All database operations go through `/app/api/data/[...path]/`
- **Authentication Required** - All requests require valid session cookies
- **Type Safety** - TypeScript interfaces for all database operations

**Data Structure:**
- **Users** - User profiles and authentication data
- **Brand Profiles** - User brand configurations and AI settings
- **Scheduled Posts** - Content calendar and scheduling data
- **Knowledge Documents** - Brand knowledge base with versioning
- **Campaigns** - Batch content generation campaigns
- **Signals** - Learning system feedback data

**Database Operations:**
- **CRUD Operations** - Create, Read, Update, Delete via API proxy
- **Versioning** - Document version history for knowledge management
- **Relationships** - Foreign key relationships between entities
- **Validation** - Server-side data validation and sanitization

**Security:**
- **No Client Access** - Database never directly accessible from browser
- **Session Validation** - All requests validated against user sessions
- **Rate Limiting** - Built-in protection against abuse
- **Data Encryption** - Secure data transmission and storage

### Development Workflow
1. **Local Development** - `npm run dev` with hot reload
2. **Testing** - Manual testing of components and API routes
3. **Build Process** - `npm run build` for production optimization
4. **Deployment** - Automatic deployment via Vercel Git integration
5. **Monitoring** - Vercel analytics and error tracking

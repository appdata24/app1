# Overview

This is a 3D geometry visualization application that uses AI to generate interactive geometric shapes based on natural language descriptions. The application allows users to input geometric descriptions in Vietnamese or English, and the AI generates corresponding 3D models with labeled vertices, edges, and mathematical formulas. Users can interact with the 3D models, adjust parameters dynamically, and calculate distances between geometric elements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React with TypeScript for component-based UI
- Vite as the build tool and development server
- TailwindCSS for styling with a custom design system
- React Three Fiber (@react-three/fiber) for 3D rendering using Three.js
- React Three Drei for 3D utilities and helpers
- Radix UI for accessible component primitives
- TanStack Query for server state management
- Zustand for client-side state management

**Design Decisions:**
- **Component Architecture:** Uses a split-panel layout with controls on the left and 3D canvas on the right. The geometry controls (`GeometryControls.tsx`) handle user input and AI interactions, while the 3D scene (`Scene3D.tsx`) renders the geometric visualization.
- **State Management:** Zustand stores manage different concerns - `useGeometry` for geometry data and interactions, `useGame` for application phase, `useAudio` for sound controls. This separation provides modularity and prevents state conflicts.
- **3D Rendering:** Leverages React Three Fiber's declarative approach to Three.js, making 3D scenes component-based and easier to maintain. Interactive elements like clickable edges and hoverable vertices are implemented as separate components.
- **Mathematical Rendering:** Integrates KaTeX for rendering LaTeX mathematical formulas, allowing display of geometric equations and calculations.

## Backend Architecture

**Technology Stack:**
- Express.js for the REST API server
- TypeScript with ESM modules
- Drizzle ORM with PostgreSQL (Neon serverless)
- In-memory storage implementation with database schema defined

**Design Decisions:**
- **API Structure:** RESTful endpoints under `/api` namespace. Primary endpoints include `/api/generate-geometry` for AI-powered geometry generation and `/api/calculate-distance` for geometric calculations.
- **AI Integration:** Uses OpenRouter API to generate 3D geometry from natural language descriptions. The AI generates Three.js code, vertices, formulas, and parameters that can be directly consumed by the frontend.
- **Storage Pattern:** Implements a storage interface (`IStorage`) with an in-memory implementation (`MemStorage`). This allows easy switching to database-backed storage without changing business logic.
- **Error Handling:** Implements retry logic with exponential backoff for AI requests and provides user-friendly error messages for rate limiting and API failures.

## Data Flow

**Geometry Generation Flow:**
1. User inputs description in `GeometryControls`
2. Frontend sends POST request to `/api/generate-geometry`
3. Backend calls OpenRouter AI API with the description
4. AI returns structured geometry data (vertices, edges, formulas, parameters)
5. Frontend updates Zustand store with geometry data
6. `Scene3D` component renders the 3D model based on geometry data
7. Users can adjust parameters via sliders, triggering real-time updates to the 3D model

**Distance Calculation Flow:**
1. User selects distance mode and geometric elements in UI
2. Frontend sends POST request to `/api/calculate-distance` with geometry and selections
3. Backend uses AI to calculate distance with appropriate formula
4. Result displayed in UI with mathematical formula rendered via KaTeX

## External Dependencies

**Third-Party Services:**
- **OpenRouter AI:** Primary AI service for geometry generation and mathematical calculations. Handles natural language processing to convert descriptions into 3D geometry specifications.
- **Neon Database:** Serverless PostgreSQL database configured via `@neondatabase/serverless` driver. Currently using Drizzle ORM for schema management with migrations stored in `./migrations`.

**Key Libraries:**
- **React Three Fiber Ecosystem:** Core 3D rendering (`@react-three/fiber`), utilities (`@react-three/drei`), and post-processing effects (`@react-three/postprocessing`)
- **Radix UI:** Complete set of accessible UI primitives for dialogs, dropdowns, sliders, and other interactive components
- **Mathematical Libraries:** KaTeX for formula rendering (react-katex), date-fns for date utilities
- **Development Tools:** Vite with custom plugins including runtime error overlay and GLSL shader support

**Database Schema:**
- Uses Drizzle ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts` with users table
- Migrations managed via `drizzle-kit` commands

**Build & Deployment:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Development mode uses Vite middleware for HMR
- Production serves static files from Express
# Overview

LineusAPI is a real-time chat application built with React, Express.js, and WebSockets. The application provides an AI-powered conversational interface with support for multiple AI models, customizable conversation presets, and real-time communication. The frontend uses modern React with TypeScript and Tailwind CSS for styling, while the backend implements a RESTful API with WebSocket support for live chat functionality.

# User Preferences

Preferred communication style: Simple, everyday language.
Animation preferences: Grid-based moving effects, no floating particles/bubbles.
UI preferences: macOS-style design elements, light gray borders (not black), ultra-smooth butter-like transitions using cubic-bezier(0.23, 1, 0.32, 1), dramatic hover scaling effects (35% scale increase) for buttons, normalize-then-scale animation behavior (all buttons reset to same size before applying hover effect), San Francisco system font, macOS-style dialog opening animations with scale and fade effects.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Real-time Communication**: Custom WebSocket hook for live chat functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Development Server**: Custom Vite integration for development mode
- **API Design**: RESTful endpoints with middleware for request logging and error handling
- **Real-time Features**: WebSocket server using 'ws' library for chat functionality
- **Data Storage**: In-memory storage implementation with interface for future database integration

## Data Storage Solutions
- **Current Implementation**: Memory-based storage using Maps for users, conversations, and messages
- **Schema Definition**: Drizzle ORM schemas defined for PostgreSQL migration readiness
- **Database Config**: Drizzle Kit configured for PostgreSQL with Neon Database serverless driver
- **Migration Support**: Database migration structure prepared in `/migrations` directory

## Authentication and Authorization
- **Current State**: Mock authentication system for development/demo purposes
- **Demo User**: Hardcoded demo user for testing chat functionality
- **Future Implementation**: Structured for JWT-based authentication integration
- **Session Management**: connect-pg-simple prepared for PostgreSQL session storage

## External Service Integrations
- **AI Models**: OpenRouter API integration for multiple AI model access
- **Supported Models**: Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, Google Gemini, Meta Llama, and auto-routing
- **Speech Features**: Browser-native Speech Recognition and Speech Synthesis APIs
- **WebSocket Communication**: Custom protocol for real-time chat message exchange

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **Backend Framework**: Express.js with TypeScript support
- **Build Tools**: Vite with React plugin, esbuild for production builds

## Database and ORM
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Database Driver**: @neondatabase/serverless for PostgreSQL connection
- **Session Store**: connect-pg-simple for PostgreSQL session management

## UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Animations**: Class Variance Authority for component variants

## Real-time and Communication
- **WebSockets**: 'ws' library for server-side WebSocket handling
- **State Management**: TanStack React Query for server state synchronization
- **Form Handling**: React Hook Form with Hookform Resolvers

## AI and External APIs
- **AI Integration**: OpenRouter API for accessing multiple AI models
- **HTTP Client**: Native Fetch API for external service communication
- **Validation**: Zod for runtime type validation and schema definition

## Development and Deployment
- **Development**: tsx for TypeScript execution, Replit-specific plugins
- **Production**: esbuild bundling with ES modules support
- **Environment**: Node.js with ES modules configuration
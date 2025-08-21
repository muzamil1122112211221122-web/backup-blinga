# Overview

Forus Heavy API is a real-time chat application built with React, Express.js, and WebSockets. The application provides an AI-powered conversational interface with support for multiple AI models, customizable conversation presets, and real-time communication. The frontend uses modern React with TypeScript and Tailwind CSS for styling, while the backend implements a RESTful API with WebSocket support for live chat functionality.

## Recent Updates (August 21, 2025)
- **✓ Updated App Name to "Forus Heavy API"**: Changed all references from LineusAPI to Forus Heavy API throughout the application
- **✓ Enhanced Black Hole Animation**: Original animated background using pure black and white gradients for copyright-free design
- **✓ Added Multiple AI Model Showcase**: Featured Claude 3.5 Sonnet, GPT-4o, Gemini Pro, Llama 3, plus exclusive Forus-Intelligence models
- **✓ Implemented Google OAuth Integration**: Added Google Sign-in functionality with proper authentication flow
- **✓ Fixed Demo Authentication**: Resolved 404 Page Not Found error with proper GET route handling
- **✓ Space-Themed Landing Page**: Complete landing page with twinkling stars, gradient backgrounds, and professional layout
- **✓ Multiple Login Options**: Users can now choose between Google OAuth or demo login
- **✓ App's Own Model Examples**: Added Forus-Intelligence Pro and Forus-Intelligence Lite as exclusive AI models

## Previous Updates (August 17, 2025)
- **✓ Fixed Database Connection Issues**: Resolved DATABASE_URL environment variable problems and successfully provisioned PostgreSQL database
- **✓ Fixed TypeScript Compilation Errors**: Corrected array iteration and type safety issues in routes.ts
- **✓ 10 OpenRouter API Keys Integrated**: All 10 API keys now properly loaded and available for load balancing
- **✓ New API Keys with Credits Added**: Updated rotation to prioritize new keys with sufficient credits
- **✓ AI-Powered Image Generation Fixed**: Now uses AI to create custom search queries for accurate image matching
- **✓ Enhanced Smart Fallback System**: Intelligent keyword extraction for better image results when AI is unavailable
- **✓ Fixed Image Display Bug**: Chat interface now properly displays generated images instead of "Unsupported image"
- **✓ Set NEW_2 API Key as Primary**: Prioritized 2nd new API key for optimal performance
- **✓ Fixed Real AI Image Generation**: Chat now uses actual OpenRouter AI to generate images instead of placeholders
- **✓ Fixed Image Preview Flickering**: Eliminated disappearing/appearing preview bug in image generation dialog
- **✓ Replaced AI Generation with Internet Search**: Now searches real internet photos instead of generating images for better reliability
- **✓ Fixed AI Response Truncation**: Increased token limit to 1500 to prevent responses from being cut off mid-completion
- **✓ Database Schema Deployed**: Successfully pushed Drizzle schema to PostgreSQL database
- **✓ Application Successfully Running**: Server now running on port 5000 with full functionality
- **Advanced Credit Management System**: Intelligent API key rotation with automatic failure detection and recovery
- **Smart Retry Logic**: 4-attempt system with progressive token reduction (400→300→200→150 tokens) for optimal success rates
- **Automatic Key Switching**: Seamlessly switches between 6 OpenRouter keys when credits are exhausted or rate limits hit
- **Failure Tracking & Recovery**: Failed keys automatically re-enabled after timeout periods (30-60 seconds based on failure frequency)
- **Enhanced Error Handling**: Graceful degradation with informative error messages when all keys are exhausted
- **Prompt Enhancement Optimization**: 3-retry system for prompt enhancement with reduced token limits (150→100→80)
- **Real-time Key Status Monitoring**: Console logging shows which keys are working and failure reasons
- **Progressive Backoff Strategy**: Intelligent wait times between retries to respect rate limits
- **Clean Prompt Enhancement**: ✦ button removes unwanted prefix text like "Here is an improved version..."
- **Enhancement Loading State**: Shows spinner and "AI is enhancing prompt..." message during processing
- **Smart API Key Management**: 6 OpenRouter keys with automatic fallback when keys have insufficient credits  
- **Permanent Database Integration**: PostgreSQL setup with proper schema and conversation storage
- **AI Chat Functionality**: Full working AI responses through OpenRouter API with multiple model support
- **Modern School Database**: Added real schools like Beaconhouse, LGS, The City School organized by cities/countries
- **Smart School Fallback**: Intelligent system provides authentic school names even when AI is unavailable
- **Regional School Recognition**: System recognizes Pakistan, India, UK, USA, Canada, Australia, UAE, Saudi schools
- **Ultra-Fast Claude Haiku**: Uses fastest AI model for 2-3 second enhancement responses
- **Smart Prompt Improvement**: AI transforms short text into longer, better-written prompts with perfect grammar
- **Forus Education Model**: Added specialized educational AI model with examination and voice-based learning
- **Education Modal System**: Comprehensive UI for school search, curriculum selection, and file uploads
- **Smart School Search**: AI-powered school discovery with intelligent fallbacks for any city/country
- **Examination Generation**: Create comprehensive tests based on uploaded materials and school curricula
- **Voice-based Learning Assessment**: Interactive speaking practice with AI feedback and corrections
- **Multiple Education Systems**: Support for O/A levels, Matric, and international curricula
- **Robust Error Handling**: Fallback systems ensure functionality even during API limitations
- **Real Image Search**: Fixed placeholder system to use AI-powered real photo search via OpenRouter
- **OpenRouter Integration**: All functionality uses existing OpenRouter keys with 6-key rotation

# User Preferences

Preferred communication style: Simple, everyday language.
Animation preferences: Grid-based moving effects, no floating particles/bubbles.
UI preferences: macOS-style design elements, light gray borders (not black), ultra-smooth butter-like transitions using cubic-bezier(0.23, 1, 0.32, 1), dramatic hover scaling effects (35% scale increase) for buttons, normalize-then-scale animation behavior (all buttons reset to same size before applying hover effect), San Francisco system font, authentic macOS app opening animation (line appears, grows, then window appears).

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
# Code Snippets

A modern web application for managing and organizing code snippets, notes, and checklists with AI-powered content generation capabilities.
**Documentation:** [Visit the Code Snippets full notes](https://bjrfx.github.io/code-snippets) - Comprehensive documentation and usage guides.

**Try it out:** [Live Demo](https://mango-sea-071c1eb1e-preview.westus2.6.azurestaticapps.net/) - Experience the application instantly in your browser.

## Overview

Code Snippets is a full-stack application that helps developers store, organize, and retrieve their code snippets, notes, and checklists. It features a clean, intuitive interface with project organization, tagging, and powerful AI assistance for generating content.

![Code Snippets Light Mode](assets/images/Snippets-light.png)
![Code Snippets Dark Mode](assets/images/Snippets-dark.png)

## Features

### Core Functionality

- **Multiple Content Types**: Store and manage code snippets, notes, and checklists in one place
- **Project Organization**: Group related items into projects for better organization
  ![Projects View](assets/images/Projects-light.png)
- **Tagging System**: Add tags to items for easy filtering and searching
- **User Authentication**: Secure user accounts with Firebase authentication
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### AI-Powered Assistance

- **AI Content Generation**: Leverage Cohere AI to generate:
  - Code snippets in multiple programming languages
  - Detailed, well-structured notes
  - Task checklists
- **Smart Language Detection**: Automatically detects the programming language of generated code
- **Natural Language Processing**: Create content by describing what you need in plain English

### Developer Experience

- **Syntax Highlighting**: Code is displayed with proper syntax highlighting
- **Customizable Settings**: Adjust theme and font size to your preference
  ![Appearance Settings](assets/images/Appearence.png)
- **Real-time Updates**: Changes are reflected immediately across the application

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- CodeMirror for code editing
- React Query for state management
- Wouter for routing

### Backend
- Express.js server
- Firebase Authentication
- Firestore database
- Drizzle ORM

### AI Integration
- Cohere AI API for content generation

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for authentication and database)
- Cohere API key (for AI features)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/code-snippets.git
   cd code-snippets
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   
   # Cohere API Configuration
   COHERE_API_KEY=your_cohere_api_key
   ```

4. Update the Cohere API keys in `client/src/lib/cohere.ts` with your own keys.

## Usage

### Development

Start the development server:

```bash
npm run dev
```

This will start both the backend server and the frontend development server. The application will be available at http://localhost:5001.

### Building for Production

Build the application for production:

```bash
npm run build
```

### Starting Production Server

Start the production server:

```bash
npm run start
```

## Using the AI Features

![Gradient UI](assets/images/Gradient.png)

1. Click on the sparkle icon in the application to open the AI Bar
2. Enter a prompt describing what you want to create:
   - For code snippets: "Create a snippet for sorting an array in JavaScript"
   - For notes: "Write a note about React hooks"
   - For checklists: "Make a checklist for deploying a web application"
3. The AI will generate the content and save it to your account

## Project Structure

```
├── client/               # Frontend code
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── pages/        # Page components
│   │   └── styles/       # CSS and styling
├── server/               # Backend code
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database interactions
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Data schemas
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## User Profile

![User Profile](assets/images/profile.png)

## Admin Dashboard

### User Management
The admin dashboard provides powerful user management capabilities, allowing administrators to view all users, filter by role, and modify user permissions.

![User Management](assets/images/admin-user-managment.png)

### User Information
Detailed user information is available to administrators, including email, creation date, and current role status.

![User Information](assets/images/admin-user-information.png)

### Premium Access Requests
Administrators can manage premium access requests, granting temporary or permanent premium status to users.

![Premium Access Requests](assets/images/admin-premium-access-request.png)

## Acknowledgements

- [Cohere](https://cohere.ai/) for providing the AI text generation API
- [Firebase](https://firebase.google.com/) for authentication and database services
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
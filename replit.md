# Genre AI 2.0 - Static Website

## Overview
This is a static HTML website originally created with Webflow. It appears to be for a creative platform called "Genre" that focuses on storytelling and creative content. The website includes multiple pages showcasing features like creative suites, revenue streams, and reader engagement.

## Project Structure
- **Frontend**: Static HTML/CSS/JavaScript website
- **Main Pages**: 
  - `index.html` - Main homepage
  - `ai-spark.html` - AI Spark page
  - `style-guide.html` - Style guide and design system
- **Assets**: 
  - `css/` - Stylesheets including Webflow CSS
  - `js/` - JavaScript files
  - `images/` - Image assets and logos
  - `videos/` - Video content

## Setup and Configuration
- **Server**: Python HTTP server serving static files on port 5000
- **Host Configuration**: Server bound to 0.0.0.0 to work with Replit's proxy system
- **Cache Control**: Disabled caching to prevent update issues in development
- **Deployment**: Configured for autoscale deployment target

## Technical Details
- **Language**: Python 3.11 (for server only)
- **Server Port**: 5000 (frontend)
- **Architecture**: Pure static website, no backend
- **Framework**: Webflow-generated HTML/CSS

## Recent Changes
- **2025-09-13**: Initial Replit setup completed
  - Created Python server script with cache control headers
  - Configured workflow for static file serving
  - Set up deployment configuration for production
  - Verified all assets loading properly

## Project Status
The website is fully functional and ready for development or deployment. All static assets are being served correctly, and the site loads without issues in the Replit environment.
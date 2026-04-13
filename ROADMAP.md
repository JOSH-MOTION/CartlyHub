# CarlyHub Platform Roadmap

This document outlines the planned future enhancements and architectural evolutions for the CarlyHub marketplace.

## Upcoming Phases

### Phase 1: Seller Self-Service Portal (High Priority)
Currently, products are managed primarily through a centralized admin interface. In the future, the platform will transition to a true multi-vendor model.
- **Independent Seller Accounts**: Each seller will have their own login and profile.
- **Self-Service Uploads**: Sellers will be able to upload, manage, and track their own products directly.
- **Seller Dashboard**: Analytics for individual sellers to track their sales, ratings, and customer feedback.
- **Automated Payouts**: Integration for automatic revenue sharing and seller payouts.

### Phase 2: Enhanced Moderation & Trust
- **Review Moderation Queue**: Admin dashboard to review and approve product reviews before they go public.
- **Verified Purchase Badges**: Automatically tagging reviews from users who have completed an order for that specific item.
- **Seller Verification Tiers**: "Gold" or "Verified" badges for high-performing sellers.

### Phase 3: Advanced Search & Discovery
- **Global Search Bar**: Real-time searching across categories, regions, and seller names.
- **Saved Searches**: Allowing users to get notified when new items match their specific interests.
- **Personalized Recommendations**: "You might also like" section based on browsing history.

## Technical Debt & Maintenance
- **Authentication Hardening**: Migrating to more robust Firebase Auth rules for seller data isolation.
- **Image Optimization**: Automatic resizing of uploaded product images for faster load times.
- **Performance Monitoring**: Implementing Vercel Analytics for real-time performance tracking.

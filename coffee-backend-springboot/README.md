# Coffee House Backend (Spring Boot)

This is the migrated backend for the Coffee House project, replacing the previous Node.js implementation.

## Tech Stack
- **Framework**: Spring Boot 2.7.18
- **Language**: Java 8 (Compatible with your current environment)
- **Security**: Spring Security + JWT
- **Database**: MySQL
- **Email**: Java Mail Sender (SMTP via Gmail)
- **Build Tool**: Maven

## Features Implemented
- **JWT Authentication**: Secure login and role-based access control.
- **Role-Based Workflow**: Supporting Admin, Café Owner, and Customer roles.
- **Admin Approval System**: New registrations are held for admin review.
- **Automated Credentialing**: On approval, a temporary password is generated and emailed to the user.
- **Profile Management**: Full support for multi-step registration data (Academic, Work, Address).
- **Static Assets**: Serving uploaded government ID proofs (PDFs) via `/uploads/`.

## Setup Instructions
1. **Database**: Ensure MySQL is running and the `coffee_house_db` database exists.
2. **Configuration**: Review `src/main/resources/application.properties` for your database and email credentials.
3. **Run**: 
   - Use your IDE (IntelliJ IDEA, Eclipse, or VS Code) to run the `CafeApplication.java` class.
   - Alternatively, use Maven: `mvn spring-boot:run`

## Default Credentials
- **Admin**: `admin@coffeehouse.com` / `admin123`

# Web-Based Coffee Ordering and Management System
## Project Documentation – Milestone 1

### Abstract
The Web-Based Coffee Ordering and Management System is a role-based web application designed to digitize and streamline café registration and administrative workflows. Milestone 1 focuses on implementing a secure user onboarding system, including multi-step registration, document verification, administrative approval, and OTP-based authentication. The system ensures data security, structured onboarding, and scalable architecture using modern web technologies.

---

### Chapter 1: System Overview
The system provides a centralized platform where Customers and Café Owners can register and access services after verification. The platform enforces structured data collection, secure authentication, and administrative control to ensure reliability and authenticity.

*(Insert Home Page Screenshot here)*

---

### Chapter 2: Registration Workflow
The registration process follows a multi-phase structure. In the first phase, users provide personal and role-based information. In the second phase, academic records can be added dynamically. The third phase allows optional work experience entries. Finally, users upload a government-issued proof for verification purposes.

After submission, the system sends an email informing the applicant that their registration is under review. Access is granted only after administrative approval.

**Step 1: Personal & Role Details**
*(Insert Step 1 Screenshot here)*

**Step 2: Academic Records**
*(Insert Step 2 Screenshot here)*

**Step 3: Work Experience**
*(Insert Step 3 Screenshot here)*

**Step 4: Document Upload**
*(Insert Step 4 Screenshot here)*

---

### Chapter 3: Administrative Module
The Admin Dashboard provides complete visibility over user registrations. It displays pending requests, verified users, and overall statistics. The administrator has the authority to approve or reject applications. Upon approval, the system generates and sends a One-Time Password (OTP) to enable secure first-time login.

*(Insert Admin Dashboard & Approval Screenshots here)*

---

### Chapter 4: Authentication and Security
Security is implemented using Spring Security and JWT-based authentication. Passwords are encrypted using BCrypt before being stored in the database. During first-time login, users authenticate using an OTP and are required to set a new password to activate their account.

*(Insert Login & Reset Password Screenshots here)*

---

### Chapter 5: Technology Stack
- **Frontend**: React.js, CSS3
- **Backend**: Java, Spring Boot, Spring Security
- **Database**: MySQL with Spring Data JPA and Hibernate
- **Build Tools**: Maven and Node Package Manager

---

### Chapter 6: System Execution
- **To run the Backend**: `mvn spring-boot:run`
- **To run the Frontend**: `npm start`

---

### Chapter 7: Conclusion and Future Scope
Milestone 1 establishes a secure and scalable foundation for the system. The completed modules include registration workflow, admin verification, OTP-based authentication, and dashboard analytics. Future development will integrate table booking, order management, payment gateway integration, and multi-branch café support.

# How to Run the Spring Boot Backend

## ✅ Implementation Complete

The Spring Boot backend is now **fully compatible** with your frontend. The missing `/api/reset-password` endpoint has been added to [`AuthController.java`](file:///d:/Cafe/coffee-backend-springboot/src/main/java/com/coffee/cafe/controller/AuthController.java).

## 🚀 How to Start the Backend

You have **three options** to run the Spring Boot application:

### Option 1: Using IntelliJ IDEA (Recommended)

1. Open IntelliJ IDEA
2. **File → Open** → Select `d:\Cafe\coffee-backend-springboot`
3. Wait for IntelliJ to import the Maven project
4. Navigate to `src/main/java/com/coffee/cafe/CafeApplication.java`
5. Right-click on the file → **Run 'CafeApplication'**

The backend will start on **port 5005**.

### Option 2: Using VS Code with Java Extensions

1. Open VS Code
2. Install the "Extension Pack for Java" if not already installed
3. **File → Open Folder** → Select `d:\Cafe\coffee-backend-springboot`
4. Open `src/main/java/com/coffee/cafe/CafeApplication.java`
5. Click the **Run** button that appears above the `main` method

### Option 3: Using Maven (Command Line)

If Maven is installed, run:
```bash
cd d:\Cafe\coffee-backend-springboot
mvn spring-boot:run
```

If Maven is not in your PATH, you can install it or use your IDE instead.

### Option 4: Running Pre-built JAR (If Available)

If the application was previously built, you can run the JAR directly:
```bash
cd d:\Cafe\coffee-backend-springboot\target
java -jar cafe-0.0.1-SNAPSHOT.jar
```

## ✔️ Verification

Once the backend starts, you should see:
```
Tomcat started on port(s): 5005 (http)
Started CafeApplication in X.XXX seconds
```

You can verify it's working by visiting: **http://localhost:5005/api/test** (if that endpoint exists)

## 🔄 Switching from Node.js to Spring Boot

### Step 1: Stop Node.js Backend (if running)
If the Node.js backend is currently running, stop it (Ctrl+C in the terminal or close the process).

### Step 2: Start Spring Boot Backend
Use one of the methods above to start the Spring Boot backend.

### Step 3: Verify Frontend Connection
The frontend at `http://localhost:3000` is already configured to call `http://localhost:5005/api/*` endpoints, so it will automatically connect to the Spring Boot backend once it's running.

## 📋 Configuration Checklist

Before running, verify these settings in [`application.properties`](file:///d:/Cafe/coffee-backend-springboot/src/main/resources/application.properties):

- ✅ **Port**: `server.port=5005`
- ⚠️ **Database**: `spring.datasource.url=jdbc:mysql://localhost:3306/coffee_house_db`
  - Ensure MySQL is running
  - Database `coffee_house_db` exists
  - Username: `root`
  - Password: `bunny@122` (verify this is correct)
- ⚠️ **Email**: Verify SMTP settings for sending approval emails
  - Email: `akhilakoyada12@gmail.com`
  - **Note**: For Gmail, you may need to use an App Password instead of your regular password

## 🎯 Next Steps

1. **Choose your preferred method** from the options above
2. **Start the Spring Boot backend**
3. **Test the application** with your frontend
4. **Optionally**: Archive or delete the `coffee-backend` (Node.js) folder once you confirm everything works

## 🐛 Troubleshooting

**"Cannot connect to database"**
- Ensure MySQL is running
- Verify database credentials in `application.properties`
- Check that database `coffee_house_db` exists

**"Port 5005 already in use"**
- The Node.js backend might still be running - stop it first
- Or change the port in `application.properties` (but you'll also need to update the frontend)

**"Email not sending"**
- For Gmail, you need an App Password (not your regular password)
- Go to Google Account → Security → 2-Step Verification → App Passwords

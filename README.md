# 🎮 E-Sports Tournament Management System

---

## 🏫 Department Information
**Department of Computer Science and Engineering**  
**Course Code:** CSE 2291  
**Course Title:** Software Development Lab 2  
**Project Title:** E-sports Tournament Management System  

---

## 📌 Submitted To
**Amir Labib Khan**  
Lecturer  
Department of Computer Science and Engineering  
Northern University Bangladesh  

---

## ✍️ Submitted By
- **Md Al Amin** — ID: 41230301816  
- **Sanzid Zaman** — ID: 41230301367  
- **Md. Imran Hosen** — ID: 41230301851  

---

## 🚀 Project Overview
This project is a **Esports Tournament Management System** developed using **PHP & MySQL**.  
It allows management of:
- Players 👤
- Teams 🏆
- Matches ⚔️
- Tournaments 🗓️
- Results 📊

---

## 🛠️ Features
- Add & manage players
- Create & manage teams
- Organize tournaments
- Match scheduling system
- Store and view results

---

## 🖥️ Technologies Used
- **PHP**
- **MySQL**
- **CSS**
- **HTML**

---

## 📂 Project Structure
```bash
E_Sports_Tournament_Management/
│── esports_python_app/  # Python FastAPI version
│   ├── backend/         # FastAPI backend source
│   └── frontend/        # HTML/JS frontend pages
│── css/                 # PHP app stylesheets
│── index.php            # PHP app pages
│── run_project.bat      # Quick-launch batch file
│── esports_management.sql # Database schema and sample data
```

---

## ⚙️ How to Run the Project

Both versions require a **MySQL Database** to store the tournament data.

### Step 1: Set Up MySQL Database
1. Start your local MySQL server (e.g., using **XAMPP**, **WampServer**, or **Laragon**).
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`) or any SQL client.
3. Create a database named `esports_tournament`.
4. Import the [esports_management.sql](file:///c:/Users/Sanzid%20Zaman/Downloads/E_Sports_Tournament_Management-main/E_Sports_Tournament_Management-main/esports_management.sql) file into that database.

---

### Option A: Run the Python FastAPI Version (Recommended)

To run the modern API-driven version:
1. Double-click the **[run_project.bat](file:///c:/Users/Sanzid%20Zaman/Downloads/E_Sports_Tournament_Management-main/E_Sports_Tournament_Management-main/run_project.bat)** file at the root of the project.
   - This will start the FastAPI backend server on port 8000 and open the frontend dashboard in your default browser.

#### Demo Admin Credentials:
- **Username**: `admin`
- **Password**: `admin123`

---

### Option B: Run the PHP Version

To run the traditional PHP version:
1. Copy the project files to your server's root folder (e.g., `htdocs` for XAMPP).
2. Open your browser and navigate to:
   ```
   http://localhost/E_Sports_Tournament_Management/index.php
   ```

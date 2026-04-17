# Attendance Tracker

Attendance Tracker is a location-based class attendance web app built with HTML, CSS, and Vanilla JavaScript.

The app allows an instructor to set the classroom location, choose an allowed radius, and open the attendance window. A student can sign in with a GitHub username, allow browser location access, and check in only when they are inside the allowed classroom radius during an active session.

# Features

- GitHub-style sign-in using a public GitHub profile
- Browser geolocation access
- Instructor classroom setup
- Radius-based attendance validation
- Instructor-controlled check-in window
- Duplicate attendance prevention
- Student attendance history
- Instructor live roster
- Local storage persistence

# Technologies Used

- HTML
- CSS
- Vanilla JavaScript
- Fetch API
- Geolocation API
- Local Storage

# How to Run

1. Clone or download the repository
2. Open the project folder in VS Code
3. Run the app with Live Server
4. Open the local URL in your browser

# Demo Flow

1. Sign in as Instructor
2. Enter course name, instructor name, room, latitude, longitude, and radius
3. Save the classroom setup
4. Open the check-in window
5. Sign out
6. Sign in as Student
7. Enable location
8. Press Check In

# Screenshots
# Auth Screen
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/37baac5f-9b90-4263-8961-7610845346c5" />

# Student Screen
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/56c85f3e-55f0-469c-bfba-a3bf75d69c0f" />

# Instructor Screen
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/07ea03f8-3ff5-4d34-ad4d-3c4a0e1da4e2" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a0826c99-0b11-4c7c-9437-e126482b48e0" />

# Live Demo
https://youtu.be/niFdUL7cGIU

# Video Walkthrough
https://youtu.be/MEIuZEVbVTE

# Notes
- Geolocation works best on **localhost** or **HTTPS**
- The GitHub sign-in in this project is a simplified demo using public GitHub profile data
- This project was designed around a student check-in flow and an instructor classroom management flow

document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn")
  const authForms = document.querySelectorAll(".auth-form")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab")

      // Remove active class from all buttons and hide all forms
      tabBtns.forEach((b) => b.classList.remove("active"))
      authForms.forEach((form) => form.classList.add("hidden"))

      // Add active class to clicked button and show corresponding form
      btn.classList.add("active")
      document.getElementById(`${tabName}-form`).classList.remove("hidden")
    })
  })

  // Admin login link
  const adminLoginLink = document.getElementById("admin-login-link")
  const userLoginLink = document.getElementById("user-login-link")

  adminLoginLink.addEventListener("click", (e) => {
    e.preventDefault()
    authForms.forEach((form) => form.classList.add("hidden"))
    document.getElementById("admin-login-form").classList.remove("hidden")
    tabBtns.forEach((b) => b.classList.remove("active"))
  })

  userLoginLink.addEventListener("click", (e) => {
    e.preventDefault()
    authForms.forEach((form) => form.classList.add("hidden"))
    document.getElementById("login-form").classList.remove("hidden")
    tabBtns[0].classList.add("active")
  })

  // Register form submission
  const registerBtn = document.getElementById("register-btn")
  registerBtn.addEventListener("click", () => {
    const name = document.getElementById("register-name").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value
    const confirmPassword = document.getElementById("register-confirm-password").value

    if (!name || !email || !password || !confirmPassword) {
      showNotification("Please fill in all fields", "error")
      return
    }

    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error")
      return
    }

    // Send registration request to server
    fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Registration successful! Please login.")
          // Switch to login tab
          tabBtns[0].click()
        } else {
          showNotification(data.message || "Registration failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // User login form submission
  const loginBtn = document.getElementById("login-btn")
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    if (!email || !password) {
      showNotification("Please enter email and password", "error")
      return
    }

    // Send login request to server
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Login successful!")
          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(data.user))
          localStorage.setItem("token", data.token)
          // Redirect to dashboard
          window.location.href = "dashboard.html"
        } else {
          showNotification(data.message || "Login failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // Admin login form submission
  const adminLoginBtn = document.getElementById("admin-login-btn")
  adminLoginBtn.addEventListener("click", () => {
    const email = document.getElementById("admin-email").value
    const password = document.getElementById("admin-password").value

    if (!email || !password) {
      showNotification("Please enter email and password", "error")
      return
    }

    // Send admin login request to server
    fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Admin login successful!")
          // Store admin data in localStorage
          localStorage.setItem("admin", JSON.stringify(data.admin))
          localStorage.setItem("adminToken", data.token)
          // Redirect to admin dashboard
          window.location.href = "admin-dashboard.html"
        } else {
          showNotification(data.message || "Admin login failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })
})

// Notification function
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  notification.textContent = message
  notification.className = "notification show"

  if (type === "error") {
    notification.classList.add("error")
  }

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}


document.addEventListener("DOMContentLoaded", () => {
  // Check if admin is logged in
  const admin = JSON.parse(localStorage.getItem("admin") || "{}")
  const adminToken = localStorage.getItem("adminToken")

  if (!admin.email || !adminToken) {
    // Redirect to login page if not logged in
    window.location.href = "login.html"
    return
  }

  // Set admin info in sidebar
  document.getElementById("admin-name").textContent = admin.name || "Admin User"
  document.getElementById("admin-email").textContent = admin.email

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
  const sidebar = document.getElementById("sidebar")

  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
  })

  // Navigation
  const navLinksToggle = () => {
    sidebar.classList.toggle("active")
  }

  // Navigation
  const navLinks = document.querySelectorAll(".nav-menu a[data-page]")
  const pages = document.querySelectorAll(".page")

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const pageName = link.getAttribute("data-page")

      // Remove active class from all links and pages
      navLinks.forEach((l) => l.classList.remove("active"))
      pages.forEach((p) => p.classList.remove("active"))

      // Add active class to clicked link and corresponding page
      link.classList.add("active")
      document.getElementById(`${pageName}-page`).classList.add("active")

      // Update page header title
      document.querySelector(".page-header h1").textContent = link.querySelector("span").textContent

      // Close mobile menu if open
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active")
      }
    })
  })

  // Logout
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault()
    localStorage.removeItem("admin")
    localStorage.removeItem("adminToken")
    window.location.href = "index.html"
  })

  // Load admin data, users and transactions
  loadAdminData()

  // Credit user form
  document.getElementById("credit-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const userEmail = document.getElementById("credit-user-email").value
    const amount = Number.parseFloat(document.getElementById("credit-amount").value)
    const note = document.getElementById("credit-note").value

    if (!userEmail || !amount || amount <= 0) {
      showNotification("Please enter valid user email and amount", "error")
      return
    }

    // Send credit user request to server
    fetch("/api/admin/credit-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userEmail,
        amount,
        note,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("User credited successfully!")
          document.getElementById("credit-form").reset()
          loadAdminData() // Reload admin data to update balance and users
        } else {
          showNotification(data.message || "Credit failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // Add fund account functionality after the credit user form event listener

  // Fund options
  const fundOptions = document.querySelectorAll(".fund-option")
  const fundFormContainer = document.getElementById("admin-fund-form-container")
  const paymentMethodFields = document.getElementById("admin-payment-method-fields")
  let selectedMethod = ""

  fundOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedMethod = option.getAttribute("data-method")
      fundFormContainer.classList.remove("hidden")

      // Generate payment method specific fields
      paymentMethodFields.innerHTML = ""

      if (selectedMethod === "visa") {
        paymentMethodFields.innerHTML = `
                <div class="form-group">
                    <label for="card-number">Card Number</label>
                    <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
                </div>
                <div class="form-group">
                    <label for="card-name">Name on Card</label>
                    <input type="text" id="card-name" placeholder="John Doe" required>
                </div>
                <div class="transaction-form">
                    <div class="form-group">
                        <label for="expiry-date">Expiry Date</label>
                        <input type="text" id="expiry-date" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="text" id="cvv" placeholder="123" required>
                    </div>
                </div>
            `
      } else if (selectedMethod === "paypal") {
        paymentMethodFields.innerHTML = `
                <div class="form-group">
                    <label for="paypal-email">PayPal Email</label>
                    <input type="email" id="paypal-email" placeholder="your@email.com" required>
                </div>
            `
      } else if (selectedMethod === "bitcoin" || selectedMethod === "binance") {
        paymentMethodFields.innerHTML = `
                <div class="form-group">
                    <label for="crypto-address">${selectedMethod === "bitcoin" ? "Bitcoin" : "Binance"} Address</label>
                    <input type="text" id="crypto-address" placeholder="Your ${selectedMethod === "bitcoin" ? "Bitcoin" : "Binance"} Address" required>
                </div>
            `
      }
    })
  })

  // Cancel fund button
  document.getElementById("cancel-admin-fund").addEventListener("click", () => {
    fundFormContainer.classList.add("hidden")
    document.getElementById("admin-fund-form").reset()
  })

  // Fund admin account form
  document.getElementById("admin-fund-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const amount = Number.parseFloat(document.getElementById("admin-fund-amount").value)

    if (!amount || amount <= 0) {
      showNotification("Please enter a valid amount", "error")
      return
    }

    // Collect payment method specific data
    const paymentData = { method: selectedMethod }

    if (selectedMethod === "visa") {
      paymentData.cardNumber = document.getElementById("card-number").value
      paymentData.cardName = document.getElementById("card-name").value
      paymentData.expiryDate = document.getElementById("expiry-date").value
      paymentData.cvv = document.getElementById("cvv").value
    } else if (selectedMethod === "paypal") {
      paymentData.paypalEmail = document.getElementById("paypal-email").value
    } else if (selectedMethod === "bitcoin" || selectedMethod === "binance") {
      paymentData.cryptoAddress = document.getElementById("crypto-address").value
    }

    // Send fund account request to server
    fetch("/api/admin/fund-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount,
        paymentData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Account funded successfully!")
          fundFormContainer.classList.add("hidden")
          document.getElementById("admin-fund-form").reset()
          loadAdminData() // Reload admin data to update balance
        } else {
          showNotification(data.message || "Funding failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // User modal
  const userModal = document.getElementById("user-modal")
  const userModalBody = document.getElementById("user-modal-body")
  const modalCloseButtons = document.querySelectorAll(".modal-close, .modal-close-btn")

  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      userModal.classList.remove("active")
    })
  })

  // Close modal when clicking outside
  userModal.addEventListener("click", (e) => {
    if (e.target === userModal) {
      userModal.classList.remove("active")
    }
  })
})

// Load admin data, users and transactions
function loadAdminData() {
  const adminToken = localStorage.getItem("adminToken")

  // Fetch admin data
  fetch("/api/admin/data", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update admin balance
        const balance = data.admin.balance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        document.getElementById("admin-balance").textContent = `$${balance}`
        document.getElementById("dashboard-admin-balance").textContent = `$${balance}`

        // Update stats
        document.getElementById("total-users").textContent = data.stats.totalUsers
        document.getElementById("total-transactions").textContent = data.stats.totalTransactions
        document.getElementById("total-credits").textContent =
          `$${data.stats.totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

        // Update users lists
        updateUsersList(data.users)

        // Update transactions list
        updateTransactionsList(data.transactions)
      } else {
        showNotification("Failed to load admin data", "error")
      }
    })
    .catch((error) => {
      showNotification("An error occurred while loading admin data", "error")
      console.error("Error:", error)
    })
}

// Update users list
function updateUsersList(users) {
  const recentUsersTable = document.getElementById("recent-users").querySelector("tbody")
  const allUsersTable = document.getElementById("all-users").querySelector("tbody")

  // Clear existing users
  recentUsersTable.innerHTML = ""
  allUsersTable.innerHTML = ""

  if (users.length === 0) {
    const noUsersRow = `
            <tr>
                <td colspan="6" style="text-align: center;">No users yet</td>
            </tr>
        `
    recentUsersTable.innerHTML = noUsersRow
    allUsersTable.innerHTML = noUsersRow
    return
  }

  // Sort users by join date (newest first)
  users.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))

  // Add users to tables
  users.forEach((user, index) => {
    const joinDate = new Date(user.joinDate).toLocaleDateString()
    const balance = user.balance.toFixed(2)

    const row = `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>$${balance}</td>
                <td>${joinDate}</td>
                <td>
                    <span class="status-badge active">Active</span>
                </td>
                <td>
                    <button class="btn btn-secondary view-user-btn" data-email="${user.email}">View</button>
                    <button class="btn btn-primary credit-user-btn" data-email="${user.email}">Credit</button>
                </td>
            </tr>
        `

    allUsersTable.innerHTML += row

    // Only show the 5 most recent users in the dashboard
    if (index < 5) {
      recentUsersTable.innerHTML += row
    }
  })

  // Add event listeners to view user buttons
  document.querySelectorAll(".view-user-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const userEmail = button.getAttribute("data-email")
      viewUserDetails(userEmail)
    })
  })

  // Add event listeners to credit user buttons
  document.querySelectorAll(".credit-user-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const userEmail = button.getAttribute("data-email")

      // Fill credit form with user email and switch to credit page
      document.getElementById("credit-user-email").value = userEmail

      // Find and click the credit page nav link
      document.querySelector('.nav-menu a[data-page="credit"]').click()
    })
  })
}

// View user details
function viewUserDetails(userEmail) {
  const adminToken = localStorage.getItem("adminToken")

  fetch(`/api/admin/user/${userEmail}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const user = data.user
        const joinDate = new Date(user.joinDate).toLocaleDateString()
        const balance = user.balance.toFixed(2)

        // Populate user modal
        document.getElementById("user-modal-body").innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                </div>
                <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
                    <div class="stat-card">
                        <div class="stat-title">Balance</div>
                        <div class="stat-value">$${balance}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Joined</div>
                        <div class="stat-value">${joinDate}</div>
                    </div>
                </div>
                <div>
                    <h4 style="margin-bottom: 10px;">Recent Transactions</h4>
                    <table class="transaction-list">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              user.transactions.length > 0
                                ? user.transactions
                                    .slice(0, 5)
                                    .map(
                                      (transaction) => `
                                    <tr>
                                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="transaction-type ${transaction.type.toLowerCase()}">${transaction.type}</span>
                                        </td>
                                        <td>${transaction.description}</td>
                                        <td class="amount-${transaction.type.toLowerCase()}">
                                            ${transaction.type === "Credit" ? "+" : "-"}$${transaction.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                `,
                                    )
                                    .join("")
                                : '<tr><td colspan="4" style="text-align: center;">No transactions yet</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            `

        // Show user modal
        document.getElementById("user-modal").classList.add("active")
      } else {
        showNotification("Failed to load user details", "error")
      }
    })
    .catch((error) => {
      showNotification("An error occurred while loading user details", "error")
      console.error("Error:", error)
    })
}

// Update transactions list
function updateTransactionsList(transactions) {
  const adminTransactionsTable = document.getElementById("admin-transactions").querySelector("tbody")

  // Clear existing transactions
  adminTransactionsTable.innerHTML = ""

  if (transactions.length === 0) {
    adminTransactionsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No transactions yet</td>
            </tr>
        `
    return
  }

  // Sort transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Add transactions to table
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date).toLocaleDateString()
    const type = transaction.type
    const description = transaction.description
    const amount = transaction.amount.toFixed(2)

    const row = `
            <tr>
                <td>${date}</td>
                <td>${transaction.userEmail}</td>
                <td>
                    <span class="transaction-type ${type.toLowerCase()}">${type}</span>
                </td>
                <td>${description}</td>
                <td class="amount-${type.toLowerCase()}">
                    ${type === "Credit" ? "+" : "-"}$${amount}
                </td>
            </tr>
        `

    adminTransactionsTable.innerHTML += row
  })
}

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


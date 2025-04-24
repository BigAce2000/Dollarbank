document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const token = localStorage.getItem("token")

  if (!user.email || !token) {
    // Redirect to login page if not logged in
    window.location.href = "login.html"
    return
  }

  // Set user info in sidebar
  document.getElementById("user-name").textContent = user.name
  document.getElementById("user-email").textContent = user.email
  document.getElementById("card-holder-name").textContent = user.name

  // Set user avatar with initials
  const userAvatar = document.getElementById("user-avatar")
  if (userAvatar && user.name) {
    const initials = user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
    userAvatar.textContent = initials
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
  const sidebar = document.getElementById("sidebar")

  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
  })

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
      if (window.innerWidth <= 991) {
        sidebar.classList.remove("active")
      }
    })
  })

  // Logout
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault()
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    window.location.href = "index.html"
  })

  // Load user data and transactions
  loadUserData()

  // Transaction tabs
  const transactionTabs = document.querySelectorAll(".transaction-tab")
  const transactionContents = document.querySelectorAll(".transaction-content")

  transactionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab")

      // Remove active class from all tabs and contents
      transactionTabs.forEach((t) => t.classList.remove("active"))
      transactionContents.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab and corresponding content
      tab.classList.add("active")
      document.getElementById(`${tabName}-content`).classList.add("active")
    })
  })

  // Transfer money form
  document.getElementById("transfer-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const recipientEmail = document.getElementById("recipient-email").value
    const amount = Number.parseFloat(document.getElementById("transfer-amount").value)
    const note = document.getElementById("transfer-note").value

    if (!recipientEmail || !amount || amount <= 0) {
      showNotification("Please enter valid recipient and amount", "error")
      return
    }

    // Send transfer request to server
    fetch("/api/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientEmail,
        amount,
        note,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Transfer successful!")
          document.getElementById("transfer-form").reset()
          loadUserData() // Reload user data to update balance
          generateActivityChart() // Update activity chart
        } else {
          showNotification(data.message || "Transfer failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // Fund user form
  document.getElementById("fund-user-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const userEmail = document.getElementById("fund-user-email").value
    const amount = Number.parseFloat(document.getElementById("fund-user-amount").value)
    const note = document.getElementById("fund-user-note").value

    if (!userEmail || !amount || amount <= 0) {
      showNotification("Please enter valid user email and amount", "error")
      return
    }

    // Send fund user request to server
    fetch("/api/fund-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
          showNotification("User funded successfully!")
          document.getElementById("fund-user-form").reset()
          loadUserData() // Reload user data to update balance
          generateActivityChart() // Update activity chart
        } else {
          showNotification(data.message || "Funding failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })

  // Fund options
  const fundOptions = document.querySelectorAll(".fund-option")
  const fundFormContainer = document.getElementById("fund-form-container")
  const paymentMethodFields = document.getElementById("payment-method-fields")
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
  document.getElementById("cancel-fund").addEventListener("click", () => {
    fundFormContainer.classList.add("hidden")
    document.getElementById("fund-form").reset()
  })

  // Fund account form
  document.getElementById("fund-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const amount = Number.parseFloat(document.getElementById("fund-amount").value)

    if (!amount || amount <= 0) {
      showNotification("Please enter a valid amount", "error")
      return
    }

    // Check if user has sufficient balance
    const currentBalance = Number.parseFloat(document.getElementById("user-balance").textContent.replace("$", ""))
    if (currentBalance < amount) {
      showNotification("Insufficient funds for this transfer", "error")
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

    // Send transfer to external account request to server
    fetch("/api/transfer-to-external", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        paymentData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Funds transferred successfully!")
          fundFormContainer.classList.add("hidden")
          document.getElementById("fund-form").reset()
          loadUserData() // Reload user data to update balance
        } else {
          showNotification(data.message || "Transfer failed", "error")
        }
      })
      .catch((error) => {
        showNotification("An error occurred. Please try again.", "error")
        console.error("Error:", error)
      })
  })
})

// Load user data and transactions
function loadUserData() {
  const token = localStorage.getItem("token")

  // Fetch user data
  fetch("/api/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update user balance
        const balance = data.user.balance.toFixed(2)
        document.getElementById("user-balance").textContent = `$${balance}`
        document.getElementById("dashboard-balance").textContent = `$${balance}`

        // Update stats
        document.getElementById("total-received").textContent = `$${data.stats.totalReceived.toFixed(2)}`
        document.getElementById("total-sent").textContent = `$${data.stats.totalSent.toFixed(2)}`
        document.getElementById("transaction-count").textContent = data.stats.transactionCount

        // Update transactions
        updateTransactionsList(data.transactions)
      } else {
        showNotification("Failed to load user data", "error")
      }
    })
    .catch((error) => {
      showNotification("An error occurred while loading user data", "error")
      console.error("Error:", error)
    })
}

// Update transactions list
function updateTransactionsList(transactions) {
  const recentTransactionsTable = document.getElementById("recent-transactions").querySelector("tbody")
  const allTransactionsTable = document.getElementById("all-transactions").querySelector("tbody")

  // Clear existing transactions
  recentTransactionsTable.innerHTML = ""
  allTransactionsTable.innerHTML = ""

  if (transactions.length === 0) {
    const noTransactionsRow = `
            <tr>
                <td colspan="5" style="text-align: center;">No transactions yet</td>
            </tr>
        `
    recentTransactionsTable.innerHTML = noTransactionsRow
    allTransactionsTable.innerHTML = noTransactionsRow
    return
  }

  // Sort transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Add transactions to tables
  transactions.forEach((transaction, index) => {
    const date = new Date(transaction.date).toLocaleDateString()
    const type = transaction.type
    const description = transaction.description
    const amount = transaction.amount.toFixed(2)
    const balance = transaction.balanceAfter.toFixed(2)

    const row = `
            <tr>
                <td>${date}</td>
                <td>
                    <span class="transaction-type ${type.toLowerCase()}">${type}</span>
                </td>
                <td>${description}</td>
                <td class="amount-${type.toLowerCase()}">
                    ${type === "Credit" ? "+" : "-"}$${amount}
                </td>
                <td>$${balance}</td>
            </tr>
        `

    allTransactionsTable.innerHTML += row

    // Only show the 5 most recent transactions in the dashboard
    if (index < 5) {
      recentTransactionsTable.innerHTML += row
    }
  })
}

// Generate activity chart
function generateActivityChart() {
  const activityChart = document.getElementById("activity-chart")
  if (!activityChart) return

  // Get transaction data from localStorage or use sample data
  const token = localStorage.getItem("token")

  fetch("/api/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.transactions && data.transactions.length > 0) {
        // Process transaction data for chart
        const transactions = data.transactions

        // Group by day of week
        const dayMap = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" }
        const dayTotals = {
          Mon: { credit: 0, debit: 0 },
          Tue: { credit: 0, debit: 0 },
          Wed: { credit: 0, debit: 0 },
          Thu: { credit: 0, debit: 0 },
          Fri: { credit: 0, debit: 0 },
          Sat: { credit: 0, debit: 0 },
          Sun: { credit: 0, debit: 0 },
        }

        // Only use transactions from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        transactions.forEach((transaction) => {
          const transDate = new Date(transaction.date)
          if (transDate >= thirtyDaysAgo) {
            const day = dayMap[transDate.getDay()]
            if (transaction.type === "Credit") {
              dayTotals[day].credit += transaction.amount
            } else {
              dayTotals[day].debit += transaction.amount
            }
          }
        })

        // Clear existing bars
        activityChart.innerHTML = ""

        // Find max amount for scaling
        let maxAmount = 0
        Object.values(dayTotals).forEach((day) => {
          const total = Math.max(day.credit, day.debit)
          if (total > maxAmount) maxAmount = total
        })

        // If no transactions, use a default max
        if (maxAmount === 0) maxAmount = 100

        // Create bars
        Object.entries(dayTotals).forEach(([day, amounts]) => {
          const creditHeight = (amounts.credit / maxAmount) * 150
          const debitHeight = (amounts.debit / maxAmount) * 150

          // Create credit bar
          const creditBar = document.createElement("div")
          creditBar.className = "activity-bar"
          creditBar.style.height = `${creditHeight || 5}px`
          creditBar.style.backgroundColor = "var(--success-color)"
          creditBar.setAttribute("data-amount", `$${amounts.credit.toFixed(2)}`)
          creditBar.setAttribute("data-day", `${day} In`)

          // Create debit bar
          const debitBar = document.createElement("div")
          debitBar.className = "activity-bar"
          debitBar.style.height = `${debitHeight || 5}px`
          debitBar.style.backgroundColor = "var(--danger-color)"
          debitBar.setAttribute("data-amount", `$${amounts.debit.toFixed(2)}`)
          debitBar.setAttribute("data-day", `${day} Out`)

          activityChart.appendChild(creditBar)
          activityChart.appendChild(debitBar)
        })
      } else {
        // Use sample data if no transactions
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        const amounts = [120, 85, 200, 45, 150, 75, 180]

        // Clear existing bars
        activityChart.innerHTML = ""

        // Find max amount for scaling
        const maxAmount = Math.max(...amounts)

        // Create bars
        days.forEach((day, index) => {
          const height = (amounts[index] / maxAmount) * 150
          const bar = document.createElement("div")
          bar.className = "activity-bar"
          bar.style.height = `${height}px`
          bar.setAttribute("data-amount", `$${amounts[index]}`)
          bar.setAttribute("data-day", day)

          // Randomly assign income or expense class for visual variety
          if (index % 2 === 0) {
            bar.style.backgroundColor = "var(--success-color)"
          } else {
            bar.style.backgroundColor = "var(--danger-color)"
          }

          activityChart.appendChild(bar)
        })
      }
    })
    .catch((error) => {
      console.error("Error generating activity chart:", error)

      // Fallback to sample data
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const amounts = [120, 85, 200, 45, 150, 75, 180]

      // Clear existing bars
      activityChart.innerHTML = ""

      // Find max amount for scaling
      const maxAmount = Math.max(...amounts)

      // Create bars
      days.forEach((day, index) => {
        const height = (amounts[index] / maxAmount) * 150
        const bar = document.createElement("div")
        bar.className = "activity-bar"
        bar.style.height = `${height}px`
        bar.setAttribute("data-amount", `$${amounts[index]}`)
        bar.setAttribute("data-day", day)

        // Randomly assign income or expense class for visual variety
        if (index % 2 === 0) {
          bar.style.backgroundColor = "var(--success-color)"
        } else {
          bar.style.backgroundColor = "var(--danger-color)"
        }

        activityChart.appendChild(bar)
      })
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


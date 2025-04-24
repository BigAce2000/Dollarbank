const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 7860

// Middleware
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, ".")))

// Secret key for JWT
const JWT_SECRET = "your-secret-key"

// Data files
const USERS_FILE = path.join(__dirname, "data", "users.json")
const TRANSACTIONS_FILE = path.join(__dirname, "data", "transactions.json")
const ADMIN_FILE = path.join(__dirname, "data", "admin.json")

// Create data directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
}

if (!fs.existsSync(TRANSACTIONS_FILE)) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([]))
}

if (!fs.existsSync(ADMIN_FILE)) {
  // Create default admin
  const adminPassword = "admin123"
  const hashedPassword = bcrypt.hashSync(adminPassword, 10)

  const admin = {
    id: "admin",
    name: "Admin User",
    email: "admin@dollarbank.com",
    password: hashedPassword,
    balance: 300000000.0,
  }

  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin))
}

// Helper functions
function readUsers() {
  const data = fs.readFileSync(USERS_FILE)
  return JSON.parse(data)
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

function readTransactions() {
  const data = fs.readFileSync(TRANSACTIONS_FILE)
  return JSON.parse(data)
}

function writeTransactions(transactions) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2))
}

function readAdmin() {
  const data = fs.readFileSync(ADMIN_FILE)
  return JSON.parse(data)
}

function writeAdmin(admin) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2))
}

function getUserByEmail(email) {
  const users = readUsers()
  return users.find((user) => user.email === email)
}

function createTransaction(userId, type, amount, description, balanceAfter, recipientId = null) {
  const transactions = readTransactions()

  const transaction = {
    id: uuidv4(),
    userId,
    recipientId,
    type,
    amount,
    description,
    balanceAfter,
    date: new Date().toISOString(),
  }

  transactions.push(transaction)
  writeTransactions(transactions)

  return transaction
}

function getUserTransactions(userId) {
  const transactions = readTransactions()
  return transactions.filter((transaction) => transaction.userId === userId || transaction.recipientId === userId)
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" })
    }

    req.user = user
    next()
  })
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" })
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Invalid or expired token" })
    }

    req.admin = admin
    next()
  })
}

// Routes
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide all required fields" })
  }

  const users = readUsers()

  // Check if user already exists
  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ success: false, message: "User with this email already exists" })
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10)

  // Create new user
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    balance: 0,
    joinDate: new Date().toISOString(),
  }

  users.push(newUser)
  writeUsers(users)

  res.json({ success: true, message: "Registration successful" })
})

app.post("/api/login", (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" })
  }

  const users = readUsers()
  const user = users.find((user) => user.email === email)

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" })
  }

  // Create JWT token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" })

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    message: "Login successful",
    user: userWithoutPassword,
    token,
  })
})

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" })
  }

  const admin = readAdmin()

  if (email !== admin.email || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ success: false, message: "Invalid admin credentials" })
  }

  // Create JWT token
  const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "24h" })

  // Remove password from admin object
  const { password: _, ...adminWithoutPassword } = admin

  res.json({
    success: true,
    message: "Admin login successful",
    admin: adminWithoutPassword,
    token,
  })
})

app.get("/api/user", authenticateToken, (req, res) => {
  const users = readUsers()
  const user = users.find((user) => user.id === req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Get user transactions
  const transactions = getUserTransactions(user.id)

  // Calculate stats
  let totalReceived = 0
  let totalSent = 0

  transactions.forEach((transaction) => {
    if (transaction.recipientId === user.id) {
      totalReceived += transaction.amount
    } else if (transaction.userId === user.id && transaction.type === "Debit") {
      totalSent += transaction.amount
    }
  })

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    user: userWithoutPassword,
    transactions,
    stats: {
      totalReceived,
      totalSent,
      transactionCount: transactions.length,
    },
  })
})

app.post("/api/transfer", authenticateToken, (req, res) => {
  const { recipientEmail, amount, note } = req.body

  if (!recipientEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Please provide valid recipient and amount" })
  }

  const users = readUsers()
  const sender = users.find((user) => user.id === req.user.id)
  const recipient = users.find((user) => user.email === recipientEmail)

  if (!sender) {
    return res.status(404).json({ success: false, message: "Sender not found" })
  }

  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  if (sender.id === recipient.id) {
    return res.status(400).json({ success: false, message: "Cannot transfer to yourself" })
  }

  if (sender.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient funds" })
  }

  // Update balances
  sender.balance -= amount
  recipient.balance += amount

  // Create transactions
  const description = note ? `Transfer to ${recipient.email}: ${note}` : `Transfer to ${recipient.email}`
  createTransaction(sender.id, "Debit", amount, description, sender.balance, recipient.id)

  const recipientDescription = note ? `Received from ${sender.email}: ${note}` : `Received from ${sender.email}`
  createTransaction(recipient.id, "Credit", amount, recipientDescription, recipient.balance, sender.id)

  // Save updated users
  writeUsers(users)

  res.json({ success: true, message: "Transfer successful" })
})

app.post("/api/fund-user", authenticateToken, (req, res) => {
  const { userEmail, amount, note } = req.body

  if (!userEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Please provide valid user email and amount" })
  }

  const users = readUsers()
  const sender = users.find((user) => user.id === req.user.id)
  const recipient = users.find((user) => user.email === userEmail)

  if (!sender) {
    return res.status(404).json({ success: false, message: "Sender not found" })
  }

  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  if (sender.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient funds" })
  }

  // Update balances
  sender.balance -= amount
  recipient.balance += amount

  // Create transactions
  const description = note ? `Funded ${recipient.email}: ${note}` : `Funded ${recipient.email}`
  createTransaction(sender.id, "Debit", amount, description, sender.balance, recipient.id)

  const recipientDescription = note ? `Funded by ${sender.email}: ${note}` : `Funded by ${sender.email}`
  createTransaction(recipient.id, "Credit", amount, recipientDescription, recipient.balance, sender.id)

  // Save updated users
  writeUsers(users)

  res.json({ success: true, message: "User funded successfully" })
})

app.post("/api/fund-account", authenticateToken, (req, res) => {
  const { amount, paymentData } = req.body

  if (!amount || amount <= 0 || !paymentData || !paymentData.method) {
    return res.status(400).json({ success: false, message: "Please provide valid amount and payment method" })
  }

  const users = readUsers()
  const user = users.find((user) => user.id === req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Update user balance
  user.balance += amount

  // Create transaction
  const description = `Account funded via ${paymentData.method}`
  createTransaction(user.id, "Credit", amount, description, user.balance)

  // Save updated user
  writeUsers(users)

  res.json({ success: true, message: "Account funded successfully" })
})

// Add route for admin funding account
app.post("/api/admin/fund-account", authenticateAdmin, (req, res) => {
  const { amount, paymentData } = req.body

  if (!amount || amount <= 0 || !paymentData || !paymentData.method) {
    return res.status(400).json({ success: false, message: "Please provide valid amount and payment method" })
  }

  const admin = readAdmin()

  // Update admin balance
  admin.balance += amount

  // Save updated admin
  writeAdmin(admin)

  res.json({ success: true, message: "Admin account funded successfully" })
})

// Add route for transferring to external accounts
app.post("/api/transfer-to-external", authenticateToken, (req, res) => {
  const { amount, paymentData } = req.body

  if (!amount || amount <= 0 || !paymentData || !paymentData.method) {
    return res.status(400).json({ success: false, message: "Please provide valid amount and payment method" })
  }

  const users = readUsers()
  const user = users.find((user) => user.id === req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  if (user.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient funds" })
  }

  // Update user balance
  user.balance -= amount

  // Create transaction
  const description = `Transfer to external ${paymentData.method} account`
  createTransaction(user.id, "Debit", amount, description, user.balance)

  // Save updated user
  writeUsers(users)

  res.json({ success: true, message: "Funds transferred successfully" })
})

app.get("/api/admin/data", authenticateAdmin, (req, res) => {
  const admin = readAdmin()
  const users = readUsers()
  const transactions = readTransactions()

  // Calculate stats
  const totalUsers = users.length
  const totalTransactions = transactions.length

  let totalCredits = 0
  transactions.forEach((transaction) => {
    if (transaction.type === "Credit") {
      totalCredits += transaction.amount
    }
  })

  // Remove passwords from user objects
  const usersWithoutPasswords = users.map((user) => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })

  // Remove password from admin object
  const { password: _, ...adminWithoutPassword } = admin

  res.json({
    success: true,
    admin: adminWithoutPassword,
    users: usersWithoutPasswords,
    transactions,
    stats: {
      totalUsers,
      totalTransactions,
      totalCredits,
    },
  })
})

app.get("/api/admin/user/:email", authenticateAdmin, (req, res) => {
  const { email } = req.params

  const users = readUsers()
  const user = users.find((user) => user.email === email)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Get user transactions
  const transactions = getUserTransactions(user.id)

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    user: {
      ...userWithoutPassword,
      transactions,
    },
  })
})

app.post("/api/admin/credit-user", authenticateAdmin, (req, res) => {
  const { userEmail, amount, note } = req.body

  if (!userEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Please provide valid user email and amount" })
  }

  const admin = readAdmin()
  const users = readUsers()
  const user = users.find((user) => user.email === userEmail)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  if (admin.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient admin funds" })
  }

  // Update balances
  admin.balance -= amount
  user.balance += amount

  // Create transaction for user
  const description = note ? `Admin credit: ${note}` : "Admin credit"
  createTransaction(user.id, "Credit", amount, description, user.balance)

  // Save updated admin and user
  writeAdmin(admin)
  writeUsers(users)

  res.json({ success: true, message: "User credited successfully" })
})

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


document.addEventListener("DOMContentLoaded", () => {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        })
      }
    })
  })

  // Contact form submission
  const contactForm = document.querySelector(".contact-form")
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Simulate form submission
      const formData = new FormData(contactForm)
      const formValues = Object.fromEntries(formData.entries())

      // In a real application, you would send this data to your server
      console.log("Form submitted:", formValues)

      // Show success message
      contactForm.innerHTML = `
                <div class="alert alert-success">
                    Thank you for your message! We will get back to you soon.
                </div>
            `
    })
  }

  // Newsletter subscription
  const newsletterForm = document.querySelector(".newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const emailInput = newsletterForm.querySelector('input[type="email"]')
      const email = emailInput.value.trim()

      if (email) {
        // In a real application, you would send this to your server
        console.log("Newsletter subscription:", email)

        // Show success message
        emailInput.value = ""
        alert("Thank you for subscribing to our newsletter!")
      }
    })
  }
})

//sending
function sendToWhatsApp(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Format the phone number (remove spaces and special characters)
    const phoneNumber = "17062481811"; // Replace with your WhatsApp number (without +)
    
    // Create the WhatsApp message
    const text = `📣New Message from🏛:%0A%0AName: ${name}%0AEmail🌐: ${email}%0AMessage🖥: ${message}`;
    
    // Create the WhatsApp URL
    window.location.href = `https://wa.me/${phoneNumber}?text=${text}`;
}


// Mobile Navigation Toggle
const mobileMenuBtn = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-menu");

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        mobileMenuBtn.setAttribute("aria-expanded", navLinks.classList.contains("active"));
    });
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

// Auto-typing Effect for Hero Section
const autoTypingText = document.getElementById("auto-typing-text");
if (autoTypingText) {
    const texts = [
        "Senior Information Analyst & Strategic Coordinator",
        "UN Mission Expert with 10+ Years Experience",
        "Data Analysis & Strategic Planning Professional",
        "Cross-Sector Engagement Specialist",
        "International Policy & Organizational Excellence Leader",
        "SWOT Analyst & Project Management Professional"
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function typeWriter() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            autoTypingText.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            autoTypingText.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }
        
        // Add cursor effect
        autoTypingText.classList.add("typing-cursor");
        
        if (!isDeleting && charIndex === currentText.length) {
            // Pause at end
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }
        
        setTimeout(typeWriter, typingSpeed);
    }
    
    // Start typing effect after page load
    setTimeout(typeWriter, 1000);
}

// Animated Counters with Pause, Repeat and Hover
function animateCounters() {
    const counters = document.querySelectorAll(".stat-number");
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute("data-target"));
        let current = 0;
        let animationInterval;
        let isHovering = false;
        
        function updateCounter() {
            if (current < target) {
                current += Math.ceil(target / 50);
                if (current > target) current = target;
                counter.textContent = current + "+";
            } else {
                clearInterval(animationInterval);
                // Restart animation after 5 seconds if not hovering
                if (!isHovering) {
                    setTimeout(() => {
                        current = 0;
                        counter.textContent = "0+";
                        animationInterval = setInterval(updateCounter, 40);
                    }, 5000);
                }
            }
        }
        
        // Start initial animation
        animationInterval = setInterval(updateCounter, 40);
        
        // Hover effect
        counter.parentElement.addEventListener("mouseenter", () => {
            isHovering = true;
            current = 0;
            counter.textContent = "0+";
            clearInterval(animationInterval);
            animationInterval = setInterval(updateCounter, 20); // Faster animation on hover
        });
        
        counter.parentElement.addEventListener("mouseleave", () => {
            isHovering = false;
            current = 0;
            counter.textContent = "0+";
            clearInterval(animationInterval);
            animationInterval = setInterval(updateCounter, 40);
        });
    });
}

// Bouncing Text Effect
function initBouncingText() {
    const bouncingTexts = document.querySelectorAll(".bouncing-text");
    
    bouncingTexts.forEach(element => {
        const text = element.textContent;
        element.innerHTML = "";
        
        // Split text into individual characters and wrap in spans
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement("span");
            span.textContent = text[i] === " " ? "\u00A0" : text[i]; // Use non-breaking space
            span.style.animationDelay = `${i * 0.1}s`;
            element.appendChild(span);
        }
    });
}

// Scroll-triggered Animations
function handleScrollAnimations() {
    const elements = document.querySelectorAll("[data-aos]");
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add("aos-animate");
        }
    });
}

// Skill Progress Bars Animation
function animateSkillBars() {
    const skillBars = document.querySelectorAll(".skill-progress");
    
    skillBars.forEach(bar => {
        const width = bar.getAttribute("data-width");
        const barTop = bar.getBoundingClientRect().top;
        
        if (barTop < window.innerHeight - 100) {
            setTimeout(() => {
                bar.style.width = width + "%";
            }, 200);
        }
    });
}

// Background Color Transition on Scroll
function handleBackgroundTransition() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Calculate scroll percentage
    const scrollPercentage = scrollPosition / (documentHeight - windowHeight);
    
    // Define color stops
    const colors = [
        { r: 102, g: 126, b: 234 }, // Blue
        { r: 118, g: 75, b: 162 },  // Purple
        { r: 240, g: 147, b: 251 }, // Pink
        { r: 245, g: 87, b: 108 }   // Red
    ];
    
    // Interpolate between colors
    let colorIndex = Math.floor(scrollPercentage * (colors.length - 1));
    let nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
    let localPercentage = (scrollPercentage * (colors.length - 1)) - colorIndex;
    
    const currentColor = colors[colorIndex];
    const nextColor = colors[nextColorIndex];
    
    const r = Math.round(currentColor.r + (nextColor.r - currentColor.r) * localPercentage);
    const g = Math.round(currentColor.g + (nextColor.g - currentColor.g) * localPercentage);
    const b = Math.round(currentColor.b + (nextColor.b - currentColor.b) * localPercentage);
    
    document.body.style.background = `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)}) 100%)`;
}

// Back to top button functionality
const backToTopButton = document.querySelector(".back-to-top");

function toggleBackToTopButton() {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add("visible");
    } else {
        backToTopButton.classList.remove("visible");
    }
}

backToTopButton.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Intersection Observer for Counter Animation
const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px"
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            counterObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Contact Form Handling with Formspree
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        
        // Show loading state
        const submitBtn = this.querySelector("button[type=\"submit\"]");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
        
        // Submit to Formspree
        fetch(this.action, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json"
            }
        }).then(response => {
            if (response.ok) {
                alert("Thank you for your message! I will get back to you soon.");
                this.reset();
            } else {
                response.json().then(data => {
                    if (Object.hasOwnProperty.call(data, "errors")) {
                        alert(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        alert("Oops! There was a problem submitting your form");
                    }
                });
            }
        }).catch(error => {
            alert("Oops! There was a problem submitting your form");
        }).finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize bouncing text effect
    initBouncingText();
    
    // Set up intersection observer for counters
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
        counterObserver.observe(aboutSection);
    }
    
    // Initial scroll animations check
    handleScrollAnimations();
    animateSkillBars();
    toggleBackToTopButton();
});

// Scroll Event Listeners
window.addEventListener("scroll", function() {
    handleBackgroundTransition();
    handleScrollAnimations();
    animateSkillBars();
    toggleBackToTopButton();
});

// Resize Event Listener
window.addEventListener("resize", function() {
    handleScrollAnimations();
});

// Add CSS for AOS animations
const style = document.createElement("style");
style.textContent = `
    [data-aos] {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    [data-aos].aos-animate {
        opacity: 1;
        transform: translateY(0);
    }
    
    [data-aos="fade-up"] {
        transform: translateY(30px);
    }
    
    [data-aos="fade-up"].aos-animate {
        transform: translateY(0);
    }
    
    [data-aos="fade-left"] {
        transform: translateX(-30px);
    }
    
    [data-aos="fade-left"].aos-animate {
        transform: translateX(0);
    }
    
    [data-aos="fade-right"] {
        transform: translateX(30px);
    }
    
    [data-aos="fade-right"].aos-animate {
        transform: translateX(0);
    }
`;
document.head.appendChild(style);




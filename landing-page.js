document.addEventListener('DOMContentLoaded', function() {
  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const icon = otherItem.querySelector('.toggle-icon i');
          icon.className = 'fas fa-plus';
        }
      });

      // Toggle current item
      item.classList.toggle('active');
      const icon = item.querySelector('.toggle-icon i');

      if (item.classList.contains('active')) {
        icon.className = 'fas fa-minus';
      } else {
        icon.className = 'fas fa-plus';
      }
    });
  });

  // Testimonial Slider
  const testimonialSlider = document.querySelector('.testimonials-slider');
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const indicators = document.querySelectorAll('.testimonial-indicators .indicator');

  if (testimonialSlider && testimonialCards.length > 0 && indicators.length > 0) {
    let currentIndex = 0;

    // Set up indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        updateSlider();
      });
    });

    // Function to update slider position
    function updateSlider() {
      // Update active indicator
      indicators.forEach((indicator, index) => {
        if (index === currentIndex) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });

      // Scroll to current testimonial
      const cardWidth = testimonialCards[0].offsetWidth;
      const gap = 30; // Same as the gap in CSS
      testimonialSlider.scrollTo({
        left: (cardWidth + gap) * currentIndex,
        behavior: 'smooth'
      });
    }

    // Auto-scroll testimonials
    let autoScrollInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % testimonialCards.length;
      updateSlider();
    }, 5000);

    // Pause auto-scroll when user interacts with slider
    testimonialSlider.addEventListener('mouseenter', () => {
      clearInterval(autoScrollInterval);
    });

    // Resume auto-scroll when user leaves slider
    testimonialSlider.addEventListener('mouseleave', () => {
      autoScrollInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonialCards.length;
        updateSlider();
      }, 5000);
    });

    // Handle manual scroll
    testimonialSlider.addEventListener('scroll', () => {
      const scrollPosition = testimonialSlider.scrollLeft;
      const cardWidth = testimonialCards[0].offsetWidth;
      const gap = 30;

      // Find the closest card to the current scroll position
      const newIndex = Math.round(scrollPosition / (cardWidth + gap));

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < testimonialCards.length) {
        currentIndex = newIndex;

        // Update indicators
        indicators.forEach((indicator, index) => {
          if (index === currentIndex) {
            indicator.classList.add('active');
          } else {
            indicator.classList.remove('active');
          }
        });
      }
    });
  }

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav-links a, .cta-button, .pricing-cta');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Check if the link is an anchor link
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();

        const targetSection = document.querySelector(href);

        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 80, // Offset for fixed header if needed
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Animation for browser mockup on scroll
  const browserMockup = document.querySelector('.browser-mockup');

  if (browserMockup) {
    // Initial animation
    setTimeout(() => {
      browserMockup.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    }, 500);

    // Scroll animation
    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
      const heroSection = document.querySelector('.hero');

      if (heroSection && scrollPosition < heroSection.offsetHeight) {
        const rotateY = (scrollPosition / heroSection.offsetHeight) * 5;
        const rotateX = (scrollPosition / heroSection.offsetHeight) * -5;

        browserMockup.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      }
    });
  }

  // Animate feature cards on scroll
  const featureCards = document.querySelectorAll('.feature-card');

  if (featureCards.length > 0) {
    // Function to check if element is in viewport
    function isInViewport(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
      );
    }

    // Function to animate cards that are in viewport
    function animateCardsInViewport() {
      featureCards.forEach((card, index) => {
        if (isInViewport(card)) {
          // Add a delay based on the card index
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 100);
        }
      });
    }

    // Set initial state
    featureCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'all 0.5s ease';
    });

    // Animate on scroll
    window.addEventListener('scroll', animateCardsInViewport);

    // Initial check
    animateCardsInViewport();
  }

  // Animate the primary button
  const primaryBtn = document.querySelector('.primary-btn');

  if (primaryBtn) {
    primaryBtn.addEventListener('mouseenter', () => {
      primaryBtn.style.animation = 'gradient-shift 2s infinite';
    });

    primaryBtn.addEventListener('mouseleave', () => {
      primaryBtn.style.animation = 'none';
    });
  }

  // Palestine Support Modal
  const supportPalestineBtn = document.getElementById('support-palestine-btn');
  const palestineModal = document.getElementById('palestine-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const palestineCloseBtn = document.getElementById('palestine-close');
  const palestineLearnMoreBtn = document.getElementById('palestine-learn-more');
  const modalContent = document.querySelector('.modal-content');

  if (supportPalestineBtn && palestineModal) {
    // Open modal when support button is clicked
    supportPalestineBtn.addEventListener('click', (e) => {
      e.preventDefault();
      palestineModal.classList.add('show');
      setTimeout(() => {
        modalContent.style.transform = 'translateY(0)';
        modalContent.style.opacity = '1';
      }, 10);
    });

    // Close modal functions
    function closeModal() {
      modalContent.style.transform = 'translateY(-50px)';
      modalContent.style.opacity = '0';
      setTimeout(() => {
        palestineModal.classList.remove('show');
      }, 300);
    }

    // Close modal when X is clicked
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeModal);
    }

    // Close modal when close button is clicked
    if (palestineCloseBtn) {
      palestineCloseBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside the content
    palestineModal.addEventListener('click', (e) => {
      if (e.target === palestineModal) {
        closeModal();
      }
    });

    // Learn more button
    if (palestineLearnMoreBtn) {
      palestineLearnMoreBtn.addEventListener('click', () => {
        window.open('https://www.unrwa.org/what-you-can-do', '_blank');
      });
    }

    // Add pulsing animation to the support button
    function animateSupportButton() {
      supportPalestineBtn.classList.add('pulse');
      setTimeout(() => {
        supportPalestineBtn.classList.remove('pulse');
      }, 2000);
    }

    // Animate the button periodically
    setTimeout(animateSupportButton, 3000);
    setInterval(animateSupportButton, 15000);
  }
});

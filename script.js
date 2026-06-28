/* =====================================================================
   THE OLIVE TABLE — SITE SCRIPT
   Vanilla JS only. No external libraries, no jQuery.
   Wires up: progressive-enhancement flag, mobile menu, sticky header,
   smooth scroll, active nav link, scroll reveals, reservation form
   (validation + WhatsApp handoff), and a back-to-top button.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* -------------------------------------------------------------------
     0. PROGRESSIVE ENHANCEMENT FLAG
     If the page (or a future version of it) sets a "no-js" class on
     <body> as a CSS fallback hook, remove it now that JS is running.
     classList.remove() is a no-op if the class isn't present, so this
     is always safe to call.
     ------------------------------------------------------------------- */
  document.body.classList.remove('no-js');

  /* =====================================================================
     SHARED REFERENCES
     ===================================================================== */
  var header = document.querySelector('.site-header');
  var navToggle = document.querySelector('.nav-toggle');
  var primaryNav = document.querySelector('.primary-nav');
  var navLinks = document.querySelectorAll('.primary-nav__link');
  var headerHeight = header ? header.offsetHeight : 0;
  var prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* =====================================================================
     1. MOBILE MENU — OPEN / CLOSE
     ===================================================================== */
  function isMenuOpen() {
    return navToggle && navToggle.getAttribute('aria-expanded') === 'true';
  }

  function openMenu() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', toggleMenu);

    /* Close the mobile menu when any nav link is clicked */
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (isMenuOpen()) {
          closeMenu();
        }
      });
    });

    /* Close the mobile menu on outside click */
    document.addEventListener('click', function (event) {
      if (!isMenuOpen()) return;
      var clickedInsideNav =
        primaryNav.contains(event.target) || navToggle.contains(event.target);
      if (!clickedInsideNav) {
        closeMenu();
      }
    });

    /* Close the mobile menu with the Escape key */
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMenuOpen()) {
        closeMenu();
        navToggle.focus();
      }
    });

    /* Close the mobile menu automatically if the viewport grows to desktop */
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && isMenuOpen()) {
        closeMenu();
      }
    });
  }

  /* =====================================================================
     2. STICKY HEADER SCROLL EFFECT
     Adds visual weight to the header (deeper shadow, more opaque
     background) once the page has scrolled past a small threshold.
     ===================================================================== */
  var SCROLL_THRESHOLD = 24;
  var headerIsCondensed = false;
  var scrollTicking = false;

  function applyHeaderState() {
    if (!header) return;
    var shouldCondense = window.scrollY > SCROLL_THRESHOLD;

    if (shouldCondense !== headerIsCondensed) {
      headerIsCondensed = shouldCondense;

      if (headerIsCondensed) {
        header.classList.add('is-scrolled');
        header.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.28)';
        header.style.backgroundColor = 'rgba(27, 27, 24, 0.98)';
      } else {
        header.classList.remove('is-scrolled');
        header.style.boxShadow = '';
        header.style.backgroundColor = '';
      }
    }
  }

  function onScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        applyHeaderState();
        updateBackToTopVisibility();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  applyHeaderState();

  /* Keep header height in sync if it changes on resize (e.g. orientation) */
  window.addEventListener('resize', function () {
    headerHeight = header ? header.offsetHeight : 0;
  });

  /* =====================================================================
     3. SMOOTH SCROLLING FOR INTERNAL LINKS
     Accounts for the sticky header height so anchored sections aren't
     hidden underneath it.
     ===================================================================== */
  function smoothScrollTo(targetElement) {
    if (!targetElement) return;
    var top =
      targetElement.getBoundingClientRect().top +
      window.pageYOffset -
      (headerHeight + 12);

    window.scrollTo({
      top: top < 0 ? 0 : top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  var internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach(function (link) {
    var hash = link.getAttribute('href');

    /* Skip empty or bare "#" links */
    if (!hash || hash === '#') return;

    link.addEventListener('click', function (event) {
      var targetId = hash.slice(1);
      var targetElement = document.getElementById(targetId);

      if (!targetElement) return;

      event.preventDefault();
      smoothScrollTo(targetElement);

      /* Update the URL hash without an abrupt jump */
      if (history.pushState) {
        history.pushState(null, '', hash);
      }
    });
  });

  /* =====================================================================
     4. ACTIVE NAV LINK WHILE SCROLLING
     Maps each tracked section to its corresponding nav link (the
     hero section uses "#top" rather than "#home" to match the logo
     link, so the mapping is explicit).
     ===================================================================== */
  var trackedSections = [
    { id: 'home', hash: '#top' },
    { id: 'about', hash: '#about' },
    { id: 'menu', hash: '#menu' },
    { id: 'gallery', hash: '#gallery' },
    { id: 'reservations', hash: '#reservations' },
    { id: 'contact', hash: '#contact' }
  ];

  function setActiveNavLink(hash) {
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === hash) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var match = trackedSections.filter(function (section) {
            return section.id === entry.target.id;
          })[0];

          if (match) {
            setActiveNavLink(match.hash);
          }
        });
      },
      {
        root: null,
        rootMargin: '-' + (headerHeight + 40) + 'px 0px -55% 0px',
        threshold: 0
      }
    );

    trackedSections.forEach(function (section) {
      var sectionElement = document.getElementById(section.id);
      if (sectionElement) {
        sectionObserver.observe(sectionElement);
      }
    });
  }

  /* =====================================================================
     5. REVEAL-ON-SCROLL ANIMATIONS
     Elements fade and lift gently into view as they enter the viewport.
     Skipped entirely when the visitor prefers reduced motion.
     ===================================================================== */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    var revealSelectors = [
      '.section-header',
      '.dish-card',
      '.feature-card',
      '.gallery__item',
      '.testimonial',
      '.about__media',
      '.about__content',
      '.reservation-form',
      '.contact__details',
      '.contact__map'
    ];

    var revealElements = document.querySelectorAll(revealSelectors.join(','));

    revealElements.forEach(function (element, index) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(28px)';
      element.style.transition =
        'opacity 0.7s ease, transform 0.7s ease';
      element.style.transitionDelay = (index % 4) * 80 + 'ms';
    });

    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  /* =====================================================================
     6. RESERVATION FORM — VALIDATION + WHATSAPP HANDOFF
     ===================================================================== */
  var reservationForm = document.querySelector('.reservation-form');

  if (reservationForm) {
    var nameInput = reservationForm.querySelector('#res-name');
    var phoneInput = reservationForm.querySelector('#res-phone');
    var emailInput = reservationForm.querySelector('#res-email');
    var guestsInput = reservationForm.querySelector('#res-guests');
    var dateInput = reservationForm.querySelector('#res-date');
    var timeInput = reservationForm.querySelector('#res-time');
    var messageInput = reservationForm.querySelector('#res-message');

    /* Restaurant WhatsApp number — matches the number used elsewhere on the site */
    var WHATSAPP_NUMBER = '971501234567';

    /* Prevent past dates from being selected */
    function validateDate() {
      if (!dateInput || !dateInput.value) {
        if (dateInput) dateInput.setCustomValidity('');
        return;
      }
      var selectedDate = new Date(dateInput.value + 'T00:00:00');
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        dateInput.setCustomValidity('Please choose a date from today onward.');
      } else {
        dateInput.setCustomValidity('');
      }
    }

    /* Require a realistic phone number (at least 7 digits) */
    function validatePhone() {
      if (!phoneInput) return;
      var digitsOnly = phoneInput.value.replace(/\D/g, '');

      if (digitsOnly.length < 7) {
        phoneInput.setCustomValidity(
          'Please enter a valid phone number with at least 7 digits.'
        );
      } else {
        phoneInput.setCustomValidity('');
      }
    }

    if (dateInput) {
      dateInput.addEventListener('change', validateDate);
      dateInput.addEventListener('input', validateDate);
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', validatePhone);
      phoneInput.addEventListener('blur', validatePhone);
    }

    /* Formats a 24-hour time value ("19:30") into "7:30 PM" */
    function formatTime(value) {
      if (!value) return '';
      var parts = value.split(':');
      var hours = parseInt(parts[0], 10);
      var minutes = parts[1];
      var period = hours >= 12 ? 'PM' : 'AM';
      var displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return displayHours + ':' + minutes + ' ' + period;
    }

    /* Formats a date value ("2026-07-12") into "12 July 2026" */
    function formatDate(value) {
      if (!value) return '';
      try {
        var dateObject = new Date(value + 'T00:00:00');
        return dateObject.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        return value;
      }
    }

    /* Builds a small, reusable status message under the form */
    var statusMessage = document.createElement('p');
    statusMessage.setAttribute('role', 'status');
    statusMessage.setAttribute('aria-live', 'polite');
    statusMessage.style.marginTop = '1rem';
    statusMessage.style.fontSize = '0.9375rem';
    statusMessage.style.fontWeight = '600';
    statusMessage.style.color = 'var(--color-gold-dark, #8C6E2C)';
    statusMessage.style.textAlign = 'center';
    statusMessage.style.display = 'none';
    reservationForm.appendChild(statusMessage);

    function showStatusMessage(text) {
      statusMessage.textContent = text;
      statusMessage.style.display = 'block';
    }

    reservationForm.addEventListener('submit', function (event) {
      event.preventDefault();

      /* Re-run custom validation in case fields were never touched
         (e.g. populated by browser autofill) */
      validateDate();
      validatePhone();

      if (!reservationForm.checkValidity()) {
        reservationForm.reportValidity();
        return;
      }

      var guestsLabel =
        guestsInput && guestsInput.options[guestsInput.selectedIndex]
          ? guestsInput.options[guestsInput.selectedIndex].text
          : '';

      var messageLines = [
        'Hello The Olive Table, I would like to make a reservation:',
        '',
        'Name: ' + (nameInput ? nameInput.value.trim() : ''),
        'Phone: ' + (phoneInput ? phoneInput.value.trim() : ''),
        'Email: ' + (emailInput ? emailInput.value.trim() : ''),
        'Guests: ' + guestsLabel,
        'Date: ' + formatDate(dateInput ? dateInput.value : ''),
        'Time: ' + formatTime(timeInput ? timeInput.value : '')
      ];

      if (messageInput && messageInput.value.trim()) {
        messageLines.push('Special Requests: ' + messageInput.value.trim());
      }

      var whatsappURL =
        'https://wa.me/' +
        WHATSAPP_NUMBER +
        '?text=' +
        encodeURIComponent(messageLines.join('\n'));

      window.open(whatsappURL, '_blank', 'noopener,noreferrer');

      showStatusMessage(
        'Thank you! Your reservation details have been prepared in WhatsApp — please tap send to confirm.'
      );

      reservationForm.reset();
    });
  }

  /* =====================================================================
     7. BACK-TO-TOP BUTTON
     Created dynamically (the markup defines no button for this), styled
     inline using the same design tokens already declared in style.css.
     ===================================================================== */
  var backToTopButton = document.createElement('button');
  backToTopButton.type = 'button';
  backToTopButton.className = 'back-to-top';
  backToTopButton.setAttribute('aria-label', 'Back to top');
  backToTopButton.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 5l-7 7M12 5l7 7M12 5v14" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>';

  backToTopButton.style.position = 'fixed';
  backToTopButton.style.left = '1.5rem';
  backToTopButton.style.bottom = '1.5rem';
  backToTopButton.style.zIndex = '90';
  backToTopButton.style.display = 'inline-flex';
  backToTopButton.style.alignItems = 'center';
  backToTopButton.style.justifyContent = 'center';
  backToTopButton.style.width = '48px';
  backToTopButton.style.height = '48px';
  backToTopButton.style.borderRadius = '50%';
  backToTopButton.style.border = '1px solid var(--color-border-dark, #3A392F)';
  backToTopButton.style.backgroundColor = 'var(--color-charcoal, #1B1B18)';
  backToTopButton.style.color = 'var(--color-gold-light, #D8BA72)';
  backToTopButton.style.boxShadow = 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.2))';
  backToTopButton.style.opacity = '0';
  backToTopButton.style.transform = 'translateY(12px)';
  backToTopButton.style.pointerEvents = 'none';
  backToTopButton.style.transition =
    'opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease';

  backToTopButton.addEventListener('mouseenter', function () {
    backToTopButton.style.backgroundColor = 'var(--color-gold, #B8923D)';
    backToTopButton.style.color = 'var(--color-charcoal, #1B1B18)';
  });

  backToTopButton.addEventListener('mouseleave', function () {
    backToTopButton.style.backgroundColor = 'var(--color-charcoal, #1B1B18)';
    backToTopButton.style.color = 'var(--color-gold-light, #D8BA72)';
  });

  backToTopButton.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  document.body.appendChild(backToTopButton);

  var BACK_TO_TOP_THRESHOLD = window.innerHeight * 0.6;
  var backToTopVisible = false;

  function updateBackToTopVisibility() {
    var shouldShow = window.scrollY > BACK_TO_TOP_THRESHOLD;

    if (shouldShow !== backToTopVisible) {
      backToTopVisible = shouldShow;
      backToTopButton.style.opacity = backToTopVisible ? '1' : '0';
      backToTopButton.style.transform = backToTopVisible
        ? 'translateY(0)'
        : 'translateY(12px)';
      backToTopButton.style.pointerEvents = backToTopVisible ? 'auto' : 'none';
    }
  }

  updateBackToTopVisibility();
});

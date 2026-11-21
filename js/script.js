/* ==========================================================================
   Café Arxyanne — script.js
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var header = doc.getElementById("site-header");
  var nav = doc.getElementById("primary-nav");
  var navToggle = doc.getElementById("nav-toggle");
  var toTop = doc.getElementById("to-top");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll lock ---------- */
  var lockCount = 0;
  function lockScroll() {
    lockCount += 1;
    body.classList.add("is-locked");
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) body.classList.remove("is-locked");
  }

  /* ---------- Sticky header ---------- */
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var navOpen = false;

  function openNav() {
    if (!nav || !header || navOpen) return;
    navOpen = true;
    nav.classList.add("is-open");
    header.classList.add("is-nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    lockScroll();
    var firstLink = nav.querySelector(".nav-link");
    if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 320);
  }

  function closeNav(restoreFocus) {
    if (!nav || !header || !navOpen) return;
    navOpen = false;
    nav.classList.remove("is-open");
    header.classList.remove("is-nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    unlockScroll();
    if (restoreFocus) navToggle.focus();
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      navOpen ? closeNav(true) : openNav();
    });
  }

  /* ---------- Smooth anchor scrolling ---------- */
  function scrollToTarget(target) {
    var top = 0;
    if (target !== "#home" && target !== "#top") {
      var el = doc.querySelector(target);
      if (!el) return;
      var offset = (header ? header.offsetHeight : 0) + 14;
      top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    }
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
  }

  doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      var target = doc.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      if (navOpen) {
        closeNav(false);
        window.setTimeout(function () { scrollToTarget(hash); }, 60);
      } else {
        scrollToTarget(hash);
      }

      if (history.pushState) {
        history.pushState(null, "", hash);
      }
    });
  });

  /* ---------- Active nav state ---------- */
  var sectionIds = ["home", "story", "menu", "bark-bar", "gallery", "contact"];
  var navLinks = {};
  doc.querySelectorAll(".nav-link").forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace("#", "");
    navLinks[id] = link;
  });

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          Object.keys(navLinks).forEach(function (key) {
            navLinks[key].classList.toggle("is-active", key === id);
            if (key === id) {
              navLinks[key].setAttribute("aria-current", "true");
            } else {
              navLinks[key].removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sectionIds.forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- Menu filtering ---------- */
  doc.querySelectorAll("[data-menu]").forEach(function (menu) {
    var buttons = Array.prototype.slice.call(menu.querySelectorAll(".filter"));
    var groups = Array.prototype.slice.call(menu.querySelectorAll("[data-group]"));
    var status = menu.querySelector(".filter-status");

    function announce(count, label) {
      if (!status) return;
      if (label === "All") {
        status.textContent = "Showing all " + count + " items";
      } else {
        status.textContent = count + (count === 1 ? " item" : " items") + " in " + label;
      }
    }

    function applyFilter(filter, label) {
      var total = 0;

      groups.forEach(function (group) {
        var cards = Array.prototype.slice.call(group.querySelectorAll("[data-category]"));
        var groupCount = 0;

        cards.forEach(function (card) {
          var show = filter === "all" || card.getAttribute("data-category") === filter;
          card.hidden = !show;
          if (show) {
            groupCount += 1;
            card.classList.add("is-visible");
          }
        });

        group.classList.toggle("is-hidden", groupCount === 0);
        total += groupCount;
      });

      announce(total, label);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-filter") || "all";
        var label = (button.textContent || "All").trim();

        buttons.forEach(function (other) {
          var active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });

        applyFilter(filter, label);
      });
    });

    if (buttons.length && status) {
      var totalItems = menu.querySelectorAll("[data-category]").length;
      announce(totalItems, "All");
    }
  });

  /* ---------- Espresso milk price preview ---------- */
  doc.querySelectorAll("[data-milk-picker]").forEach(function (picker) {
    var milkButtons = Array.prototype.slice.call(picker.querySelectorAll(".milk-opt"));
    var panel = picker.closest(".dish-card--variants");
    var variantButtons = panel
      ? Array.prototype.slice.call(panel.querySelectorAll(".variant"))
      : [];
    var milkOut = picker.querySelector(".milk-total-milk");
    var priceOut = picker.querySelector(".milk-total-price");
    var basePrice = Number(picker.getAttribute("data-base")) || 0;
    var milkAdd = 0;
    var milkName = "Whole milk";
    var variantName = picker.getAttribute("data-variant") || "";

    function render() {
      if (milkOut) {
        milkOut.textContent = variantName ? variantName + " · " + milkName : milkName;
      }
      if (priceOut) priceOut.textContent = "₱" + (basePrice + milkAdd);
    }

    function select(group, chosen) {
      group.forEach(function (button) {
        var active = button === chosen;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    milkButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        select(milkButtons, button);
        milkAdd = Number(button.getAttribute("data-add")) || 0;
        var label = button.firstChild && button.firstChild.nodeValue
          ? button.firstChild.nodeValue.trim()
          : "Whole milk";
        milkName = /milk$/i.test(label) ? label : label + " milk";
        render();
      });
    });

    variantButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        select(variantButtons, button);
        basePrice = Number(button.getAttribute("data-price")) || basePrice;
        variantName = button.getAttribute("data-variant-name") || "";
        render();
      });
    });

    render();
  });

  /* ---------- Scroll reveal ---------- */
  var revealItems = doc.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  /* ---------- Back to top ---------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = doc.getElementById("lightbox");
  var lightboxImg = doc.getElementById("lightbox-img");
  var lightboxCaption = doc.getElementById("lightbox-caption");
  var lightboxCount = doc.getElementById("lightbox-count");
  var lightboxPrev = doc.getElementById("lightbox-prev");
  var lightboxNext = doc.getElementById("lightbox-next");
  var galleryItems = Array.prototype.slice.call(doc.querySelectorAll(".g-btn"));
  var currentIndex = 0;
  var lastFocused = null;

  function renderLightbox(index) {
    var button = galleryItems[index];
    if (!button) return;
    var img = button.querySelector("img");
    var caption = button.querySelector(".g-cap");
    currentIndex = index;

    lightboxImg.src = img.getAttribute("src");
    lightboxImg.alt = img.getAttribute("alt") || "";
    lightboxCaption.textContent = caption ? caption.textContent : "";
    lightboxCount.textContent = index + 1 + " / " + galleryItems.length;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = doc.activeElement;
    renderLightbox(index);
    lightbox.hidden = false;
    lockScroll();
    var closeBtn = lightbox.querySelector(".lightbox-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    unlockScroll();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function stepLightbox(direction) {
    var next = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox(next);
  }

  galleryItems.forEach(function (button, index) {
    button.addEventListener("click", function () { openLightbox(index); });
  });

  if (lightbox) {
    lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });
    if (lightboxPrev) lightboxPrev.addEventListener("click", function () { stepLightbox(-1); });
    if (lightboxNext) lightboxNext.addEventListener("click", function () { stepLightbox(1); });
  }

  doc.addEventListener("keydown", function (event) {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
      } else if (event.key === "Tab") {
        var focusables = lightbox.querySelectorAll("button");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (event.key === "Escape" && navOpen) {
      closeNav(true);
    }
  });

  /* ---------- Contact form (mailto) ---------- */
  var form = doc.getElementById("contact-form");
  var formStatus = doc.getElementById("form-status");

  function setFieldError(field, hasError) {
    var wrapper = field.closest(".field");
    if (wrapper) wrapper.classList.toggle("has-error", hasError);
    field.setAttribute("aria-invalid", hasError ? "true" : "false");
  }

  if (form) {
    var nameField = doc.getElementById("name");
    var emailField = doc.getElementById("email");
    var messageField = doc.getElementById("message");

    [nameField, emailField, messageField].forEach(function (field) {
      field.addEventListener("input", function () {
        setFieldError(field, false);
        if (formStatus) {
          formStatus.textContent = "";
          formStatus.classList.remove("is-error");
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = nameField.value.trim();
      var email = emailField.value.trim();
      var message = messageField.value.trim();
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      var firstInvalid = null;

      var checks = [
        [nameField, name.length > 0],
        [emailField, emailValid],
        [messageField, message.length > 0]
      ];

      checks.forEach(function (pair) {
        setFieldError(pair[0], !pair[1]);
        if (!pair[1] && !firstInvalid) firstInvalid = pair[0];
      });

      if (firstInvalid) {
        if (formStatus) {
          formStatus.textContent = "Please complete the highlighted fields with a valid email address.";
          formStatus.classList.add("is-error");
        }
        firstInvalid.focus();
        return;
      }

      var subject = "Website enquiry from " + name;
      var bodyText =
        message + "\n\n" +
        "— " + name + "\n" +
        email;

      var mailto = "mailto:rodriguezarianne@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyText);

      window.location.href = mailto;

      if (formStatus) {
        formStatus.classList.remove("is-error");
        formStatus.textContent = "Opening your email app with this note ready to send.";
      }
    });
  }

  /* ---------- Close mobile nav on desktop resize ---------- */
  window.addEventListener("resize", function () {
    if (window.innerWidth > 960 && navOpen) closeNav(false);
  });
})();

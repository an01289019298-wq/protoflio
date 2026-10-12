/* Portfolio interactions: theme, mobile menu, active link, reveal, form, back-to-top. */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'portfolio-theme';

  /* ---------- Theme (runs immediately so there is no flash) ---------- */
  function readTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* storage unavailable */ }
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f7fd' : '#070b1a');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }

  var saved = readTheme();
  root.classList.add('js');
  root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('site-header');
    var menu = document.getElementById('nav-menu');
    var menuBtn = document.getElementById('menu-toggle');
    var themeBtn = document.getElementById('theme-toggle');
    var toTop = document.getElementById('to-top');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    var sections = navLinks
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    applyTheme(root.getAttribute('data-theme'));

    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveTheme(next);
    });

    /* ---------- Mobile menu ---------- */
    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    menuBtn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) setMenu(false);
    });

    /* ---------- Scroll state: header border, active link, back-to-top ---------- */
    var ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-scrolled', y > 8);
      toTop.classList.toggle('is-visible', y > 600);

      // Active link: the last section whose top has passed ~35% of the viewport.
      var marker = y + window.innerHeight * 0.35;
      var atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
      var current = sections[0];
      sections.forEach(function (section) {
        if (section.offsetTop <= marker) current = section;
      });
      if (atBottom) current = sections[sections.length - 1];

      navLinks.forEach(function (link) {
        var active = current && link.getAttribute('href') === '#' + current.id;
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0 });
      var skip = document.querySelector('.brand');
      if (skip) skip.focus({ preventScroll: true });
    });

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- Footer year ---------- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Contact form (client-side only) ---------- */
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    var TO_EMAIL = 'an012801928@gmail.com';
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var rules = {
      name: function (v) { return v.length >= 2 ? '' : 'Enter your name (at least 2 characters).'; },
      email: function (v) { return emailPattern.test(v) ? '' : 'Enter a valid email address, like name@example.com.'; },
      subject: function (v) { return v.length >= 3 ? '' : 'Enter a subject (at least 3 characters).'; },
      message: function (v) { return v.length >= 10 ? '' : 'Write a message of at least 10 characters.'; }
    };

    function validateField(input) {
      var message = rules[input.name](input.value.trim());
      var errorEl = document.getElementById(input.getAttribute('aria-describedby'));
      errorEl.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !message;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) validateField(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';

      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      var data = {};
      inputs.forEach(function (input) { data[input.name] = input.value.trim(); });

      var body = data.message + '\n\n--\n' + data.name + '\n' + data.email;
      window.location.href = 'mailto:' + TO_EMAIL +
        '?subject=' + encodeURIComponent(data.subject) +
        '&body=' + encodeURIComponent(body);

      status.textContent = 'Your email app should open with the message ready. If it does not, email ' + TO_EMAIL + ' directly.';
    });
  });
})();

(() => {
  'use strict';

  const start = () => {
    const attributionKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'gbraid', 'wbraid',
    ];
    const storageKey = 'vkp_attribution';
    const attribution = Object.create(null);
    const boundedValue = (value) => typeof value === 'string'
      ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 256)
      : '';

    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      for (const key of attributionKeys) {
        if (saved && Object.prototype.hasOwnProperty.call(saved, key)) {
          const value = boundedValue(saved[key]);
          if (value) attribution[key] = value;
        }
      }
    } catch (_) {
      // Attribution remains optional when browser storage is unavailable.
    }

    const parameters = new URLSearchParams(window.location.search);
    for (const key of attributionKeys) {
      const value = boundedValue(parameters.get(key));
      if (value) attribution[key] = value;
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(attribution));
    } catch (_) {
      // Submitting a request must not depend on browser storage permissions.
    }

    const track = (event, properties = {}) => {
      try {
        if (!window.dataLayer) window.dataLayer = [];
        if (typeof window.dataLayer.push === 'function') {
          window.dataLayer.push({ event, ...properties });
        }
      } catch (_) {
        // Analytics must not interrupt contact actions.
      }
    };

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener('click', () => {
        const number = link.getAttribute('href').replace(/\D/g, '');
        const contactId = number === '0945698801'
          ? 'hotline_1'
          : number === '0968515576' ? 'hotline_2' : 'phone';
        track('contact_click', { contact_type: 'phone', contact_id: contactId });
      });
    });

    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const setMenuOpen = (open) => {
      if (!menuToggle || !navLinks) return;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      navLinks.classList.toggle('is-open', open);
      navLinks.dataset.open = String(open);
    };
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
      });
      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false);
          menuToggle.focus();
        }
      });
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-interest]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const interest = document.getElementById('interest');
        if (interest && [...interest.options].some((option) => option.value === button.dataset.interest)) {
          interest.value = button.dataset.interest;
          interest.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const target = document.getElementById('dang-ky');
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
        setMenuOpen(false);
      });
    });

    const privacyDialog = document.getElementById('privacy-dialog');
    if (privacyDialog) {
      let privacyTrigger = null;
      const closePrivacy = () => {
        if (typeof privacyDialog.close === 'function') privacyDialog.close();
        else privacyDialog.removeAttribute('open');
        if (privacyTrigger) privacyTrigger.focus();
      };
      document.querySelectorAll('[data-open-policy]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          privacyTrigger = button;
          if (!privacyDialog.open) {
            if (typeof privacyDialog.showModal === 'function') privacyDialog.showModal();
            else privacyDialog.setAttribute('open', '');
          }
        });
      });
      privacyDialog.querySelectorAll('[data-close-policy]').forEach((button) => {
        button.addEventListener('click', closePrivacy);
      });
      privacyDialog.addEventListener('click', (event) => {
        if (event.target !== privacyDialog) return;
        const rect = privacyDialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right
          || event.clientY < rect.top || event.clientY > rect.bottom) closePrivacy();
      });
    }

    const form = document.getElementById('lead-form');
    if (!form) return;
    const status = document.getElementById('form-status');
    const submitButton = form.querySelector('[type="submit"]');
    const idleButtonText = submitButton ? submitButton.textContent : '';
    let submitting = false;
    let submitted = false;
    // HTML constraints still provide the native fallback when JavaScript is absent.
    form.noValidate = true;

    const field = (name) => form.elements.namedItem(name);
    const showStatus = (message, state = 'error') => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
      status.classList.toggle('is-error', state === 'error');
      status.classList.toggle('is-success', state === 'success');
      status.setAttribute('role', state === 'error' ? 'alert' : 'status');
    };
    const invalid = (element, message) => {
      if (element) {
        element.setAttribute('aria-invalid', 'true');
        element.focus();
      }
      showStatus(message);
      return false;
    };
    form.addEventListener('input', (event) => {
      if (event.target instanceof HTMLElement) event.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('change', (event) => {
      if (event.target instanceof HTMLElement) event.target.removeAttribute('aria-invalid');
    });

    const validate = () => {
      const name = field('name');
      const phone = field('phone');
      const email = field('email');
      const consent = field('consent');
      if (!name || !phone || !consent) {
        showStatus('Biểu mẫu chưa sẵn sàng. Vui lòng liên hệ hotline để được tư vấn.');
        return false;
      }
      name.value = name.value.trim().replace(/\s+/g, ' ');
      if (name.value.length < 2) return invalid(name, 'Bạn vui lòng nhập họ tên có ít nhất 2 ký tự.');
      let normalizedPhone = phone.value.trim().replace(/[\s().-]/g, '');
      if (/^\+84[35789]\d{8}$/.test(normalizedPhone)) {
        normalizedPhone = `0${normalizedPhone.slice(3)}`;
      }
      if (!/^0[35789]\d{8}$/.test(normalizedPhone)) {
        return invalid(phone, 'Bạn vui lòng nhập số di động Việt Nam gồm 10 chữ số, hoặc bắt đầu bằng +84.');
      }
      phone.value = normalizedPhone;
      if (email) {
        email.value = email.value.trim();
        if (email.value && !email.checkValidity()) {
          return invalid(email, 'Địa chỉ email chưa hợp lệ. Bạn vui lòng kiểm tra lại hoặc để trống.');
        }
      }
      if (!consent.checked) return invalid(consent, 'Bạn vui lòng đồng ý cho phép liên hệ tư vấn trước khi gửi.');
      for (const control of form.elements) {
        if (control.willValidate && !control.checkValidity()) {
          return invalid(control, 'Bạn vui lòng kiểm tra và hoàn tất thông tin được đánh dấu.');
        }
      }
      if (field('_honey') && field('_honey').value) {
        showStatus('Không thể gửi yêu cầu này. Bạn vui lòng thử lại.');
        return false;
      }
      return true;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting || submitted || !validate()) return;
      submitting = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang gửi yêu cầu…';
      }
      form.setAttribute('aria-busy', 'true');
      showStatus('Đang gửi yêu cầu của bạn…', 'loading');

      const payload = Object.create(null);
      for (const [key, value] of new FormData(form).entries()) {
        if (typeof value === 'string') payload[key] = value;
      }
      for (const key of attributionKeys) {
        if (attribution[key]) payload[key] = attribution[key];
      }
      payload.page_url = window.location.href.slice(0, 2048);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('https://formsubmit.co/ajax/anhduong01082020@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        let result;
        try {
          result = await response.json();
        } catch (_) {
          throw new Error(`Dịch vụ trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
        }
        if (!response.ok || !(result && (result.success === true || result.success === 'true'))) {
          const detail = result && typeof result.message === 'string'
            ? result.message.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 300)
            : `Dịch vụ chưa xác nhận tiếp nhận yêu cầu (HTTP ${response.status}).`;
          throw new Error(detail);
        }
        submitted = true;
        if (submitButton) submitButton.textContent = 'Đã gửi yêu cầu';
        showStatus('Hệ thống đã tiếp nhận yêu cầu của bạn. Nếu cần trao đổi ngay, bạn có thể gọi hotline.', 'success');
        track('lead_submit_success', { form_id: 'lead-form', project: 'vinhomes_king_park' });
      } catch (error) {
        let detail;
        if (error && error.name === 'AbortError') {
          detail = 'Dịch vụ phản hồi quá lâu; chưa thể xác nhận yêu cầu đã được tiếp nhận.';
        } else if (error instanceof TypeError) {
          detail = 'Không kết nối được dịch vụ gửi biểu mẫu. Bạn vui lòng kiểm tra kết nối mạng.';
        } else {
          detail = error instanceof Error ? error.message : 'Dịch vụ chưa xác nhận tiếp nhận yêu cầu.';
        }
        showStatus(`Chưa thể xác nhận gửi thành công. ${detail} Bạn có thể thử lại hoặc gọi hotline.`);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = idleButtonText;
        }
      } finally {
        window.clearTimeout(timeout);
        submitting = false;
        form.removeAttribute('aria-busy');
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

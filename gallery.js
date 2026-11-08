(() => {
  const dialog = document.getElementById('image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('image-dialog-img');
  const caption = document.getElementById('image-caption');
  const original = document.getElementById('image-original');
  let trigger;
  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img')?.alt || 'Hình ảnh dự án';
      caption.textContent = link.dataset.caption || image.alt;
      original.href = link.href;
      dialog.showModal();
    });
  });
  dialog.querySelector('.image-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus());
})();

// Ask before deleting a product or removing a user.
document.querySelectorAll('[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!window.confirm(form.dataset.confirm)) {
      event.preventDefault();
    }
  });
});

// Let people dismiss a success or error message.
document.querySelectorAll('.flash-close').forEach((button) => {
  button.addEventListener('click', () => {
    const flash = button.closest('.flash');
    if (flash) flash.remove();
  });
});

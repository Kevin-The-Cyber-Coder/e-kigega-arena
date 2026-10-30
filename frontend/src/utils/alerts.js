import Swal from 'sweetalert2';

const brand = '#5b5bd6';

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  customClass: { popup: 'arena-toast' },
  didOpen: (element) => {
    element.addEventListener('mouseenter', Swal.stopTimer);
    element.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export function notifySuccess(title, text) {
  return toast.fire({ icon: 'success', title, text });
}

export function notifyError(title, text) {
  return toast.fire({ icon: 'error', title, text });
}

export function notifyInfo(title, text) {
  return toast.fire({ icon: 'info', title, text });
}

export async function confirmAction({
  title,
  text,
  confirmText = 'Yes, continue',
  cancelText = 'Cancel',
  icon = 'warning',
  danger = false
}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? '#e5484d' : brand,
    cancelButtonColor: '#eef0f6',
    customClass: {
      popup: 'arena-dialog',
      confirmButton: danger ? 'arena-confirm-danger' : '',
      cancelButton: 'arena-cancel'
    },
    buttonsStyling: true,
    reverseButtons: true,
    focusCancel: danger
  });

  return result.isConfirmed;
}

export function showApiError(message) {
  return Swal.fire({
    icon: 'error',
    title: 'Action failed',
    text: message,
    confirmButtonColor: brand,
    customClass: { popup: 'arena-dialog' }
  });
}

export default Swal;

import Swal from 'sweetalert2'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

export const showSuccessToast = (title) => {
  Toast.fire({
    icon: 'success',
    title
  })
}

export const showErrorToast = (title) => {
  Toast.fire({
    icon: 'error',
    title
  })
} 
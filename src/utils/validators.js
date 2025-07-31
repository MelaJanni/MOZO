// Validadores para formularios

// Validación de email
export const emailValidator = (value) => {
  if (!value) return 'El email es requerido'
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(value) || 'Email inválido'
}

// Validación de contraseña
export const passwordValidator = (value) => {
  if (!value) return 'La contraseña es requerida'
  if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  const hasUppercase = /[A-Z]/.test(value)
  const hasLowercase = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
  }
  
  return true
}

// Validación de código de negocio
export const businessCodeValidator = (value) => {
  if (!value) return 'El código de negocio es requerido'
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return regex.test(value) || 'Código de negocio inválido (formato: XXXX-XXXX-XXXX)'
}

// Validación de campos requeridos
export const requiredValidator = (value, fieldName = 'Campo') => {
  return !!value || `${fieldName} es requerido`
}

// Validación de confirmación de contraseña
export const passwordMatchValidator = (password, confirmPassword) => {
  if (!confirmPassword) return 'Confirma tu contraseña'
  return password === confirmPassword || 'Las contraseñas no coinciden'
}

// Validación de longitud mínima
export const minLengthValidator = (value, minLength, fieldName = 'Campo') => {
  if (!value) return `${fieldName} es requerido`
  return value.length >= minLength || `${fieldName} debe tener al menos ${minLength} caracteres`
} 
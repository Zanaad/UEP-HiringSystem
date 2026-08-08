const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,79}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(name: string): string | null {
  if (!NAME_REGEX.test(name.trim())) {
    return 'Name must be 2-80 characters and include only letters, spaces, apostrophes, or hyphens.'
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address.'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'Password must be at least 8 characters.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.'
  }
  return null
}

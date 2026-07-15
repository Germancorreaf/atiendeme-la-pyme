// functions/lib/validator.js
// Central validation for all API inputs

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new ValidationError('messages must be an array');
  }

  if (messages.length === 0) {
    throw new ValidationError('messages array cannot be empty');
  }

  if (messages.length > 50) {
    throw new ValidationError('messages array too long (max 50 messages)');
  }

  return messages.map((msg, idx) => {
    if (typeof msg !== 'object' || msg === null) {
      throw new ValidationError(`message at index ${idx} is not an object`);
    }

    return {
      role: validateRole(msg.role, idx),
      content: validateContent(msg.content, idx)
    };
  });
}

export function validateRole(role, index = 0) {
  const validRoles = ['user', 'assistant'];
  
  if (!validRoles.includes(role)) {
    throw new ValidationError(
      `invalid role at index ${index}: "${role}" (must be ${validRoles.join(' or ')})`
    );
  }
  
  return role;
}

export function validateContent(content, index = 0) {
  if (typeof content !== 'string') {
    throw new ValidationError(
      `content at index ${index} must be a string, got ${typeof content}`
    );
  }

  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError(`content at index ${index} cannot be empty`);
  }

  if (trimmed.length > 5000) {
    throw new ValidationError(
      `content at index ${index} too long (${trimmed.length}/5000 chars)`
    );
  }

  return trimmed;
}

export function validateSessionId(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new ValidationError('sessionId is required and must be non-empty string');
  }

  const isValidUUID = /^[a-f0-9-]{36}$/.test(sessionId) || /^[a-f0-9-]{32,}$/.test(sessionId);
  
  if (!isValidUUID) {
    throw new ValidationError(`sessionId format invalid: "${sessionId.substring(0, 20)}..."`);
  }

  return sessionId;
}

export function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new ValidationError('email must be a string');
  }

  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    throw new ValidationError(`invalid email format: "${trimmed}"`);
  }

  if (trimmed.length > 254) {
    throw new ValidationError('email too long (max 254 chars)');
  }

  return trimmed;
}

export function validateDate(dateStr) {
  if (typeof dateStr !== 'string') {
    throw new ValidationError('date must be a string (YYYY-MM-DD format)');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new ValidationError(`invalid date format: "${dateStr}" (expected YYYY-MM-DD)`);
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`invalid date: "${dateStr}" is not a valid date`);
  }

  return dateStr;
}

export function validateTime(timeStr) {
  if (typeof timeStr !== 'string') {
    throw new ValidationError('time must be a string (HH:MM format)');
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(timeStr)) {
    throw new ValidationError(`invalid time format: "${timeStr}" (expected HH:MM)`);
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ValidationError(`invalid time values: "${timeStr}"`);
  }

  return timeStr;
}

export function validateName(name) {
  if (typeof name !== 'string') {
    throw new ValidationError('name must be a string');
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('name cannot be empty');
  }

  if (trimmed.length > 100) {
    throw new ValidationError(`name too long (${trimmed.length}/100 chars)`);
  }

  return trimmed;
}

export function validateNotes(notes) {
  if (typeof notes !== 'string') {
    throw new ValidationError('notes must be a string');
  }

  const trimmed = notes.trim();

  if (trimmed.length > 1000) {
    throw new ValidationError(`notes too long (${trimmed.length}/1000 chars)`);
  }

  return trimmed;
}

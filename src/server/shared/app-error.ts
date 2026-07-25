import { ERROR_CODES } from './constants.js';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidSymptomsError extends AppError {
  constructor(message = 'Symptoms description cannot be empty or contains invalid content.') {
    super(message, ERROR_CODES.INVALID_SYMPTOMS, 400);
  }
}

export class InvalidCoordinatesError extends AppError {
  constructor(message = 'Invalid latitude or longitude coordinates provided.') {
    super(message, ERROR_CODES.INVALID_COORDINATES, 400);
  }
}

export class HospitalNotFoundError extends AppError {
  constructor(hospitalId: string) {
    super(`Hospital with ID "${hospitalId}" was not found.`, ERROR_CODES.INVALID_HOSPITAL_ID, 404);
  }
}

export class NoHospitalsFoundError extends AppError {
  constructor(specialty: string) {
    super(`No hospitals offering "${specialty}" with available capacity were found in range.`, ERROR_CODES.NO_HOSPITALS_FOUND, 444);
  }
}

export class NoBedsAvailableError extends AppError {
  constructor(hospitalName: string) {
    super(`No available beds remaining at hospital "${hospitalName}".`, ERROR_CODES.NO_BEDS_AVAILABLE, 409);
  }
}

export class ReservationConflictError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.RESERVATION_CONFLICT, 409);
  }
}

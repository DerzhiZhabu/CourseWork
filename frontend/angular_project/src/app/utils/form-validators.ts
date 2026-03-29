import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

const ASCII_SPECIALS = `!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\`{|}~`;
const PASSWORD_REGEX = new RegExp(
  `^(?=.*[A-Za-z])(?=.*\\d)(?=.*[${ASCII_SPECIALS}])[A-Za-z\\d${ASCII_SPECIALS}]+$`
);

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return toTrimmedString(control.value) ? null : {trimmedRequired: true};
  };
}

export function trimmedMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = toTrimmedString(control.value);

    if (!value) {
      return null;
    }

    return value.length >= minLength
      ? null
      : {
          trimmedMinLength: {
            requiredLength: minLength,
            actualLength: value.length,
          },
        };
  };
}

export function oneOfValidator(options: readonly string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = toTrimmedString(control.value);

    if (!value) {
      return null;
    }

    return options.includes(value) ? null : {oneOf: true};
  };
}

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';

    if (!value || value.length < 8) {
      return null;
    }

    return PASSWORD_REGEX.test(value) ? null : {passwordComplexity: true};
  };
}

export function phoneCompleteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';

    if (!value) {
      return null;
    }

    const digits = value.replace(/\D/g, '');

    return digits.length === 11 ? null : {phoneIncomplete: true};
  };
}

export function getControlErrorMessage(
  control: AbstractControl | null | undefined,
  messages: Record<string, string>
): string {
  if (!control?.errors) {
    return '';
  }

  for (const [key, message] of Object.entries(messages)) {
    if (control.hasError(key)) {
      return message;
    }
  }

  return '';
}

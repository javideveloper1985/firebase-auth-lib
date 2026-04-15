import * as yup from 'yup'

export const UserSchema = yup.object({
  name: yup
    .string()
    .when('$isRegisterMode', {
      is: true,
      then: (schema) =>
        schema
          .min(2, 'validation.auth.nameTooShort')
          .required('validation.auth.nameRequired'),
      otherwise: (schema) => schema.notRequired(),
    }),
  email: yup
    .string()
    .email('validation.auth.emailInvalid')
    .required('validation.auth.emailRequired'),
  password: yup
    .string()
    .min(8, 'validation.auth.passwordMinLength')
    .required('validation.auth.passwordRequired'),
})

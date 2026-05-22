import z from 'zod'

const userSchema = z.object({
    username: z.string({
        invalid_type_error: 'Username must be a string.',
        required_error: 'Username is required.'
    }),
    password: z.string(),//.min(4, "Minimum 4 characters")
        //.regex(/[A-Z]/, "Must contain at least one uppercase letter")
        //.regex(/[a-z]/, "Must contain at least one lowercase letter")
        //.regex(/[0-9]/, "Must contain at least one number")
        //.regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    email: z.string({
        invalid_type_error: 'Email must be a string.',
        required_error: 'Email is required.'
    }).email(),
    age: z.number().int().min(18).max(99)
})

export function validateUserData (input) {
    return userSchema.safeParse(input)
}
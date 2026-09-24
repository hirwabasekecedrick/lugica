export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = LoginPayload & {
    name: string;
    phone: string;
};

export type UserRole = 'ADMIN' | 'DRIVER' | 'CLIENT';
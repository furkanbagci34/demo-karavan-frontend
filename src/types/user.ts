export interface User {
    id: string;
    name: string;
    surname?: string;
    email: string;
    avatar?: string;
    role: "admin" | "user";
    phone_number?: string;
    created_at: string;
    updated_at: string;
}

export interface UserResponse {
    token: string;
    user: User;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterResponse {
    token: string;
    user: User;
}

export interface UpdateUserData {
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
}

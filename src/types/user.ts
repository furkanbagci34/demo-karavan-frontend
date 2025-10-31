export interface User {
    id: string;
    name: string;
    surname?: string;
    email: string;
    avatar?: string;
    role: "admin" | "user";
    phone_number?: string;
    allowed_menus?: string[]; // Kullanıcının erişebileceği menü ID'leri
    default_page?: string; // Kullanıcının varsayılan sayfası
    signature?: string; // Kullanıcının imzası (base64 encoded image)
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

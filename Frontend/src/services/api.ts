const API_BASE_URL = 'http://localhost:8000';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id_usuario: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  rol: string;
  fecha_registro: string;
  is_active: boolean;
  email_verified: boolean;
}

export const authAPI = {
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el login');
    }

    return response.json();
  },

  register: async (userData: RegisterData): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el registro');
    }

    return response.json();
  },
};

// Guardar y obtener token del localStorage
export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },
};
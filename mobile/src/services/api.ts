const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.73:8000').replace(/\/$/, '');

type RequestOptions = RequestInit & {
  json?: Record<string, unknown>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.json) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Falha na comunicação com o servidor';
    throw new Error(message);
  }

  return payload as T;
}

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  councilNumber?: string | null;
};

export type BackendPatient = {
  id: string;
  nome: string;
  idade?: number | null;
  senha?: string;
  risco?: string;
  especialidade?: string;
  cpf?: string | null;
  sus?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  estadoCivil?: string | null;
  endereco?: string | null;
  status?: string;
  triagem?: Record<string, unknown>;
  clinicalNote?: string;
};

export async function loginProfessional(email: string, password: string) {
  return request<{ user: BackendUser }>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  });
}

export async function registerProfessional(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
  councilNumber?: string;
}) {
  return request<{ user: BackendUser }>('/api/auth/register', {
    method: 'POST',
    json: payload,
  });
}

export async function createPatient(payload: Record<string, unknown>) {
  return request<{ patient: BackendPatient }>('/api/patients', {
    method: 'POST',
    json: payload,
  });
}

export async function listPatients(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request<{ patients: BackendPatient[] }>(`/api/patients${query}`);
}

export async function saveTriage(patientId: string, payload: Record<string, unknown>) {
  return request<{ patient: BackendPatient }>(`/api/patients/${patientId}/triage`, {
    method: 'PUT',
    json: payload,
  });
}

export async function finalizeClinicalNote(patientId: string, payload: Record<string, unknown>) {
  return request<{ patient: BackendPatient }>(`/api/patients/${patientId}/clinical-note`, {
    method: 'PUT',
    json: payload,
  });
}

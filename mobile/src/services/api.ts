import { File as ExpoFile, UploadType } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'interpretarte.auth-token';
const REQUEST_TIMEOUT_MS = 15000;
let cachedAuthToken: string | null | undefined;

type RequestOptions = RequestInit & {
  json?: Record<string, unknown>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const authToken = await getAuthToken();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  if (options.json) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.json ? JSON.stringify(options.json) : options.body,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('O servidor demorou demais para responder');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuthToken();
    }
    const detail = payload?.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item?.msg).filter(Boolean).join('; ')
        : payload?.message || 'Falha na comunicação com o servidor';
    throw new Error(message);
  }

  return payload as T;
}

async function getAuthToken(): Promise<string | null> {
  if (cachedAuthToken !== undefined) return cachedAuthToken;
  try {
    cachedAuthToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    cachedAuthToken = null;
  }
  return cachedAuthToken;
}

async function saveAuthToken(token: string): Promise<void> {
  cachedAuthToken = token;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

async function clearAuthToken(): Promise<void> {
  cachedAuthToken = null;
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // O cache em memória já foi limpo; falhas do armazenamento não bloqueiam o logout.
  }
}

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  councilNumber?: string | null;
  active?: boolean;
  createdAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
  triagem?: Record<string, unknown>;
  clinicalNote?: string;
};

export async function loginProfessional(email: string, password: string) {
  await clearAuthToken();
  const response = await request<{
    user: BackendUser;
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  }>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  });
  await saveAuthToken(response.accessToken);
  return response;
}

export async function logoutProfessional() {
  await clearAuthToken();
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

export async function listProfessionals(role?: string) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return request<{ professionals: BackendUser[] }>(`/api/professionals${query}`);
}

export async function deleteProfessional(professionalId: string) {
  return request<{ status: string }>(`/api/professionals/${professionalId}`, {
    method: 'DELETE',
  });
}

export async function setProfessionalActivation(professionalId: string, active: boolean) {
  return request<{ user: BackendUser }>(`/api/professionals/${professionalId}/activation`, {
    method: 'PUT',
    json: { active },
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

export async function deletePatient(patientId: string) {
  return request<{ status: string }>(`/api/patients/${patientId}`, {
    method: 'DELETE',
  });
}

export async function getPatient(patientId: string) {
  return request<{ patient: BackendPatient }>(`/api/patients/${patientId}`);
}

export async function lookupPatient(cpf?: string, sus?: string) {
  return request<{ patient: BackendPatient }>('/api/patients/lookup', {
    method: 'POST',
    json: { cpf, sus },
  });
}

export async function getPatientStatus(patientId: string) {
  return request<{ patient: Pick<BackendPatient, 'id' | 'senha' | 'status' | 'updatedAt'> }>(
    `/api/patients/${patientId}/status`
  );
}

export async function updatePatient(patientId: string, payload: Record<string, unknown>) {
  return request<{ patient: BackendPatient }>(`/api/patients/${patientId}`, {
    method: 'PUT',
    json: payload,
  });
}

export async function getAttendancesHourly(windowHours = 6) {
  const query = `?window_hours=${encodeURIComponent(String(windowHours))}`;
  return request<{ windowHours: number; labels: string[]; values: number[]; generatedAt: string }>(
    `/api/metrics/attendances-hourly${query}`
  );
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

export type PredictVideoResult = {
  status: 'predicted' | 'uncertain' | 'partial' | 'error';
  word?: string;
  confidence?: number;
  message?: string;
  top3?: Array<{ word: string; confidence: number }>;
};

export async function predictVideo(videoUri: string): Promise<PredictVideoResult> {
  const filename = videoUri.split('/').pop() || 'libras_sinal.mp4';

  try {
    // 1. Método nativo do Expo FileSystem (SDK 57 New Architecture) - sem bugs de FormData
    const file = new ExpoFile(videoUri);
    const uploadResult = await file.upload(`${API_BASE_URL}/predict_video`, {
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'video/mp4',
      httpMethod: 'POST',
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return JSON.parse(uploadResult.body);
    }
    throw new Error(`Upload nativo falhou com status ${uploadResult.status}: ${uploadResult.body}`);
  } catch (err: any) {
    console.log('Tentando envio alternativo via Blob padrão:', err?.message || err);

    // 2. Fallback padrão WinterCG com Blob (lê a URI local como Blob)
    const fileRes = await fetch(videoUri);
    const blob = await fileRes.blob();

    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await fetch(`${API_BASE_URL}/predict_video`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  }
}

export { API_BASE_URL };


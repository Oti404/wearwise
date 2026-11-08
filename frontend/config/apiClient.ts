import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const TOKEN_KEY = 'wearwise.authToken';

// AsyncStorage maps to localStorage on web, so the session survives page reloads.
export const getAuthToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => AsyncStorage.removeItem(TOKEN_KEY);

/** JSON headers plus the bearer token when the user is signed in. */
export const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Backend errors use `message`; a few legacy endpoints still send `error`. */
export const errorMessage = (result: any, fallback: string): string =>
  result?.message || result?.error || fallback;

/**
 * Uploads one local image (picker URI) to the backend and returns its public URL.
 */
export const uploadImage = async (localUri: string): Promise<string> => {
  const blob = await (await fetch(localUri)).blob();
  const form = new FormData();
  form.append('image', blob, 'image');

  const token = await getAuthToken();
  // No Content-Type header: the browser sets the multipart boundary itself.
  const response = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(errorMessage(result, 'Image upload failed.'));
  return result.url;
};

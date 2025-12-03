/**
 * Centralized API configuration
 * Use this utility to get the correct API base URL for all backend requests
 */

const getApiUrl = (): string => {
  // In production, use environment variable
  // In development, default to localhost
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"';
  }
  // Server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"';
};

export const API_BASE_URL = getApiUrl();

/**
 * Helper function to construct full API URLs
 */
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Helper function to get silhouette/image URLs
 */
export const silhouetteUrl = (filename: string): string => {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${API_BASE_URL}/silhouettes/${cleanFilename}`;
};

/**
 * Helper function to get upload URLs
 */
export const uploadUrl = (filename: string): string => {
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${API_BASE_URL}/uploads/${cleanFilename}`;
};

/**
 * Helper function to get profile image URLs
 */
export const profileImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_BASE_URL}/${cleanPath}`;
};



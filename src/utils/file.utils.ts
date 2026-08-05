/**
 * Safely constructs absolute URLs for uploaded documents using the VITE_API_URL configuration.
 */
export function buildFileUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const api = import.meta.env.VITE_API_URL || '';
    const base = api.replace("/api", "");
    // Ensure there is exactly one slash separating the base URL and the path
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${base}${cleanPath}`;
}

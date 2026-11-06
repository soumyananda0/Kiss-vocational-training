/**
 * Robust Client-Side PDF Downloader and Previewer for KISS-VTMS
 */

export async function downloadCertificatePdf(certIdentifier, filename) {
  try {
    const token = localStorage.getItem('kiss_vtms_token');
    const queryParams = new URLSearchParams();
    if (token) queryParams.append('token', token);

    const url = `/api/certificates/download/${encodeURIComponent(certIdentifier)}?${queryParams.toString()}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to download certificate (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `${certIdentifier}.pdf`;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 200);

    return true;
  } catch (err) {
    console.error('[Download Helper Error]:', err);
    // Fallback: direct window navigation
    const token = localStorage.getItem('kiss_vtms_token');
    const fallbackUrl = `/api/certificates/download/${encodeURIComponent(certIdentifier)}?token=${encodeURIComponent(token || '')}`;
    window.open(fallbackUrl, '_blank');
    return false;
  }
}

export function previewCertificatePdf(certIdentifier) {
  const token = localStorage.getItem('kiss_vtms_token');
  const url = `/api/certificates/download/${encodeURIComponent(certIdentifier)}?inline=true&token=${encodeURIComponent(token || '')}`;
  window.open(url, '_blank');
}

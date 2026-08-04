/**
 * imageCompressor.js
 * 
 * Client-side image compression using the native Canvas API.
 * No external dependencies required.
 * 
 * Compression profiles:
 *   - photo:     600×600px, 80% quality, max 500 KB
 *   - signature: max 600px wide, 72% quality, max 200 KB
 *   - document:  max 1800px long edge, 82% quality, max 1 MB
 */

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const PROFILES = {
    photo: {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.80,
        maxSizeBytes: 500 * 1024,          // 500 KB
        label: 'JPG/PNG, max 500 KB',
    },
    signature: {
        maxWidth: 600,
        maxHeight: 9999,
        quality: 0.72,
        maxSizeBytes: 200 * 1024,          // 200 KB
        label: 'JPG/PNG, max 200 KB',
    },
    document: {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.82,
        maxSizeBytes: 1 * 1024 * 1024,     // 1 MB
        label: 'JPG/PNG, max 1 MB',
    },
};

/** Map doc names to their compression profile */
const DOC_PROFILE_MAP = {
    photo: 'photo',
    signature: 'signature',
    sslcMarkscard: 'document',
    pucMarkscard: 'document',
    aadhaar: 'document',
    cetScoreCard: 'document',
    casteCertificate: 'document',
    incomeCertificate: 'document',
    studyCertificate: 'document',
};

export { PROFILES, DOC_PROFILE_MAP, ACCEPTED_TYPES };

/**
 * Validate that the file is an accepted image type.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageType(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Only JPG, JPEG, and PNG images are allowed.',
        };
    }
    return { valid: true };
}

/**
 * Load a File into an HTMLImageElement.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image. The file may be corrupted.'));
        };
        img.src = url;
    });
}

/**
 * Compute scaled dimensions keeping aspect ratio within maxWidth × maxHeight.
 */
function scaleDimensions(srcW, srcH, maxW, maxH) {
    let w = srcW;
    let h = srcH;
    if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
    if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
    return { w, h };
}

/**
 * Draw image onto a canvas and export as a Blob.
 */
function canvasToBlob(canvas, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
}

/**
 * Compress an image File according to the given profile name.
 *
 * @param {File} file          - Original image File object
 * @param {string} profileKey  - One of: 'photo' | 'signature' | 'document'
 * @returns {Promise<File>}    - Compressed File ready for upload
 */
export async function compressImage(file, profileKey = 'document') {
    const profile = PROFILES[profileKey] || PROFILES.document;

    // 1. Validate type
    const validation = validateImageType(file);
    if (!validation.valid) throw new Error(validation.error);

    // 2. Load image
    const img = await loadImage(file);
    const { w, h } = scaleDimensions(img.naturalWidth, img.naturalHeight, profile.maxWidth, profile.maxHeight);

    // 3. Draw onto canvas
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // 4. Try compressing; lower quality iteratively if still over limit
    let quality = profile.quality;
    let blob = await canvasToBlob(canvas, quality);

    while (blob.size > profile.maxSizeBytes && quality > 0.4) {
        quality -= 0.05;
        blob = await canvasToBlob(canvas, quality);
    }

    // 5. If still over limit after aggressive compression, reject
    if (blob.size > profile.maxSizeBytes) {
        throw new Error(
            `Image is too large. Please upload a clearer image under the allowed size (${profile.label}).`
        );
    }

    // 6. Return as a proper File with original name (forced .jpg extension)
    const originalName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], originalName, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Convenience wrapper: compress a file for a specific doc slot.
 *
 * @param {File}   file
 * @param {string} docName  - Key from DOC_PROFILE_MAP
 * @returns {Promise<File>}
 */
export async function compressDocumentImage(file, docName) {
    const profileKey = DOC_PROFILE_MAP[docName] || 'document';
    return compressImage(file, profileKey);
}

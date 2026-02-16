/**
 * Web Image Picker using <input type="file">.
 * Fallback for expo-image-picker which doesn't support camera on web.
 */

const MAX_WIDTH = 1024;

/**
 * Open a file picker for images. Returns array of data URIs.
 */
export function pickWebImages(multiple = false): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return resolve([]);

      const uris = await Promise.all(files.map((f) => readFileAsDataUri(f)));
      resolve(uris);
    };

    // Handle cancel
    input.oncancel = () => resolve([]);

    input.click();
  });
}

/**
 * Resize and compress an image to JPEG base64.
 * Returns raw base64 string (no data URI prefix).
 */
export async function compressWebImage(
  dataUri: string,
  maxWidth = MAX_WIDTH,
  quality = 0.7,
): Promise<string> {
  const img = await loadImage(dataUri);

  const canvas = document.createElement("canvas");
  let { width, height } = img;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
  // Strip "data:image/jpeg;base64," prefix
  return jpegDataUrl.split(",")[1] || "";
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

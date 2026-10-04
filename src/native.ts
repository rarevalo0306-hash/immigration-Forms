import { Capacitor } from '@capacitor/core';

/**
 * The few things that work differently inside the iPhone (and later Android) app than in the
 * browser. The app is the same site wrapped by Capacitor (capacitor.config.ts).
 */

export const isNativeApp = () => Capacitor.isNativePlatform();

const toBase64 = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

/**
 * Hands a file to the person: a download in the browser; in the app, the file is saved and the
 * phone's share sheet opens (save to Files, print, send by WhatsApp or email).
 */
export async function saveFile(name: string, blob: Blob, title: string) {
  if (!isNativeApp()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  // Loaded only in the app, so the website doesn't carry the plugins.
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
  try {
    await Share.share({ title, files: [uri] });
  } catch (e) {
    // Closing the share sheet without choosing anything is not an error.
    if (!/cancel/i.test(String((e as Error)?.message ?? e))) throw e;
  }
}

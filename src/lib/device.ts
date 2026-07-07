// Identificador único deste dispositivo/tablet (guardado localmente)
const KEY = 'cv_device_id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

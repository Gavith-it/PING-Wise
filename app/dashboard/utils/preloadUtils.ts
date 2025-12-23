/**
 * Preload function helper for appointment modal
 */
export async function loadPreloadFunction() {
  try {
    const mod = await import('@/components/modals/AppointmentModal');
    if (mod.preloadFormData) {
      await mod.preloadFormData();
    }
  } catch (error) {
    // Silently fail - preloading is optional
  }
}

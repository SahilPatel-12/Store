/**
 * Utility to load Razorpay Standard Checkout script dynamically in the browser
 */
let scriptLoadingPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  // If already loaded by another page/component, resolve immediately
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  // If a script load is already in-flight, return the same promise
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    // Double check if script tag already exists in DOM
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      scriptLoadingPromise = null; // Clear on error to allow retrying
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

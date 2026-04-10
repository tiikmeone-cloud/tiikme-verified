import { lazy, type ComponentType } from "react";

type LazyModule<T extends ComponentType<any>> = {
  default: T;
};

const RETRY_PREFIX = "lazy-retry:";

function isDynamicImportFailure(error: unknown) {
  if (!(error instanceof Error)) return false;

  return /Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module/i.test(
    error.message,
  );
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<LazyModule<T>>,
  key: string,
) {
  return lazy(async () => {
    const storageKey = `${RETRY_PREFIX}${key}`;
    const canUseSessionStorage = typeof window !== "undefined";
    const alreadyRetried =
      canUseSessionStorage && window.sessionStorage.getItem(storageKey) === "true";

    try {
      const module = await importer();

      if (canUseSessionStorage) {
        window.sessionStorage.removeItem(storageKey);
      }

      return module;
    } catch (error) {
      if (canUseSessionStorage && isDynamicImportFailure(error) && !alreadyRetried) {
        window.sessionStorage.setItem(storageKey, "true");
        window.location.reload();

        return new Promise<LazyModule<T>>(() => undefined);
      }

      throw error;
    }
  });
}
// FILE: frontend/verticals/index.tsx
import { config as coreConfig } from './core';

export const getVerticalConfig = async () => {
  const verticalName = process.env.NEXT_PUBLIC_ACTIVE_VERTICAL;

  if (!verticalName || verticalName === 'core') {
    console.log("No vertical set or core specified, using 'core' config.");
    const { components, ...rest } = coreConfig;
    return { name: 'core', config: rest };
  }

  try {
    console.log(`Loading config for vertical: ${verticalName}`);
    const verticalModule = await import(`./${verticalName}`);
    const { components, ...rest } = verticalModule.config;
    return { name: verticalName, config: rest };
  } catch (error) {
    console.error(`Failed to load vertical '${verticalName}', falling back to 'core'.`, error);
    const { components, ...rest } = coreConfig;
    return { name: 'core', config: rest };
  }
};

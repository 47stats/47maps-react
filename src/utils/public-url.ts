const baseUrl = import.meta.env.BASE_URL || "/";

export const publicUrl = (path: string) =>
  `${baseUrl}${path.replace(/^\/+/, "")}`;

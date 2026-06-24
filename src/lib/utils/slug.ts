export function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[!@#$%^&*()+={}\[\]|\\:;"'<>,.?/`~]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

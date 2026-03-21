/**
 * Academic email detection — frontend mirror of backend/src/lib/academic.ts
 * Keep in sync with backend version.
 */

const ACADEMIC_SUFFIXES = [
  '.edu',
  '.ac.uk',
  '.ac.at',
  '.edu.au',
  '.ac.nz',
  '.ac.za',
  '.ac.in',
  '.ac.jp',
  '.ac.kr',
  '.ac.il',
  '.ac.th',
  '.ac.ir',
  '.ac.cn',
  '.edu.sg',
  '.edu.hk',
  '.edu.my',
  '.edu.br',
  '.edu.mx',
  '.edu.co',
  '.edu.ph',
  '.edu.ng',
  '.edu.eg',
  '.ac.id',
];

export function isAcademicEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.toLowerCase().split('@')[1] ?? '';
  return ACADEMIC_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

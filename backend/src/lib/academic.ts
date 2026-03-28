/**
 * Academic email detection
 * Covers the major international academic TLD patterns.
 */

const ACADEMIC_SUFFIXES = [
  // United States
  '.edu',
  // United Kingdom
  '.ac.uk',
  // Austria
  '.ac.at',
  // Australia
  '.edu.au',
  // New Zealand
  '.ac.nz',
  // South Africa
  '.ac.za',
  // India
  '.ac.in',
  // Japan
  '.ac.jp',
  // South Korea
  '.ac.kr',
  // Israel
  '.ac.il',
  // Thailand
  '.ac.th',
  // Iran
  '.ac.ir',
  // China
  '.ac.cn',
  // Singapore
  '.edu.sg',
  // Hong Kong
  '.edu.hk',
  // Malaysia
  '.edu.my',
  // Brazil
  '.edu.br',
  // Mexico
  '.edu.mx',
  // Colombia
  '.edu.co',
  // Philippines
  '.edu.ph',
  // Nigeria
  '.edu.ng',
  // Egypt
  '.edu.eg',
  // Indonesia
  '.ac.id',
];

export function isAcademicEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.toLowerCase().split('@')[1] ?? '';
  return ACADEMIC_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

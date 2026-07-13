// French SIRET: 14 digits, valid under the Luhn checksum.
function isValidSiret(siret) {
  if (typeof siret !== 'string' || !/^\d{14}$/.test(siret)) return false;
  let sum = 0;
  for (let i = 0; i < siret.length; i++) {
    let digit = Number(siret[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

module.exports = { isValidSiret };

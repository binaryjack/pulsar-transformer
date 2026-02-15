const chars = ['∩┐╜', '∩╕Å', 'Γ£ô', 'ΓÜá'];

chars.forEach(char => {
  const code = char.charCodeAt(0);
  const hex = code.toString(16).toUpperCase().padStart(4, '0');
  console.log(`'${char}': U+${hex} (${code})`);
  console.log(`  Bytes: ${Buffer.from(char, 'utf8').toString('hex')}`);
});
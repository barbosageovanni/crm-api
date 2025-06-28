// test-import.ts
try {
  const expressValidator = require('express-validator');
  console.log('CommonJS import funciona:', typeof expressValidator.body);
  
  import('express-validator').then(module => {
    console.log('ES Module import funciona:', typeof module.body);
  });
} catch (error) {
  console.error('Erro na importação:', error);
}
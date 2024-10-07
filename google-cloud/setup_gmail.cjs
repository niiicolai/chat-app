const { authorize } = require('./gmail.cjs');

authorize()
  .then(() => {
    console.log('Authorized');
  })
  .catch(console.error);
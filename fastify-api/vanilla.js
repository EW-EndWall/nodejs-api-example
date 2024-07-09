const fastify = require('fastify')();

fastify.post('/api/data', (req, res) => {
  // POST işlemini burada işle
  res.send({ message: 'Data posted successfully' });
});

fastify.get('/api/data', (req, res) => {
  // GET işlemini burada işle
  res.send({ data: 'Some data' });
});

fastify.delete('/api/data', (req, res) => {
  // DELETE işlemini burada işle
  res.send({ message: 'Data deleted successfully' });
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});

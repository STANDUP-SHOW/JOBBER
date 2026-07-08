function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.expose ? err.message : (status === 500 ? 'Erreur interne du serveur' : err.message);
  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Route introuvable' });
}

module.exports = { errorHandler, notFound };

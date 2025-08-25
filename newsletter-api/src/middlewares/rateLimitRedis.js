// Rate-limit basé Redis. Compte le nombre de hits par "clé"
// sur une fenêtre glissante simple (TTL).
const { redis } = require('../redis');

module.exports = function rateLimitRedis({
  windowSec = 600,       // 10 minutes
  max = 5,               // 5 requêtes par fenêtre
  prefix = 'rl',         // préfixe des clés
  key                      // (req) => string  -> pour clé custom; sinon clé par IP+route
} = {}) {
  return async (req, res, next) => {
    try {
      const ip = (req.ip || req.connection?.remoteAddress || 'unknown').replace(/[^0-9a-f.:]/gi, '');
      const route = req.baseUrl + req.path;
      const suffix = typeof key === 'function' ? key(req) : `${route}:${ip}`;
      if (!suffix) return next();

      const rkey = `${prefix}:${suffix}`;

      // incrément + set TTL la première fois
      const count = await redis.incr(rkey);
      if (count === 1) await redis.expire(rkey, windowSec);

      // TTL restant (pour Retry-After)
      const ttl = await redis.ttl(rkey);

      if (count > max) {
        if (ttl > 0) res.set('Retry-After', String(ttl));
        return res.status(429).json({ error: 'Too many requests' });
      }

      next();
    } catch (err) {
      // En cas de souci Redis, on ne bloque pas l’utilisateur
      console.error('[rateLimitRedis] error:', err.message);
      next();
    }
  };
};

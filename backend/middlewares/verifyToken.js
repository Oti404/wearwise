const { supabase } = require('../config/supabase');
const AppError = require('./AppError');

/**
 * verifyToken – Supabase Auth middleware.
 *
 * Expects:  Authorization: Bearer <supabase_access_token>
 * Sets:     req.user = Supabase user object
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Autentificare necesară. Token lipsă.', 401));
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AppError('Token invalid sau expirat.', 401);
    }

    // Map properties for legacy compatibility if needed
    // Typically, Firebase 'uid' is mapped to Supabase 'id' (UUID)
    req.user = {
      ...user,
      uid: user.id, // For compatibility with clothesSqlService which uses .authUid
    };
    
    next();
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError('Token verification failed.', 401));
  }
};

module.exports = verifyToken;

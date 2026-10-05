import type { Request, Response, NextFunction } from 'express';

export function validateAnalysis(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  const allowed = ['title', 'match_context', 'opponent_style', 'match_description', 'boxer_profile', 'images'];
  const boundedString = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
  const profile = body?.boxer_profile;
  const validImages = body?.images === undefined || (Array.isArray(body.images) && body.images.length <= 5 && body.images.every((s: unknown) => {
    if (typeof s !== 'string' || s.length > 500_000) return false;
    const raw = s.replace(/^data:image\/(jpeg|png);base64,/, '');
    return /^(?:\/9j\/|iVBORw0KGgo)[A-Za-z0-9+/]*={0,2}$/.test(raw);
  }));
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !allowed.includes(k)) ||
    !boundedString(body.title, 120) || !boundedString(body.match_description, 5000) ||
    !['training', 'sparring', 'amateur', 'pro'].includes(body.match_context) ||
    !['balanced', 'aggressive', 'defensive', 'counter', 'brawler'].includes(body.opponent_style) ||
    !profile || typeof profile !== 'object' || Array.isArray(profile) ||
    Object.keys(profile).some(k => !['stance','experience_level','weight_class'].includes(k)) ||
    !['Orthodox','Southpaw','Switch'].includes(profile.stance) ||
    !['Beginner','Intermediate','Advanced','Pro'].includes(profile.experience_level) ||
    !boundedString(profile.weight_class, 64) || !validImages ||
    (!body.match_description.trim() && !body.images?.length)) {
    res.status(400).json({ error: 'Provide valid session notes or up to five JPEG/PNG photos. Video analysis is not supported.' });
    return;
  }
  next();
}

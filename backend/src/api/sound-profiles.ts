import { Router, Request, Response } from 'express';
import { SoundProfileService } from '../sound/sound-profile-service.js';

export const soundProfilesRouter = Router();

const soundProfileService = new SoundProfileService();

/**
 * GET /api/sound-profiles/:id/audio
 *
 * Serve or redirect to the audio clip URL for a given sound profile.
 * Returns a 302 redirect to the audio file, or 404 if not available.
 */
soundProfilesRouter.get('/:id/audio', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const audioUrl = await soundProfileService.getAudioClipUrl(id);

    if (!audioUrl) {
      res.status(404).json({ error: 'Audio clip not available for this sound profile' });
      return;
    }

    res.redirect(302, audioUrl);
  } catch (err) {
    console.error('Error fetching audio clip URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

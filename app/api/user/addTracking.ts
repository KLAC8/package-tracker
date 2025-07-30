import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { chatId, trackingNumber } = req.body;

  if (!chatId || !trackingNumber) {
    return res.status(400).json({ error: 'chatId and trackingNumber required' });
  }

  await dbConnect();

  let user = await User.findOne({ chatId });

  if (!user) {
    user = new User({ chatId, trackedPackages: [trackingNumber] });
  } else if (!user.trackedPackages.includes(trackingNumber)) {
    user.trackedPackages.push(trackingNumber);
  }

  await user.save();

  res.json({ success: true, user });
}

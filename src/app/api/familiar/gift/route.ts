import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  recomputeAndPersist, toFamiliarDTO, computePartyResonance,
  checkAndUnlockAchievements, grantAchievementRewards,
} from '@/lib/familiar-logic';
import { GIFT_TYPES, GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/familiar/gift — send a gift to another player's familiar.
// Body: { toUserId, giftType, message? }
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const body = await req.json();
    const { toUserId, giftType, message } = body as { toUserId?: string; giftType?: string; message?: string };

    if (!toUserId || !giftType) {
      return NextResponse.json({ error: 'toUserId и giftType обязательны' }, { status: 400 });
    }
    if (toUserId === me.id) {
      return NextResponse.json({ error: 'Нельзя подарить самому себе' }, { status: 400 });
    }

    const gift = GIFT_TYPES.find((g) => g.code === giftType);
    if (!gift) {
      return NextResponse.json({ error: 'Неизвестный тип подарка' }, { status: 400 });
    }

    // Check sender has enough coins.
    const senderFam = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!senderFam) return NextResponse.json({ error: 'Ваш фамильяр не найден' }, { status: 404 });
    if (senderFam.coins < gift.coinCost) {
      return NextResponse.json({ error: `Нужно ${gift.coinCost} монет для этого подарка` }, { status: 400 });
    }

    // Check recipient exists + has a familiar.
    const recipientFam = await db.familiar.findUnique({ where: { userId: toUserId } });
    if (!recipientFam) return NextResponse.json({ error: 'Фамильяр получателя не найден' }, { status: 404 });

    // Cooldown: check last gift from me to this recipient.
    const lastGift = await db.gift.findFirst({
      where: { fromUserId: me.id, toUserId },
      orderBy: { createdAt: 'desc' },
    });
    if (lastGift) {
      const since = Date.now() - new Date(lastGift.createdAt).getTime();
      if (since < GAME.GIFT_COOLDOWN_MS) {
        const wait = Math.ceil((GAME.GIFT_COOLDOWN_MS - since) / 1000);
        return NextResponse.json({ error: `Подожди ${wait} сек. перед следующим подарком этому игроку` }, { status: 429 });
      }
    }

    // Recompute recipient decay first.
    await recomputeAndPersist(recipientFam.id);
    const refreshedRecipient = await db.familiar.findUnique({ where: { userId: toUserId } });
    if (!refreshedRecipient) return NextResponse.json({ error: 'Фамильяр получателя не найден' }, { status: 404 });

    // Deduct coins from sender, boost recipient stats.
    const [updatedSender, updatedRecipient] = await Promise.all([
      db.familiar.update({
        where: { userId: me.id },
        data: { coins: senderFam.coins - gift.coinCost },
      }),
      db.familiar.update({
        where: { userId: toUserId },
        data: {
          mood: clamp(refreshedRecipient.mood + gift.moodBoost),
          sync: clamp(refreshedRecipient.sync + gift.syncBoost),
        },
      }),
    ]);

    // Record the gift.
    await db.gift.create({
      data: {
        fromUserId: me.id,
        toUserId,
        giftType: gift.code,
        coinCost: gift.coinCost,
        moodBoost: gift.moodBoost,
        syncBoost: gift.syncBoost,
        message: message?.slice(0, 100) || null,
      },
    });

    // Log on both familiars.
    await db.interactionLog.create({
      data: {
        familiarId: updatedSender.id,
        userId: me.id,
        actionType: 'admin_edit',
        detail: `gift_sent:${gift.code} to ${toUserId} (-${gift.coinCost} coins)`,
      },
    });
    await db.interactionLog.create({
      data: {
        familiarId: updatedRecipient.id,
        userId: toUserId,
        actionType: 'claim_buff',
        detail: `gift_received:${gift.code} from ${me.username} (+${gift.moodBoost}mood +${gift.syncBoost}sync)`,
      },
    });

    // Broadcast updates.
    const senderDto = toFamiliarDTO(updatedSender);
    const recipientDto = toFamiliarDTO(updatedRecipient);

    // Check achievement unlocks for sender (gift_count metric).
    const newlyUnlocked = await checkAndUnlockAchievements(me.id);
    const rewardCoins = await grantAchievementRewards(me.id, newlyUnlocked);
    // Re-fetch sender if achievement rewards changed coins.
    const finalSenderFam = rewardCoins > 0 ? await db.familiar.findUnique({ where: { userId: me.id } }) : updatedSender;
    const finalSenderDto = rewardCoins > 0 ? toFamiliarDTO(finalSenderFam!) : senderDto;

    await broadcastFamiliarUpdate(finalSenderDto);
    await broadcastFamiliarUpdate(recipientDto);
    await broadcastPartyResonance(await computePartyResonance());

    return NextResponse.json({
      familiar: finalSenderDto,
      gift: {
        type: gift,
        recipientUsername: (await db.user.findUnique({ where: { id: toUserId }, select: { username: true } }))?.username,
      },
      newAchievements: newlyUnlocked,
      achievementCoins: rewardCoins,
    });
  } catch (e) {
    console.error('[familiar/gift]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}

// GET — list of gifts received by the current user (recent 10).
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const gifts = await db.gift.findMany({
      where: { toUserId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { fromUser: { select: { username: true, characterName: true } } },
    });
    return NextResponse.json({
      gifts: gifts.map((g) => ({
        id: g.id,
        fromUsername: g.fromUser.characterName || g.fromUser.username,
        giftType: g.giftType,
        emoji: GIFT_TYPES.find((t) => t.code === g.giftType)?.emoji || '🎁',
        message: g.message,
        createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt,
      })),
    });
  } catch (e) {
    console.error('[familiar/gift/get]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}

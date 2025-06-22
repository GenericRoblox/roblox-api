// api/playerStatus.js
import axios from 'axios';

export default async function handler(req, res) {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId parameter." });
    }

    try {
        // 1. Online status
        const presenceRes = await axios.post('https://presence.roblox.com/v1/presence/users', {
            userIds: [parseInt(userId)]
        });
        const presence = presenceRes.data.userPresences[0];
        const isOnline = presence.userPresenceType !== 0;
        const inGame = presence.userPresenceType === 2;

        // 2. Latest badge
        const badgeRes = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Desc`);
        const badges = badgeRes.data.data;
        const latestBadge = badges[0];

        // 3. Latest gamepass
        const gamepassRes = await axios.get(`https://inventory.roblox.com/v1/users/${userId}/inventory/game-pass`);
        const gamepasses = gamepassRes.data.data;
        const latestGamepass = gamepasses[0];

        let badgeDate = latestBadge ? new Date(latestBadge.awardedDate) : null;
        let passDate = latestGamepass ? new Date(latestGamepass.created) : null;

        let universeId = null;

        if (badgeDate && (!passDate || badgeDate > passDate)) {
            const badgeDetails = await axios.get(`https://badges.roblox.com/v1/badges/${latestBadge.id}`);
            universeId = badgeDetails.data.awardingUniverse?.id || null;
        } else if (latestGamepass) {
            const passDetails = await axios.get(`https://api.roblox.com/marketplace/productinfo?assetId=${latestGamepass.assetId}`);
            universeId = passDetails.data.Creator?.CreatorTargetId || null;
        }

        let gameName = "Unknown";
        let placeId = 0;

        if (universeId) {
            const gameDetails = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
            const gameData = gameDetails.data.data[0];
            gameName = gameData.name || "Unnamed Game";
            placeId = gameData.rootPlaceId || 0;
        }

        return res.status(200).json({
            isOnline,
            inGame,
            gameInfo: {
                name: gameName,
                placeId,
                universeId
            }
        });

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ error: "Failed to fetch player status." });
    }
}

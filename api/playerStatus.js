// api/playerStatus.js
export default function handler(req, res) {
  const userId = req.query.userId || "none";

  res.status(200).json({
    message: "Test successful!",
    userId: userId,
    isOnline: true,
    inGame: false,
    gameInfo: {
      name: "Test Game",
      placeId: 123456,
      universeId: 654321
    }
  });
}

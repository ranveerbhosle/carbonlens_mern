/** Base Green Coins change per bill (before streak / milestone bonuses). High emissions incur a penalty. */
const HIGH_EMISSION_PENALTY = 15;

const calculateCoinsEarned = (emissionLevel) => {
  if (emissionLevel === 'Low') return 30;
  if (emissionLevel === 'Medium') return 10;
  return -HIGH_EMISSION_PENALTY;
};

const getBadge = (coins) => {
  if (coins >= 500) return '🌍 Carbon Champion';
  if (coins >= 301) return '♻️ Sustainability Hero';
  if (coins >= 151) return '🌳 Green Guardian';
  if (coins >= 51) return '🌿 Eco Starter';
  return '🌱 Seedling';
};

const updateUserCoins = async (user, emissionLevel) => {
  let coinsEarned = calculateCoinsEarned(emissionLevel);
  let bonusMessage = null;
  let penaltyMessage = null;

  if (emissionLevel === 'High') {
    penaltyMessage = `⚠️ High emissions: −${HIGH_EMISSION_PENALTY} Green Coins`;
  }

  if (emissionLevel === 'Low') {
    user.consecutiveLowEmissions += 1;
  } else {
    user.consecutiveLowEmissions = 0;
  }

  if (user.consecutiveLowEmissions === 3) {
    coinsEarned += 50;
    user.consecutiveLowEmissions = 0;
    bonusMessage = '🔥 3 Low Emissions Streak! +50 bonus coins!';
  }

  user.totalBillsUploaded += 1;

  if (user.totalBillsUploaded === 10) {
    coinsEarned += 25;
    bonusMessage = '🏆 10 Bills Uploaded Milestone! +25 bonus coins!';
  }

  user.greenCoins += coinsEarned;
  if (user.greenCoins < 0) user.greenCoins = 0;
  user.badge = getBadge(user.greenCoins);

  await user.save();

  return { coinsEarned, bonusMessage, penaltyMessage };
};

module.exports = { updateUserCoins, getBadge, calculateCoinsEarned };

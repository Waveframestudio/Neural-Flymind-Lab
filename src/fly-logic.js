import BRAIN from './connectome.js';

// Normalize angle to [-PI, PI] range
function normalizeAngle(a) {
	a = a % (2 * Math.PI);
	if (a > Math.PI) a -= 2 * Math.PI;
	if (a < -Math.PI) a += 2 * Math.PI;
	return a;
}

// Accumulator thresholds for entering each behavior state
var BEHAVIOR_THRESHOLDS = {
	startle: 30,
	fly: 15,
	feed: 8,
	groom: 8,
	walk: 5,
	restFatigue: 0.7,
	exploreCuriosity: 0.4,
	phototaxisLight: 0.5,
};

/**
 * Returns true if the given behavior state is in its cooldown period.
 */
function isCoolingDown(state, now, behaviorObj) {
	var bObj = behaviorObj || (typeof behavior !== 'undefined' ? behavior : (typeof window !== 'undefined' ? window.behavior : null));
	if (!bObj || !bObj.cooldowns) return false;
	return bObj.cooldowns[state] !== undefined && now < bObj.cooldowns[state];
}

/**
 * Returns true if any food item is within 50px of the fly.
 */
function hasNearbyFood(foodList, flyObj) {
	var fList = foodList || (typeof food !== 'undefined' ? food : (typeof window !== 'undefined' ? window.food : [])) || [];
	var fObj = flyObj || (typeof fly !== 'undefined' ? fly : (typeof window !== 'undefined' ? window.fly : null));
	if (!fObj) return false;
	for (var i = 0; i < fList.length; i++) {
		if (Math.hypot(fObj.x - fList[i].x, fObj.y - fList[i].y) <= 50) return true;
	}
	return false;
}

/**
 * Evaluates accumulator outputs and drives to determine which behavior
 * state should be active. Returns the state name string.
 * Priority order (highest first): startle, fly, feed, groom, brace, rest, phototaxis, explore, walk, idle.
 */
function evaluateBehaviorEntry(behaviorObj, foodList, flyObj) {
	var b = BRAIN || (typeof window !== 'undefined' ? window.BRAIN : null);
	if (!b) return 'idle';

	var now = Date.now();
	var accumL = b.accumWalkLeft || 0;
	var accumR = b.accumWalkRight || 0;
	var totalWalk = accumL + accumR;

	var fearVal = (b.drives ? b.drives.fear : 0) * 50;
	var effectiveStartle = Math.max(b.accumStartle || 0, fearVal);
	if (effectiveStartle > BEHAVIOR_THRESHOLDS.startle && !isCoolingDown('startle', now, behaviorObj)) {
		return 'startle';
	}
	if ((b.accumFlight || 0) > BEHAVIOR_THRESHOLDS.fly && !isCoolingDown('fly', now, behaviorObj)) {
		return 'fly';
	}
	var hungerVal = b.drives ? b.drives.hunger : 0;
	var feedReady = (b.accumFeed || 0) > BEHAVIOR_THRESHOLDS.feed ||
		(hungerVal > 0.05 && b.stimulate && (b.stimulate.foodNearby || b.stimulate.foodContact));
	if (feedReady && hasNearbyFood(foodList, flyObj) && !isCoolingDown('feed', now, behaviorObj)) {
		return 'feed';
	}
	var groomUrge = b.drives ? (b.drives.groom || 0) : 0;
	var isGroomTriggered = (b.accumGroom || 0) > BEHAVIOR_THRESHOLDS.groom || groomUrge > 0.35;
	if (isGroomTriggered && !isCoolingDown('groom', now, behaviorObj)) {
		return 'groom';
	}
	if (b.stimulate && b.stimulate.wind && b.stimulate.windStrength < 0.5 &&
		(b.accumStartle || 0) < BEHAVIOR_THRESHOLDS.startle && !isCoolingDown('brace', now, behaviorObj)) {
		return 'brace';
	}
	var light = (b.stimulate && b.stimulate.lightLevel !== undefined) ? b.stimulate.lightLevel : 1.0;

	// In dark mode (light === 0), the fly quickly enters rest/sleep mode unless startled or eating nearby food
	if (light === 0 && (!b.drives || b.drives.fear < 0.2)) {
		var darkRestThreshold = 0.15;
		if (b.drives && (b.drives.fatigue > darkRestThreshold || b.drives.hunger < 0.8)) {
			return 'rest';
		}
	} else if (light <= 0.5) {
		// Dim mode: moderate rest threshold
		var dimRestThreshold = 0.45;
		if (b.drives && b.drives.fatigue > dimRestThreshold) {
			return 'rest';
		}
	} else {
		// Bright mode: normal fatigue rest threshold
		if (b.drives && b.drives.fatigue > BEHAVIOR_THRESHOLDS.restFatigue) {
			return 'rest';
		}
	}

	if (light > BEHAVIOR_THRESHOLDS.phototaxisLight &&
		b.drives && b.drives.curiosity > 0.2 && totalWalk > 3) {
		return 'phototaxis';
	}
	if (b.drives && b.drives.curiosity > BEHAVIOR_THRESHOLDS.exploreCuriosity && light > 0) {
		return 'explore';
	}
	if (totalWalk > BEHAVIOR_THRESHOLDS.walk && light > 0) {
		return 'walk';
	}
	return light === 0 ? 'rest' : 'explore';
}

// ============================================================
// Extracted Pure Functions for Testing (D68.2)
// These mirror inline logic from main.js and sim-worker.js
// so it can be exercised without DOM/Worker dependencies.
// ============================================================

var FEED_APPROACH_SPEED = 0.25;

/**
 * Pure extraction of food-seeking steering logic (main.js ~lines 859-862).
 * Returns the computed targetDir and seekStrength.
 */
function computeFoodSeekDir(flyX, flyY, foodX, foodY, hunger, facingDirVal) {
	var foodAngle = Math.atan2(-(foodY - flyY), foodX - flyX);
	var seekStrength = Math.min(1, hunger);
	var angleDiffToFood = normalizeAngle(foodAngle - facingDirVal);
	var targetDir = facingDirVal + angleDiffToFood * seekStrength;
	return { targetDir: targetDir, seekStrength: seekStrength };
}

/**
 * Pure extraction of food consumption progress (main.js ~lines 1760-1761).
 * Returns progress value clamped to [0, 1].
 */
function computeFoodProgress(foodItem, now) {
	var elapsed = now - foodItem.feedStart;
	var progress = Math.min(1, (foodItem.eaten || 0) + elapsed / foodItem.feedDuration);
	return progress;
}

/**
 * Pure extraction of pause-feeding logic (main.js ~lines 1773-1776).
 * Mutates foodItem in place: accumulates eaten progress and resets feedStart to 0.
 */
function pauseFeeding(foodItem, now) {
	if (foodItem.feedStart === 0) return;
	var ate = now - foodItem.feedStart;
	foodItem.eaten = Math.min(1, (foodItem.eaten || 0) + ate / foodItem.feedDuration);
	foodItem.feedStart = 0;
}
export { normalizeAngle, BEHAVIOR_THRESHOLDS, isCoolingDown, hasNearbyFood, evaluateBehaviorEntry };

const Errors = requireMain('errors');
const Utils = requireMain('utils');


const PRIZE_QUALITY_CLASSES = {
    NICE: "prize-nice",
    GOOD: "prize-good",
    GREAT: "prize-great",
    AMAZING: "prize-amazing",
    OMG: "prize-omg",
}

const YEMOTE_QUALITY_BY_TIER = [
    "yemote-tier-1",
    "yemote-tier-2",
    "yemote-tier-3",
    "yemote-tier-4",
    "yemote-tier-5",
]


class Prize {
    constructor(mod) {
        this.mod = mod;
    }

    async grant(username, displayName, details) {
        Errors.abstract();
        return {};
    }
}

class PokyecatsYarnPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarn(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "piece")} of yarn.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.NICE;
        return {text, html, quality};
    }
}

class PokyecatsYarnBallPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarnBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "yarn ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GOOD;
        return {text, html, quality};
    }
}

class PokyecatsGoldBallPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addGoldBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "gold ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GREAT;
        return {text, html, quality};
    }
}

class PokyecatsRainbowBallPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addRainbowBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "pretty ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GREAT;
        return {text, html, quality};
    }
}

class PokyecatsDarkBallPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addDarkBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "dark ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GREAT;
        return {text, html, quality};
    }
}

class PokyecatsCatchesPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addCatches(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "Pokyecats", "Pokyecatses")}!`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.AMAZING;
        return {text, html, quality};
    }
}

class PokyecatsShinyCatchesPrize extends Prize {
    async grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addShinyCatches(username, displayName, amount);
        let text = `${amount} SHINY ${Utils.plurality(amount, "POKYECATS", "POKYECATSES")}!!!`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.OMG;
        return {text, html, quality};
    }
}


class RandomTieredYippiePrize extends Prize {
    async grant(username, displayName, details) {
        let tier = details.tier;
        let yd = this.mod.yippies.giveRandomTieredYippie(username, tier, false);
        if (!yd) {
            return false;
        }

        let text = `the ${yd} Yemote`;
        let html = text;
        let quality = YEMOTE_QUALITY_BY_TIER[details.tier];
        let yippie = await this.mod.yippies.getYippieFile(yd);
        return {text, html, quality, imageURL: yippie.url};
    }
}


module.exports = {
    pokyecats: {
        yarn: (mod) => new PokyecatsYarnPrize(mod),
        yarnBall: (mod) => new PokyecatsYarnBallPrize(mod),
        goldBall: (mod) => new PokyecatsGoldBallPrize(mod),
        rainbowBall: (mod) => new PokyecatsRainbowBallPrize(mod),
        darkBall: (mod) => new PokyecatsDarkBallPrize(mod),
        catches: (mod) => new PokyecatsCatchesPrize(mod),
        shinyCatches: (mod) => new PokyecatsShinyCatchesPrize(mod),
    },
    yippies: {
        randomTiered: (mod) => new RandomTieredYippiePrize(mod),
    }
}
